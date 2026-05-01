use rusqlite::Connection;
use crate::models::{DownloadTask, TaskStatus};

/// 占位实现 — 将在 Task 19 中完善
pub fn get_all(_conn: &Connection, _filter: &str, _queue_id: Option<&str>) -> Vec<DownloadTask> {
    vec![]
}
