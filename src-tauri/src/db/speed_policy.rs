use rusqlite::{Connection, params};
use crate::models::SpeedPolicy;

/// 获取所有速度策略
pub fn get_all(conn: &Connection) -> Vec<SpeedPolicy> {
    let mut stmt = conn.prepare(
        "SELECT id, name, download_limit, upload_limit, mode, schedule, is_active FROM speed_policy"
    ).unwrap();
    stmt.query_map([], |row| {
        Ok(SpeedPolicy {
            id: row.get(0)?,
            name: row.get(1)?,
            download_limit: row.get::<_, Option<i64>>(2).ok().flatten().map(|v| v as u64),
            upload_limit: row.get::<_, Option<i64>>(3).ok().flatten().map(|v| v as u64),
            mode: row.get(4)?,
            schedule: row.get(5)?,
            is_active: row.get(6)?,
        })
    }).unwrap().filter_map(|r| r.ok()).collect()
}

/// 插入速度策略
pub fn insert(conn: &Connection, policy: &SpeedPolicy) -> Result<(), rusqlite::Error> {
    conn.execute(
        "INSERT INTO speed_policy (id, name, download_limit, upload_limit, mode, schedule, is_active) \
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            policy.id,
            policy.name,
            policy.download_limit.map(|v| v as i64),
            policy.upload_limit.map(|v| v as i64),
            policy.mode,
            policy.schedule,
            policy.is_active,
        ],
    )?;
    Ok(())
}

/// 更新速度策略
pub fn update(conn: &Connection, policy: &SpeedPolicy) -> Result<(), rusqlite::Error> {
    conn.execute(
        "UPDATE speed_policy SET name=?1, download_limit=?2, upload_limit=?3, \
         mode=?4, schedule=?5, is_active=?6 WHERE id=?7",
        params![
            policy.name,
            policy.download_limit.map(|v| v as i64),
            policy.upload_limit.map(|v| v as i64),
            policy.mode,
            policy.schedule,
            policy.is_active,
            policy.id,
        ],
    )?;
    Ok(())
}

/// 删除速度策略
pub fn delete(conn: &Connection, id: &str) -> Result<(), rusqlite::Error> {
    conn.execute("DELETE FROM speed_policy WHERE id = ?1", params![id])?;
    Ok(())
}
