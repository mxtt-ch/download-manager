use tauri::State;
use uuid::Uuid;
use crate::db::DbState;
use crate::db::queues;
use crate::models::queue::Queue;

/// 获取所有下载队列
#[tauri::command]
pub fn get_queues(db: State<'_, DbState>) -> Result<Vec<Queue>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    Ok(queues::get_all(&conn))
}

/// 创建新的下载队列
#[tauri::command]
pub fn create_queue(db: State<'_, DbState>, name: String, icon: Option<String>) -> Result<Queue, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let existing = queues::get_all(&conn);
    let queue = Queue {
        id: Uuid::new_v4().to_string(),
        name,
        sort_weight: existing.len() as i32,
        icon,
    };
    queues::insert(&conn, &queue).map_err(|e| e.to_string())?;
    Ok(queue)
}

/// 删除下载队列
#[tauri::command]
pub fn delete_queue(db: State<'_, DbState>, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    // 不允许删除默认队列
    if id == "queue-default" {
        return Err("默认队列不可删除".to_string());
    }
    queues::delete(&conn, &id).map_err(|e| e.to_string())
}
