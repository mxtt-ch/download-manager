use tauri::State;
use crate::db::DbState;
use crate::models::SiteAuth;

#[tauri::command]
pub fn get_sites(_db: State<'_, DbState>) -> Result<Vec<SiteAuth>, String> {
    // 将在后续任务中完整实现
    Ok(vec![])
}

#[tauri::command]
pub fn add_site(_db: State<'_, DbState>, _site: SiteAuth) -> Result<SiteAuth, String> {
    // 将在后续任务中完整实现
    Err("暂未实现".into())
}

#[tauri::command]
pub fn update_site(_db: State<'_, DbState>, _site: SiteAuth) -> Result<(), String> {
    // 将在后续任务中完整实现
    Err("暂未实现".into())
}

#[tauri::command]
pub fn delete_site(_db: State<'_, DbState>, _site_id: String) -> Result<(), String> {
    // 将在后续任务中完整实现
    Err("暂未实现".into())
}
