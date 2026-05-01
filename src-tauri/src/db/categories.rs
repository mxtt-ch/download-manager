use rusqlite::{Connection, params};
use crate::models::Category;

/// 获取所有文件分类
pub fn get_all(conn: &Connection) -> Vec<Category> {
    let mut stmt = conn.prepare(
        "SELECT id, name, icon, default_path, post_action, file_extensions, labels FROM categories"
    ).unwrap();
    stmt.query_map([], |row| {
        let exts_str: String = row.get(5)?;
        let labels_str: String = row.get(6)?;
        Ok(Category {
            id: row.get(0)?,
            name: row.get(1)?,
            icon: row.get(2)?,
            default_path: row.get(3)?,
            post_action: row.get(4)?,
            file_extensions: serde_json::from_str(&exts_str).unwrap_or_default(),
            labels: serde_json::from_str(&labels_str).unwrap_or_default(),
        })
    }).unwrap().filter_map(|r| r.ok()).collect()
}

/// 插入或更新分类（UPSERT）
pub fn upsert(conn: &Connection, cat: &Category) -> Result<(), rusqlite::Error> {
    conn.execute(
        "INSERT INTO categories (id, name, icon, default_path, post_action, file_extensions, labels) \
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7) \
         ON CONFLICT(id) DO UPDATE SET name=?2, icon=?3, default_path=?4, post_action=?5, file_extensions=?6, labels=?7",
        params![
            cat.id,
            cat.name,
            cat.icon,
            cat.default_path,
            cat.post_action,
            serde_json::to_string(&cat.file_extensions).unwrap(),
            serde_json::to_string(&cat.labels).unwrap(),
        ],
    )?;
    Ok(())
}

/// 删除分类
pub fn delete(conn: &Connection, id: &str) -> Result<(), rusqlite::Error> {
    conn.execute("DELETE FROM categories WHERE id = ?1", params![id])?;
    Ok(())
}
