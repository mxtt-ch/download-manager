use rusqlite::{Connection, params};
use crate::models::Checkpoint;

/// 获取任务的所有检查点，按分块索引排序
pub fn get_by_task(conn: &Connection, task_id: &str) -> Vec<Checkpoint> {
    let mut stmt = conn.prepare(
        "SELECT id, task_id, chunk_index, start_byte, end_byte, downloaded_offset \
         FROM checkpoints WHERE task_id = ?1 ORDER BY chunk_index"
    ).unwrap();
    stmt.query_map(params![task_id], |row| {
        Ok(Checkpoint {
            id: row.get(0)?,
            task_id: row.get(1)?,
            chunk_index: row.get::<_, i64>(2)? as u32,
            start_byte: row.get::<_, i64>(3)? as u64,
            end_byte: row.get::<_, i64>(4)? as u64,
            downloaded_offset: row.get::<_, i64>(5)? as u64,
        })
    }).unwrap().filter_map(|r| r.ok()).collect()
}

/// 插入或更新检查点（UPSERT），依赖 UNIQUE(task_id, chunk_index) 约束
pub fn upsert(conn: &Connection, cp: &Checkpoint) -> Result<(), rusqlite::Error> {
    conn.execute(
        "INSERT INTO checkpoints (task_id, chunk_index, start_byte, end_byte, downloaded_offset) \
         VALUES (?1, ?2, ?3, ?4, ?5) \
         ON CONFLICT(task_id, chunk_index) DO UPDATE SET downloaded_offset = ?5",
        params![
            cp.task_id,
            cp.chunk_index as i64,
            cp.start_byte as i64,
            cp.end_byte as i64,
            cp.downloaded_offset as i64,
        ],
    )?;
    Ok(())
}

/// 删除任务的所有检查点
pub fn delete_by_task(conn: &Connection, task_id: &str) -> Result<(), rusqlite::Error> {
    conn.execute("DELETE FROM checkpoints WHERE task_id = ?1", params![task_id])?;
    Ok(())
}
