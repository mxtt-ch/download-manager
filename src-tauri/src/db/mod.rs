use rusqlite::Connection;
use std::sync::Mutex;

pub mod tasks;
pub mod checkpoints;
pub mod queues;
pub mod categories;
pub mod site_auth;
pub mod speed_policy;

/// 数据库状态，作为 Tauri 托管状态注入
pub struct DbState {
    pub conn: Mutex<Connection>,
}

/// 初始化数据库：打开连接、启用 WAL、运行迁移、插入默认数据
pub fn init_db(db_path: &str) -> Result<Connection, rusqlite::Error> {
    let conn = Connection::open(db_path)?;
    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;
    run_migrations(&conn)?;
    insert_default_data(&conn)?;
    Ok(conn)
}

/// 创建所有表（如果不存在）
fn run_migrations(conn: &Connection) -> Result<(), rusqlite::Error> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS queues (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            sort_weight INTEGER DEFAULT 0,
            icon TEXT
        );

        CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            icon TEXT,
            default_path TEXT NOT NULL,
            post_action TEXT DEFAULT 'none',
            file_extensions TEXT NOT NULL DEFAULT '[]',
            labels TEXT NOT NULL DEFAULT '[]'
        );

        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            url TEXT NOT NULL,
            filename TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Pending',
            save_path TEXT NOT NULL,
            queue_id TEXT REFERENCES queues(id),
            category_id TEXT REFERENCES categories(id),
            thread_count INTEGER NOT NULL DEFAULT 4,
            total_size INTEGER DEFAULT 0,
            downloaded_size INTEGER DEFAULT 0,
            supports_ranges BOOLEAN DEFAULT NULL,
            expected_hash TEXT,
            error_code TEXT,
            created_at INTEGER NOT NULL,
            started_at INTEGER,
            completed_at INTEGER
        );

        CREATE TABLE IF NOT EXISTS checkpoints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
            chunk_index INTEGER NOT NULL,
            start_byte INTEGER NOT NULL,
            end_byte INTEGER NOT NULL,
            downloaded_offset INTEGER NOT NULL DEFAULT 0,
            UNIQUE(task_id, chunk_index)
        );

        CREATE TABLE IF NOT EXISTS site_auth (
            id TEXT PRIMARY KEY,
            site_name TEXT NOT NULL,
            domain_pattern TEXT NOT NULL,
            cookies TEXT,
            custom_ua TEXT,
            referer TEXT,
            quota_total INTEGER,
            quota_used INTEGER DEFAULT 0,
            login_status TEXT DEFAULT 'unknown'
        );

        CREATE TABLE IF NOT EXISTS speed_policy (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            download_limit INTEGER,
            upload_limit INTEGER,
            mode TEXT DEFAULT 'global',
            schedule TEXT,
            is_active BOOLEAN DEFAULT false
        );"
    )
}

/// 插入预设数据（使用 INSERT OR IGNORE 避免重复插入）
fn insert_default_data(conn: &Connection) -> Result<(), rusqlite::Error> {
    // 默认队列
    conn.execute(
        "INSERT OR IGNORE INTO queues (id, name, sort_weight, icon) VALUES ('queue-default', '默认队列', 0, 'list')",
        [],
    )?;

    // 预设分类
    let categories = vec![
        ("cat-video", "视频/音频", "video", "D:/Downloads/Videos/",
         &[".mp4",".avi",".mkv",".mov",".mp3",".flac",".wav"] as &[&str],
         &["影视","音乐"] as &[&str]),
        ("cat-archive", "压缩文件", "archive", "D:/Downloads/Archives/",
         &[".zip",".rar",".7z",".tar",".gz",".xz"],
         &["压缩包"]),
        ("cat-software", "软件安装包", "package", "D:/Downloads/Software/",
         &[".exe",".msi",".dmg",".deb",".rpm",".apk"],
         &["工具","开发"]),
        ("cat-os", "系统镜像", "disc", "D:/Downloads/OS/",
         &[".iso",".img",".vhd",".vhdx"],
         &["操作系统"]),
        ("cat-doc", "文档", "file", "D:/Downloads/Documents/",
         &[".pdf",".doc",".docx",".xls",".xlsx",".epub",".mobi"],
         &["学习","工作"]),
        ("cat-other", "其他", "folder", "D:/Downloads/",
         &[],
         &["未分类"]),
    ];

    for (id, name, icon, path, exts, labels) in &categories {
        let exts_json: Vec<String> = exts.iter().map(|e| format!("\"{}\"", e)).collect();
        let labels_json: Vec<String> = labels.iter().map(|l| format!("\"{}\"", l)).collect();

        conn.execute(
            "INSERT OR IGNORE INTO categories (id, name, icon, default_path, file_extensions, labels)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            rusqlite::params![
                id, name, icon, path,
                format!("[{}]", exts_json.join(",")),
                format!("[{}]", labels_json.join(","))
            ],
        )?;
    }

    Ok(())
}
