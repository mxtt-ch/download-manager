use tauri::State;
use uuid::Uuid;
use crate::db::DbState;
use crate::db::site_auth;
use crate::models::site::SiteAuth;

/// 获取所有站点认证信息
#[tauri::command]
pub fn get_sites(db: State<'_, DbState>) -> Result<Vec<SiteAuth>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    Ok(site_auth::get_all(&conn))
}

/// 添加站点认证信息
#[tauri::command]
pub fn add_site(db: State<'_, DbState>, payload: SiteAuth) -> Result<SiteAuth, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut site = payload;
    site.id = Uuid::new_v4().to_string();
    site.quota_used = 0;
    site.login_status = "unknown".to_string();
    site_auth::insert(&conn, &site).map_err(|e| e.to_string())?;
    Ok(site)
}

/// 更新站点认证信息
#[tauri::command]
pub fn update_site(db: State<'_, DbState>, payload: SiteAuth) -> Result<SiteAuth, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    site_auth::update(&conn, &payload).map_err(|e| e.to_string())?;
    Ok(payload)
}

/// 删除站点认证信息
#[tauri::command]
pub fn delete_site(db: State<'_, DbState>, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    site_auth::delete(&conn, &id).map_err(|e| e.to_string())
}
