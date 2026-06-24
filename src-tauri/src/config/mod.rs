use crate::models::AppConfig;
use std::path::PathBuf;
use std::sync::Mutex;

/// 应用全局状态，包含配置和应用数据目录
pub struct AppState {
    pub config: Mutex<AppConfig>,
    pub app_dir: Mutex<PathBuf>,
}

/// 从指定路径加载配置，若不存在则使用默认配置
pub fn load_config(app_dir: &PathBuf) -> AppConfig {
    let path = app_dir.join("config.json");
    if path.exists() {
        let content = std::fs::read_to_string(&path).unwrap_or_default();
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        let config = AppConfig::default();
        // 保存默认配置
        if let Ok(content) = serde_json::to_string_pretty(&config) {
            let _ = std::fs::write(&path, content);
        }
        config
    }
}
