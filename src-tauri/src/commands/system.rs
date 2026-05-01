use crate::models::DiskInfo;

#[tauri::command]
pub fn get_disk_space(_path: String) -> Result<DiskInfo, String> {
    // 将在后续任务中完整实现
    Err("暂未实现".into())
}
