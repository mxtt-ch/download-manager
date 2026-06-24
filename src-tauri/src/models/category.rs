use serde::{Deserialize, Serialize};

/// 文件分类 — 用于根据后缀名自动归类下载文件
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Category {
    pub id: String,
    pub name: String,
    pub icon: Option<String>,
    pub default_path: String,
    pub post_action: String,
    pub file_extensions: Vec<String>,
    pub labels: Vec<String>,
}
