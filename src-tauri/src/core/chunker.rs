use reqwest::Client;
use std::time::Duration;

/// 文件探测结果
#[derive(Debug, Clone)]
pub struct ProbeResult {
    pub total_size: u64,
    pub supports_ranges: bool,
    pub content_type: Option<String>,
}

/// 发送 HEAD 请求探测文件信息
/// 确认服务器是否支持断点续传、获取文件大小与类型
pub async fn probe_url(client: &Client, url: &str) -> Result<ProbeResult, String> {
    let response = client
        .head(url)
        .timeout(Duration::from_secs(30))
        .send()
        .await
        .map_err(|e| format!("HEAD 请求失败: {}", e))?;

    let status = response.status();
    if !status.is_success() {
        return Err(format!("服务器返回错误状态: {}", status));
    }

    let total_size = response
        .headers()
        .get("content-length")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.parse::<u64>().ok())
        .unwrap_or(0);

    let supports_ranges = response
        .headers()
        .get("accept-ranges")
        .map(|v| v.to_str().unwrap_or("") == "bytes")
        .unwrap_or(false);

    let content_type = response
        .headers()
        .get("content-type")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());

    Ok(ProbeResult {
        total_size,
        supports_ranges,
        content_type,
    })
}

/// 计算分块区间
/// 对超大文件（>10GB）增大最小块大小，防止过多文件句柄
pub fn split_chunks(total_size: u64, thread_count: u32) -> Vec<(u64, u64)> {
    if total_size == 0 || thread_count == 0 {
        return vec![(0, 0)];
    }

    // 超大文件的最小块大小：1 MiB
    let min_chunk = if total_size > 10_737_418_240 {
        1_048_576
    } else {
        1 // 小文件无最小限制
    };

    let chunk_size = std::cmp::max(
        (total_size as f64 / thread_count as f64).ceil() as u64,
        min_chunk,
    );

    let mut chunks = Vec::new();
    let mut start = 0u64;
    while start < total_size {
        let end = std::cmp::min(start + chunk_size - 1, total_size - 1);
        chunks.push((start, end));
        start = end + 1;
    }
    chunks
}
