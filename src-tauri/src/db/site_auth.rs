use rusqlite::{Connection, params};
use crate::models::SiteAuth;

/// 获取所有站点认证信息
pub fn get_all(conn: &Connection) -> Vec<SiteAuth> {
    let mut stmt = conn.prepare(
        "SELECT id, site_name, domain_pattern, cookies, custom_ua, referer, \
         quota_total, quota_used, login_status FROM site_auth"
    ).unwrap();
    stmt.query_map([], |row| {
        Ok(SiteAuth {
            id: row.get(0)?,
            site_name: row.get(1)?,
            domain_pattern: row.get(2)?,
            cookies: row.get(3)?,
            custom_ua: row.get(4)?,
            referer: row.get(5)?,
            quota_total: row.get::<_, Option<i64>>(6).ok().flatten().map(|v| v as u64),
            quota_used: row.get::<_, i64>(7)? as u64,
            login_status: row.get(8)?,
        })
    }).unwrap().filter_map(|r| r.ok()).collect()
}

/// 插入站点认证信息
pub fn insert(conn: &Connection, site: &SiteAuth) -> Result<(), rusqlite::Error> {
    conn.execute(
        "INSERT INTO site_auth (id, site_name, domain_pattern, cookies, custom_ua, referer, \
         quota_total, quota_used, login_status) \
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            site.id,
            site.site_name,
            site.domain_pattern,
            site.cookies,
            site.custom_ua,
            site.referer,
            site.quota_total.map(|v| v as i64),
            site.quota_used as i64,
            site.login_status,
        ],
    )?;
    Ok(())
}

/// 更新站点认证信息
pub fn update(conn: &Connection, site: &SiteAuth) -> Result<(), rusqlite::Error> {
    conn.execute(
        "UPDATE site_auth SET site_name=?1, domain_pattern=?2, cookies=?3, custom_ua=?4, \
         referer=?5, quota_total=?6, quota_used=?7, login_status=?8 WHERE id=?9",
        params![
            site.site_name,
            site.domain_pattern,
            site.cookies,
            site.custom_ua,
            site.referer,
            site.quota_total.map(|v| v as i64),
            site.quota_used as i64,
            site.login_status,
            site.id,
        ],
    )?;
    Ok(())
}

/// 删除站点认证信息
pub fn delete(conn: &Connection, id: &str) -> Result<(), rusqlite::Error> {
    conn.execute("DELETE FROM site_auth WHERE id = ?1", params![id])?;
    Ok(())
}
