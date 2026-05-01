use std::path::PathBuf;
use tokio::fs;
use tokio::io::AsyncWriteExt;

/// 按顺序合并分块文件到目标文件
pub async fn merge_chunks(temp_dir: &PathBuf, dest_path: &PathBuf) -> Result<(), String> {
    // 读取所有 .part 临时文件并按分块索引排序
    let mut entries = fs::read_dir(temp_dir)
        .await
        .map_err(|e| format!("无法读取临时目录: {}", e))?;

    let mut parts: Vec<(u32, PathBuf)> = Vec::new();
    while let Some(entry) = entries.next_entry().await.map_err(|e| format!("{}", e))? {
        let path = entry.path();
        if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
            if name.starts_with(".part") {
                if let Ok(idx) = name[5..].parse::<u32>() {
                    parts.push((idx, path));
                }
            }
        }
    }
    parts.sort_by_key(|(i, _)| *i);

    // 创建目标文件并按顺序写入各分块数据
    let mut dest = fs::File::create(dest_path)
        .await
        .map_err(|e| format!("无法创建目标文件: {}", e))?;

    for (_, part_path) in &parts {
        let data = fs::read(part_path)
            .await
            .map_err(|e| format!("读取分块失败: {}", e))?;
        dest.write_all(&data)
            .await
            .map_err(|e| format!("写入目标文件失败: {}", e))?;
    }

    dest.flush()
        .await
        .map_err(|e| format!("刷新缓冲区失败: {}", e))?;
    Ok(())
}
