use serde::{Deserialize, Serialize};

/// 应用配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub download: DownloadSettings,
    pub speed: SpeedSettings,
    pub theme: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            download: DownloadSettings::default(),
            speed: SpeedSettings::default(),
            theme: "dark".to_string(),
        }
    }
}

/// 下载设置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadSettings {
    pub default_path: String,
    pub max_concurrent_tasks: u32,
    pub max_threads_per_task: u32,
    pub enable_resume: bool,
    pub post_download_action: String,
    pub file_conflict_policy: String,
    pub auto_create_subdir: bool,
    pub monitor_clipboard: bool,
}

impl Default for DownloadSettings {
    fn default() -> Self {
        Self {
            default_path: "D:/Downloads/".to_string(),
            max_concurrent_tasks: 3,
            max_threads_per_task: 8,
            enable_resume: true,
            post_download_action: "notify".to_string(),
            file_conflict_policy: "ask".to_string(),
            auto_create_subdir: true,
            monitor_clipboard: true,
        }
    }
}

/// 速度设置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpeedSettings {
    pub download_limit: Option<u64>,
    pub upload_limit: Option<u64>,
    pub speed_mode: String,
    pub allocation_mode: String,
    pub smart_acceleration: bool,
    pub acceleration_threshold: u32,
    pub apply_limit_on_startup: bool,
    pub whitelist_task_ids: Vec<String>,
}

impl Default for SpeedSettings {
    fn default() -> Self {
        Self {
            download_limit: Some(10_485_760),
            upload_limit: Some(1_048_576),
            speed_mode: "custom".to_string(),
            allocation_mode: "global".to_string(),
            smart_acceleration: true,
            acceleration_threshold: 10,
            apply_limit_on_startup: true,
            whitelist_task_ids: vec![],
        }
    }
}

/// 速度策略 — 数据库持久化存储
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpeedPolicy {
    pub id: String,
    pub name: String,
    pub download_limit: Option<u64>,
    pub upload_limit: Option<u64>,
    pub mode: String,
    pub schedule: Option<String>,
    pub is_active: bool,
}
