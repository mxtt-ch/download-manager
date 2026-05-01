use sha2::{Sha256, Digest};
use std::path::Path;
use tokio::fs;
use tokio::io::AsyncReadExt;

/// 计算文件的 SHA256 哈希值（流式读取，避免大文件内存溢出）
pub async fn compute_sha256(path: &Path) -> Result<String, String> {
    let mut file = fs::File::open(path)
        .await
        .map_err(|e| format!("无法打开文件: {}", e))?;

    let mut hasher = Sha256::new();
    let mut buffer = vec![0u8; 8192];

    loop {
        let n = file
            .read(&mut buffer)
            .await
            .map_err(|e| format!("读取文件失败: {}", e))?;
        if n == 0 {
            break;
        }
        hasher.update(&buffer[..n]);
    }

    let hash = hasher.finalize();
    Ok(format!("{:x}", hash))
}

/// 验证文件哈希是否与期望值匹配
pub async fn verify_hash(path: &Path, expected: &str) -> Result<bool, String> {
    let actual = compute_sha256(path).await?;
    Ok(actual.to_lowercase() == expected.to_lowercase())
}
