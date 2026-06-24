use rusqlite::{Connection, params};
use crate::models::Queue;

/// 获取所有队列，按排序权重升序排列
pub fn get_all(conn: &Connection) -> Vec<Queue> {
    let mut stmt = conn.prepare(
        "SELECT id, name, sort_weight, icon FROM queues ORDER BY sort_weight"
    ).unwrap();
    stmt.query_map([], |row| {
        Ok(Queue {
            id: row.get(0)?,
            name: row.get(1)?,
            sort_weight: row.get(2)?,
            icon: row.get(3)?,
        })
    }).unwrap().filter_map(|r| r.ok()).collect()
}

/// 创建新队列
pub fn insert(conn: &Connection, q: &Queue) -> Result<(), rusqlite::Error> {
    conn.execute(
        "INSERT INTO queues (id, name, sort_weight, icon) VALUES (?1, ?2, ?3, ?4)",
        params![q.id, q.name, q.sort_weight, q.icon],
    )?;
    Ok(())
}

/// 删除队列
pub fn delete(conn: &Connection, id: &str) -> Result<(), rusqlite::Error> {
    conn.execute("DELETE FROM queues WHERE id = ?1", params![id])?;
    Ok(())
}
