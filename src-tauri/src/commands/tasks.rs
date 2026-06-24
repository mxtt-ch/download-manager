use tauri::State;
use uuid::Uuid;
use chrono::Utc;
use crate::db::DbState;
use crate::db::{tasks, checkpoints};
use crate::models::task::*;

/// 创建下载任务
#[tauri::command]
pub fn create_task(
    db: State<'_, DbState>,
    payload: CreateTaskPayload,
) -> Result<DownloadTask, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let id = Uuid::new_v4().to_string();
    let filename = payload.filename.unwrap_or_else(|| {
        payload.url.split('/').last()
            .unwrap_or("未命名文件")
            .to_string()
    });

    let task = DownloadTask {
        id,
        url: payload.url,
        filename,
        status: TaskStatus::Pending,
        save_path: payload.save_path,
        queue_id: payload.queue_id,
        category_id: None, // 可在后续通过分类匹配填充
        thread_count: payload.thread_count.unwrap_or(4),
        total_size: 0,
        downloaded_size: 0,
        supports_ranges: None,
        expected_hash: None,
        error_code: None,
        speed: None,
        created_at: Utc::now().timestamp_millis(),
        started_at: None,
        completed_at: None,
    };

    tasks::insert(&conn, &task).map_err(|e| e.to_string())?;
    Ok(task)
}

/// 获取任务列表
#[tauri::command]
pub fn get_tasks(
    db: State<'_, DbState>,
    filter: String,
    queue_id: Option<String>,
) -> Result<Vec<DownloadTask>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    Ok(tasks::get_all(&conn, &filter, queue_id.as_deref()))
}

/// 获取任务详情
#[tauri::command]
pub fn get_task_detail(
    db: State<'_, DbState>,
    id: String,
) -> Result<TaskDetail, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let task = tasks::get_by_id(&conn, &id).ok_or("任务不存在")?;
    let cps = checkpoints::get_by_task(&conn, &id);

    // 从检查点构建线程信息
    let threads: Vec<ThreadInfo> = cps.iter().map(|cp| {
        ThreadInfo {
            chunk_index: cp.chunk_index,
            start_byte: cp.start_byte,
            end_byte: cp.end_byte,
            downloaded_offset: cp.downloaded_offset,
            speed: 0,
            status: if cp.downloaded_offset >= cp.end_byte {
                "completed".to_string()
            } else if cp.downloaded_offset > cp.start_byte {
                "downloading".to_string()
            } else {
                "idle".to_string()
            },
        }
    }).collect();

    // 构建基本日志
    let mut logs = vec![
        TaskLog {
            timestamp: task.created_at,
            level: "info".to_string(),
            message: "任务已创建".to_string(),
        },
    ];
    if let Some(started) = task.started_at {
        logs.push(TaskLog {
            timestamp: started,
            level: "info".to_string(),
            message: "开始下载".to_string(),
        });
    }
    if let Some(ref err) = task.error_code {
        logs.push(TaskLog {
            timestamp: Utc::now().timestamp_millis(),
            level: "error".to_string(),
            message: format!("错误: {}", err),
        });
    }

    Ok(TaskDetail { task, threads, logs })
}

/// 暂停任务
#[tauri::command]
pub fn pause_task(db: State<'_, DbState>, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    tasks::update_status(&conn, &id, &TaskStatus::Paused).map_err(|e| e.to_string())?;
    Ok(())
}

/// 恢复任务
#[tauri::command]
pub fn resume_task(db: State<'_, DbState>, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    tasks::update_status(&conn, &id, &TaskStatus::Downloading).map_err(|e| e.to_string())?;
    Ok(())
}

/// 删除任务
#[tauri::command]
pub fn delete_task(db: State<'_, DbState>, id: String, delete_file: bool) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    // 如果需要同时删除本地文件
    if delete_file {
        if let Some(task) = tasks::get_by_id(&conn, &id) {
            let file_path = std::path::PathBuf::from(&task.save_path).join(&task.filename);
            let _ = std::fs::remove_file(&file_path);
        }
    }

    tasks::delete(&conn, &id).map_err(|e| e.to_string())?;
    Ok(())
}

/// 重试失败的任务
#[tauri::command]
pub fn retry_task(db: State<'_, DbState>, id: String) -> Result<DownloadTask, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    // 验证任务存在
    tasks::get_by_id(&conn, &id).ok_or("任务不存在")?;

    // 重置状态和进度
    tasks::update_status(&conn, &id, &TaskStatus::Pending).map_err(|e| e.to_string())?;
    tasks::update_progress(&conn, &id, 0).map_err(|e| e.to_string())?;

    // 清除错误码（需要 UPDATE 语句扩展）
    conn.execute(
        "UPDATE tasks SET error_code = NULL WHERE id = ?1",
        rusqlite::params![id],
    ).map_err(|e| e.to_string())?;

    // 删除旧检查点
    checkpoints::delete_by_task(&conn, &id).map_err(|e| e.to_string())?;

    // 返回更新后的任务
    tasks::get_by_id(&conn, &id).ok_or("任务更新失败".to_string())
}
