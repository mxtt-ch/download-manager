use tauri::State;
use crate::config::AppState;
use crate::models::AppConfig;

#[tauri::command]
pub fn get_settings(_state: State<'_, AppState>) -> Result<AppConfig, String> {
    // 将在后续任务中完整实现
    let config = _state.config.lock().map_err(|e| e.to_string())?;
    Ok(config.clone())
}

#[tauri::command]
pub fn update_settings(_state: State<'_, AppState>, _config: AppConfig) -> Result<(), String> {
    // 将在后续任务中完整实现
    Err("暂未实现".into())
}

/// 分类条目（占位定义，后续移至 models）
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Category {
    pub id: String,
    pub name: String,
    pub extensions: Vec<String>,
    pub save_path: Option<String>,
    pub label: Option<String>,
    pub icon: Option<String>,
}

#[tauri::command]
pub fn get_categories(_state: State<'_, AppState>) -> Result<Vec<Category>, String> {
    // 将在后续任务中完整实现
    Ok(vec![])
}

#[tauri::command]
pub fn upsert_category(_state: State<'_, AppState>, _category: Category) -> Result<(), String> {
    // 将在后续任务中完整实现
    Err("暂未实现".into())
}

#[tauri::command]
pub fn delete_category(_state: State<'_, AppState>, _category_id: String) -> Result<(), String> {
    // 将在后续任务中完整实现
    Err("暂未实现".into())
}
