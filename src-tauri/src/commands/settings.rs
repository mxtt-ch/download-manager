use tauri::State;
use crate::config::AppState;
use crate::db::DbState;
use crate::db::categories;
use crate::models::settings::AppConfig;
use crate::models::category::Category;

/// 获取应用配置
#[tauri::command]
pub fn get_settings(config: State<'_, AppState>) -> Result<AppConfig, String> {
    let cfg = config.config.lock().map_err(|e| e.to_string())?;
    Ok(cfg.clone())
}

/// 更新应用配置
#[tauri::command]
pub fn update_settings(
    config: State<'_, AppState>,
    section: AppConfig,
) -> Result<AppConfig, String> {
    let mut cfg = config.config.lock().map_err(|e| e.to_string())?;
    *cfg = section;

    // 持久化到文件
    let app_dir = config.app_dir.lock().map_err(|e| e.to_string())?;
    let path = app_dir.join("config.json");
    let content = serde_json::to_string_pretty(&*cfg).map_err(|e| e.to_string())?;
    std::fs::write(&path, content).map_err(|e| e.to_string())?;

    Ok(cfg.clone())
}

/// 获取所有分类
#[tauri::command]
pub fn get_categories(db: State<'_, DbState>) -> Result<Vec<Category>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    Ok(categories::get_all(&conn))
}

/// 插入或更新分类
#[tauri::command]
pub fn upsert_category(db: State<'_, DbState>, cat: Category) -> Result<Category, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    categories::upsert(&conn, &cat).map_err(|e| e.to_string())?;
    Ok(cat)
}

/// 删除分类
#[tauri::command]
pub fn delete_category(db: State<'_, DbState>, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    categories::delete(&conn, &id).map_err(|e| e.to_string())
}
