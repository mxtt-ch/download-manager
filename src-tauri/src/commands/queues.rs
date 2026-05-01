use tauri::State;
use crate::db::DbState;
use crate::models::Queue;

#[tauri::command]
pub fn get_queues(_db: State<'_, DbState>) -> Result<Vec<Queue>, String> {
    // 将在后续任务中完整实现
    Ok(vec![])
}

#[tauri::command]
pub fn create_queue(_db: State<'_, DbState>, _name: String, _icon: Option<String>) -> Result<Queue, String> {
    // 将在后续任务中完整实现
    Err("暂未实现".into())
}

#[tauri::command]
pub fn delete_queue(_db: State<'_, DbState>, _queue_id: String) -> Result<(), String> {
    // 将在后续任务中完整实现
    Err("暂未实现".into())
}
