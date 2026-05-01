use rusqlite::Connection;
use std::sync::Mutex;

/// 数据库全局状态
pub struct DbState {
    pub conn: Mutex<Connection>,
}

/// 初始化数据库连接并启用 WAL 模式和外键约束
pub fn init_db(db_path: &str) -> Result<Connection, rusqlite::Error> {
    let conn = Connection::open(db_path)?;
    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;
    Ok(conn)
}
