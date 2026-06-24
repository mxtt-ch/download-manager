use futures_util::StreamExt;
use reqwest::Client;
use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use crate::core::limiter::RateLimiter;

/// 下载单个分块到临时文件
/// 返回实际下载的字节数
pub async fn download_chunk(
    client: &Client,
    url: &str,
    start_byte: u64,
    end_byte: u64,
    chunk_index: u32,
    task_id: &str,
    temp_dir: &PathBuf,
    limiter: Option<Arc<RateLimiter>>,
    app_handle: &AppHandle,
) -> Result<u64, String> {
    let range_header = format!("bytes={}-{}", start_byte, end_byte);

    let response = client
        .get(url)
        .header("Range", &range_header)
        .send()
        .await
        .map_err(|e| format!("分块 {} 下载失败: {}", chunk_index, e))?;

    if !response.status().is_success() && response.status().as_u16() != 206 {
        return Err(format!(
            "分块 {} 服务器返回: {}",
            chunk_index,
            response.status()
        ));
    }

    let part_path = temp_dir.join(format!(".part{}", chunk_index));
    let mut file = OpenOptions::new()
        .create(true)
        .write(true)
        .open(&part_path)
        .map_err(|e| format!("无法创建临时文件: {}", e))?;

    let mut downloaded: u64 = 0;
    let mut last_emit = std::time::Instant::now();
    let emit_interval = std::time::Duration::from_millis(200);

    let mut stream = response.bytes_stream();

    while let Some(chunk_result) = stream.next().await {
        let bytes = chunk_result.map_err(|e| format!("分块 {} 读取错误: {}", chunk_index, e))?;

        // 限速检查：消耗令牌桶中的令牌
        if let Some(ref limiter) = limiter {
            limiter.acquire(bytes.len() as u64).await;
        }

        file.write_all(&bytes)
            .map_err(|e| format!("写入错误: {}", e))?;
        downloaded += bytes.len() as u64;

        // 每 200ms 向前端推送进度事件，驱动线程进度可视化
        if last_emit.elapsed() >= emit_interval {
            let _ = app_handle.emit(
                "download:progress",
                serde_json::json!({
                    "taskId": task_id,
                    "chunkIndex": chunk_index,
                    "offset": start_byte + downloaded,
                    "total": end_byte + 1 - start_byte,
                }),
            );
            last_emit = std::time::Instant::now();
        }
    }

    Ok(downloaded)
}
