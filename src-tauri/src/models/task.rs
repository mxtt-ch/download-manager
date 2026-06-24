use serde::{Deserialize, Serialize};

/// 任务状态枚举 — 与前端 TaskStatus 对应
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TaskStatus {
    Pending,
    Downloading,
    Paused,
    Completed,
    Error,
    Merging,
    Checking,
}

impl std::fmt::Display for TaskStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TaskStatus::Pending => write!(f, "Pending"),
            TaskStatus::Downloading => write!(f, "Downloading"),
            TaskStatus::Paused => write!(f, "Paused"),
            TaskStatus::Completed => write!(f, "Completed"),
            TaskStatus::Error => write!(f, "Error"),
            TaskStatus::Merging => write!(f, "Merging"),
            TaskStatus::Checking => write!(f, "Checking"),
        }
    }
}

/// 下载任务 — 与前端 DownloadTask 对应
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadTask {
    pub id: String,
    pub url: String,
    pub filename: String,
    pub status: TaskStatus,
    pub save_path: String,
    pub queue_id: String,
    pub category_id: Option<String>,
    pub thread_count: u32,
    pub total_size: u64,
    pub downloaded_size: u64,
    pub supports_ranges: Option<bool>,
    pub expected_hash: Option<String>,
    pub error_code: Option<String>,
    pub speed: Option<u64>,
    pub created_at: i64,
    pub started_at: Option<i64>,
    pub completed_at: Option<i64>,
}

/// 创建任务请求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTaskPayload {
    pub url: String,
    pub filename: Option<String>,
    pub save_path: String,
    pub queue_id: String,
    pub thread_count: Option<u32>,
    pub enable_resume: Option<bool>,
    pub auto_start: Option<bool>,
    pub enable_integrity_check: Option<bool>,
}

/// 分块检查点
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Checkpoint {
    pub id: i64,
    pub task_id: String,
    pub chunk_index: u32,
    pub start_byte: u64,
    pub end_byte: u64,
    pub downloaded_offset: u64,
}

/// 线程信息（用于前端展示）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThreadInfo {
    pub chunk_index: u32,
    pub start_byte: u64,
    pub end_byte: u64,
    pub downloaded_offset: u64,
    pub speed: u64,
    pub status: String,
}

/// 任务日志条目
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskLog {
    pub timestamp: i64,
    pub level: String,
    pub message: String,
}

/// 任务详情（含线程和日志）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskDetail {
    #[serde(flatten)]
    pub task: DownloadTask,
    pub threads: Vec<ThreadInfo>,
    pub logs: Vec<TaskLog>,
}
