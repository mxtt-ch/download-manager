use rusqlite::{Connection, params};
use crate::models::{DownloadTask, TaskStatus};

/// 根据过滤条件和可选队列 ID 获取任务列表
pub fn get_all(conn: &Connection, filter: &str, queue_id: Option<&str>) -> Vec<DownloadTask> {
    let mut sql = String::from(
        "SELECT id, url, filename, status, save_path, queue_id, category_id, \
         thread_count, total_size, downloaded_size, supports_ranges, expected_hash, \
         error_code, created_at, started_at, completed_at FROM tasks WHERE 1=1"
    );

    if filter != "all" {
        sql.push_str(&format!(" AND status = '{}'", filter));
    }
    if let Some(qid) = queue_id {
        sql.push_str(&format!(" AND queue_id = '{}'", qid));
    }
    sql.push_str(" ORDER BY created_at DESC");

    let mut stmt = conn.prepare(&sql).unwrap();
    stmt.query_map([], |row| {
        Ok(DownloadTask {
            id: row.get(0)?,
            url: row.get(1)?,
            filename: row.get(2)?,
            status: parse_status(&row.get::<_, String>(3)?),
            save_path: row.get(4)?,
            queue_id: row.get(5)?,
            category_id: row.get(6)?,
            thread_count: row.get::<_, i64>(7)? as u32,
            total_size: row.get::<_, i64>(8)? as u64,
            downloaded_size: row.get::<_, i64>(9)? as u64,
            supports_ranges: row.get(10)?,
            expected_hash: row.get(11)?,
            error_code: row.get(12)?,
            speed: None,
            created_at: row.get(13)?,
            started_at: row.get(14)?,
            completed_at: row.get(15)?,
        })
    }).unwrap().filter_map(|r| r.ok()).collect()
}

/// 根据 ID 获取单个任务
pub fn get_by_id(conn: &Connection, id: &str) -> Option<DownloadTask> {
    let mut stmt = conn.prepare(
        "SELECT id, url, filename, status, save_path, queue_id, category_id, \
         thread_count, total_size, downloaded_size, supports_ranges, expected_hash, \
         error_code, created_at, started_at, completed_at FROM tasks WHERE id = ?1"
    ).ok()?;

    stmt.query_row(params![id], |row| {
        Ok(DownloadTask {
            id: row.get(0)?,
            url: row.get(1)?,
            filename: row.get(2)?,
            status: parse_status(&row.get::<_, String>(3)?),
            save_path: row.get(4)?,
            queue_id: row.get(5)?,
            category_id: row.get(6)?,
            thread_count: row.get::<_, i64>(7)? as u32,
            total_size: row.get::<_, i64>(8)? as u64,
            downloaded_size: row.get::<_, i64>(9)? as u64,
            supports_ranges: row.get(10)?,
            expected_hash: row.get(11)?,
            error_code: row.get(12)?,
            speed: None,
            created_at: row.get(13)?,
            started_at: row.get(14)?,
            completed_at: row.get(15)?,
        })
    }).ok()
}

/// 插入新任务
pub fn insert(conn: &Connection, task: &DownloadTask) -> Result<(), rusqlite::Error> {
    conn.execute(
        "INSERT INTO tasks (id, url, filename, status, save_path, queue_id, category_id, \
         thread_count, total_size, downloaded_size, supports_ranges, expected_hash, \
         error_code, created_at, started_at, completed_at) \
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)",
        params![
            task.id,
            task.url,
            task.filename,
            task.status.to_string(),
            task.save_path,
            task.queue_id,
            task.category_id,
            task.thread_count as i64,
            task.total_size as i64,
            task.downloaded_size as i64,
            task.supports_ranges,
            task.expected_hash,
            task.error_code,
            task.created_at,
            task.started_at,
            task.completed_at,
        ],
    )?;
    Ok(())
}

/// 更新任务状态
pub fn update_status(conn: &Connection, id: &str, status: &TaskStatus) -> Result<(), rusqlite::Error> {
    conn.execute(
        "UPDATE tasks SET status = ?1 WHERE id = ?2",
        params![status.to_string(), id],
    )?;
    Ok(())
}

/// 更新下载进度
pub fn update_progress(conn: &Connection, id: &str, downloaded: u64) -> Result<(), rusqlite::Error> {
    conn.execute(
        "UPDATE tasks SET downloaded_size = ?1 WHERE id = ?2",
        params![downloaded as i64, id],
    )?;
    Ok(())
}

/// 更新任务的总大小和是否支持范围请求
pub fn update_file_info(conn: &Connection, id: &str, total_size: u64, supports_ranges: bool) -> Result<(), rusqlite::Error> {
    conn.execute(
        "UPDATE tasks SET total_size = ?1, supports_ranges = ?2 WHERE id = ?3",
        params![total_size as i64, supports_ranges, id],
    )?;
    Ok(())
}

/// 删除任务
pub fn delete(conn: &Connection, id: &str) -> Result<(), rusqlite::Error> {
    conn.execute("DELETE FROM tasks WHERE id = ?1", params![id])?;
    Ok(())
}

/// 解析状态字符串为 TaskStatus 枚举
fn parse_status(s: &str) -> TaskStatus {
    match s {
        "Pending" => TaskStatus::Pending,
        "Downloading" => TaskStatus::Downloading,
        "Paused" => TaskStatus::Paused,
        "Completed" => TaskStatus::Completed,
        "Error" => TaskStatus::Error,
        "Merging" => TaskStatus::Merging,
        "Checking" => TaskStatus::Checking,
        _ => TaskStatus::Pending,
    }
}
