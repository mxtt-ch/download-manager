use tauri::State;
use crate::db::DbState;
use crate::models::{DownloadTask, TaskDetail, CreateTaskPayload};

#[tauri::command]
pub fn get_tasks(_db: State<'_, DbState>) -> Result<Vec<DownloadTask>, String> {
    // 将在后续任务中完整实现
    Ok(vec![])
}

#[tauri::command]
pub fn get_task_detail(_db: State<'_, DbState>, _task_id: String) -> Result<TaskDetail, String> {
    // 将在后续任务中完整实现
    Err("暂未实现".into())
}

#[tauri::command]
pub fn create_task(_db: State<'_, DbState>, _payload: CreateTaskPayload) -> Result<DownloadTask, String> {
    // 将在后续任务中完整实现
    Err("暂未实现".into())
}

#[tauri::command]
pub fn pause_task(_db: State<'_, DbState>, _task_id: String) -> Result<(), String> {
    // 将在后续任务中完整实现
    Err("暂未实现".into())
}

#[tauri::command]
pub fn resume_task(_db: State<'_, DbState>, _task_id: String) -> Result<(), String> {
    // 将在后续任务中完整实现
    Err("暂未实现".into())
}

#[tauri::command]
pub fn delete_task(_db: State<'_, DbState>, _task_id: String, _delete_local_file: bool) -> Result<(), String> {
    // 将在后续任务中完整实现
    Err("暂未实现".into())
}

#[tauri::command]
pub fn retry_task(_db: State<'_, DbState>, _task_id: String) -> Result<(), String> {
    // 将在后续任务中完整实现
    Err("暂未实现".into())
}
