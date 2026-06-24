use serde::{Deserialize, Serialize};

/// 站点认证信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SiteAuth {
    pub id: String,
    pub site_name: String,
    pub domain_pattern: String,
    pub cookies: Option<String>,
    pub custom_ua: Option<String>,
    pub referer: Option<String>,
    pub quota_total: Option<u64>,
    pub quota_used: u64,
    pub login_status: String,
}
