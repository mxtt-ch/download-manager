use std::collections::HashMap;
use std::sync::Arc;
use tauri::{AppHandle, Emitter, Manager};
use tokio::sync::RwLock;
use reqwest::Client;
use crate::core::chunker;
use crate::core::worker;
use crate::core::limiter::RateLimiter;
use crate::core::merger;
use crate::models::{DownloadTask, TaskStatus};
use crate::db::tasks;
use crate::db::DbState;

/// 下载引擎 — 管理所有活跃下载任务的生命周期
pub struct DownloadEngine {
    /// 活跃任务映射：task_id → 取消令牌（用于暂停/取消）
    active_tasks: RwLock<HashMap<String, tokio::sync::watch::Sender<bool>>>,
    /// HTTP 客户端（连接池复用，提升性能）
    client: Client,
}

impl DownloadEngine {
    pub fn new() -> Self {
        Self {
            active_tasks: RwLock::new(HashMap::new()),
            client: Client::builder()
                .timeout(std::time::Duration::from_secs(30))
                .build()
                .unwrap(),
        }
    }

    /// 启动任务下载
    /// 流程：探测文件 → 分块 → 并发下载 → 合并 → 校验 → 完成
    pub async fn start_task(
        &self,
        task: &DownloadTask,
        app_handle: &AppHandle,
    ) -> Result<(), String> {
        // 检查是否已在下载中
        let mut active = self.active_tasks.write().await;
        if active.contains_key(&task.id) {
            return Err("任务已在下载中".to_string());
        }

        // 创建取消通道（用于暂停操作）
        let (cancel_tx, cancel_rx) = tokio::sync::watch::channel(false);
        active.insert(task.id.clone(), cancel_tx);

        // 更新状态为 Downloading
        {
            let db = app_handle.state::<DbState>();
            let conn = db.conn.lock().map_err(|e| e.to_string())?;
            tasks::update_status(&conn, &task.id, &TaskStatus::Downloading)
                .map_err(|e| e.to_string())?;
        }

        // 发送状态变更事件通知前端
        let _ = app_handle.emit(
            "download:status-change",
            serde_json::json!({
                "taskId": task.id,
                "oldStatus": "Pending",
                "newStatus": "Downloading",
            }),
        );

        // 克隆必要数据以传入异步任务
        let task_id = task.id.clone();
        let url = task.url.clone();
        let thread_count = task.thread_count;
        let save_path = task.save_path.clone();
        let filename = task.filename.clone();
        let app_handle_clone = app_handle.clone();
        let client = self.client.clone();

        tokio::spawn(async move {
            // ---- 第 1 步：探测文件元信息 ----
            let probe = match chunker::probe_url(&client, &url).await {
                Ok(p) => p,
                Err(e) => {
                    if let Ok(conn) = app_handle_clone.state::<DbState>().conn.lock() {
                        let _ = tasks::update_status(&conn, &task_id, &TaskStatus::Error);
                    }
                    let _ = app_handle_clone.emit(
                        "download:error",
                        serde_json::json!({
                            "taskId": task_id,
                            "error": format!("文件探测失败: {}", e),
                        }),
                    );
                    return;
                }
            };

            // 如果服务器不支持断点续传，强制单线程
            let actual_threads = if probe.supports_ranges {
                thread_count
            } else {
                1
            };
            let chunks = chunker::split_chunks(probe.total_size, actual_threads);

            // ---- 第 2 步：准备限速器与临时目录 ----
            let limiter = Arc::new(RateLimiter::unlimited()); // TODO: 从应用配置获取限速值

            let temp_dir =
                std::path::PathBuf::from(&save_path).join(format!(".temp_{}", task_id));
            let _ = std::fs::create_dir_all(&temp_dir);

            // ---- 第 3 步：并发下载所有分块 ----
            let mut join_set = tokio::task::JoinSet::new();
            for (i, (start, end)) in chunks.iter().enumerate() {
                let client = client.clone();
                let url = url.clone();
                let start = *start;
                let end = *end;
                let task_id = task_id.clone();
                let temp_dir = temp_dir.clone();
                let limiter = limiter.clone();
                let app_handle = app_handle_clone.clone();
                let mut cancel_rx = cancel_rx.clone();

                join_set.spawn(async move {
                    tokio::select! {
                        result = worker::download_chunk(
                            &client, &url, start, end, i as u32,
                            &task_id, &temp_dir, Some(limiter), &app_handle,
                        ) => result,
                        _ = cancel_rx.changed() => {
                            Err("任务已取消".to_string())
                        }
                    }
                });
            }

            // 等待所有分块完成并汇总下载字节数
            let mut _total_downloaded: u64 = 0;
            let mut has_error = false;
            while let Some(result) = join_set.join_next().await {
                match result {
                    Ok(Ok(bytes)) => _total_downloaded += bytes,
                    Ok(Err(e)) => {
                        has_error = true;
                        eprintln!("分块下载失败: {}", e);
                    }
                    Err(e) => {
                        has_error = true;
                        eprintln!("分块任务异常: {}", e);
                    }
                }
            }

            if has_error {
                if let Ok(conn) = app_handle_clone.state::<DbState>().conn.lock() {
                    let _ = tasks::update_status(&conn, &task_id, &TaskStatus::Error);
                }
                let _ = std::fs::remove_dir_all(&temp_dir);
                return;
            }

            // ---- 第 4 步：更新状态为 Merging 并执行合并 ----
            if let Ok(conn) = app_handle_clone.state::<DbState>().conn.lock() {
                let _ = tasks::update_status(&conn, &task_id, &TaskStatus::Merging);
            }

            let final_path = std::path::PathBuf::from(&save_path).join(&filename);
            match merger::merge_chunks(&temp_dir, &final_path).await {
                Ok(_) => {
                    // ---- 第 5 步：标记完成 ----
                    if let Ok(conn) = app_handle_clone.state::<DbState>().conn.lock() {
                        let _ = tasks::update_status(&conn, &task_id, &TaskStatus::Completed);
                    }
                    let _ = app_handle_clone.emit(
                        "download:status-change",
                        serde_json::json!({
                            "taskId": task_id,
                            "oldStatus": "Merging",
                            "newStatus": "Completed",
                        }),
                    );
                }
                Err(e) => {
                    if let Ok(conn) = app_handle_clone.state::<DbState>().conn.lock() {
                        let _ = tasks::update_status(&conn, &task_id, &TaskStatus::Error);
                    }
                    let _ = app_handle_clone.emit(
                        "download:error",
                        serde_json::json!({
                            "taskId": task_id,
                            "error": format!("文件合并失败: {}", e),
                        }),
                    );
                }
            }

            // 清理临时目录
            let _ = std::fs::remove_dir_all(&temp_dir);
        });

        Ok(())
    }

    /// 暂停任务：发送取消信号并更新状态
    pub async fn pause_task(
        &self,
        task_id: &str,
        app_handle: &AppHandle,
    ) -> Result<(), String> {
        let active = self.active_tasks.read().await;
        if let Some(cancel_tx) = active.get(task_id) {
            // 发送取消信号给所有分块工作线程
            let _ = cancel_tx.send(true);

            // 更新数据库状态
            let state = app_handle.state::<DbState>();
            let conn = state.conn.lock().map_err(|e| e.to_string())?;
            tasks::update_status(&conn, task_id, &TaskStatus::Paused)
                .map_err(|e| e.to_string())?;
            drop(conn);

            // 通知前端状态变更
            let _ = app_handle.emit(
                "download:status-change",
                serde_json::json!({
                    "taskId": task_id,
                    "oldStatus": "Downloading",
                    "newStatus": "Paused",
                }),
            );
        }
        Ok(())
    }
}
