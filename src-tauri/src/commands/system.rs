use crate::models::queue::DiskInfo;

/// 获取磁盘空间信息
#[tauri::command]
pub fn get_disk_space(path: String) -> Result<DiskInfo, String> {
    use sysinfo::Disks;
    let disks = Disks::new_with_refreshed_list();
    for disk in disks.list() {
        let mount = disk.mount_point().to_str().unwrap_or("");
        if path.starts_with(mount) {
            return Ok(DiskInfo {
                total: disk.total_space(),
                free: disk.available_space(),
                used: disk.total_space() - disk.available_space(),
            });
        }
    }
    // 如果没有匹配的磁盘，返回默认值
    Ok(DiskInfo {
        total: 0,
        free: 0,
        used: 0,
    })
}
