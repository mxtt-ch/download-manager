use rusqlite::Connection;
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
