// 任务状态枚举 — 与 Rust TaskStatus 对应
export type TaskStatus =
  | "Pending"
  | "Downloading"
  | "Paused"
  | "Completed"
  | "Error"
  | "Merging"
  | "Checking";

// 下载任务 — 与 Rust DownloadTask 对应
export interface DownloadTask {
  id: string;
  url: string;
  filename: string;
  status: TaskStatus;
  savePath: string;
  queueId: string;
  categoryId?: string;
  threadCount: number;
  totalSize: number;
  downloadedSize: number;
  supportsRanges?: boolean;
  expectedHash?: string;
  errorCode?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

// 分块检查点 — 与 Rust Checkpoint 对应
export interface Checkpoint {
  id: number;
  taskId: string;
  chunkIndex: number;
  startByte: number;
  endByte: number;
  downloadedOffset: number;
}

// 线程信息（前端展示用）
export interface ThreadInfo {
  chunkIndex: number;
  startByte: number;
  endByte: number;
  downloadedOffset: number;
  speed: number;
  status: "idle" | "downloading" | "completed";
}

// 日志条目
export interface TaskLog {
  timestamp: number;
  level: "info" | "warn" | "error";
  message: string;
}

// 任务详情（含线程和日志）
export interface TaskDetail extends DownloadTask {
  threads: ThreadInfo[];
  logs: TaskLog[];
}

// 创建任务请求 — 与 Rust CreateTaskPayload 对应
export interface CreateTaskPayload {
  url: string;
  filename?: string;
  savePath: string;
  queueId: string;
  threadCount?: number;
  enableResume?: boolean;
  autoStart?: boolean;
  enableIntegrityCheck?: boolean;
}

// 队列 — 与 Rust Queue 对应
export interface Queue {
  id: string;
  name: string;
  sortWeight: number;
  icon?: string;
}

// 分类 — 与 Rust Category 对应
export interface Category {
  id: string;
  name: string;
  icon?: string;
  defaultPath: string;
  postAction: "none" | "openFile" | "openFolder" | "extract";
  fileExtensions: string[];
  labels: string[];
}

// 站点认证 — 与 Rust SiteAuth 对应
export interface SiteAuth {
  id: string;
  siteName: string;
  domainPattern: string;
  cookies?: string;
  customUa?: string;
  referer?: string;
  quotaTotal?: number;
  quotaUsed: number;
  loginStatus: "unknown" | "logged_in" | "expired" | "error";
}

// 速度策略 — 与 Rust SpeedPolicy 对应
export interface SpeedPolicy {
  id: string;
  name: string;
  downloadLimit?: number;
  uploadLimit?: number;
  mode: "global" | "even" | "unlimited";
  schedule?: string;
  isActive: boolean;
}

// 下载设置
export interface DownloadSettings {
  defaultPath: string;
  maxConcurrentTasks: number;
  maxThreadsPerTask: number;
  enableResume: boolean;
  postDownloadAction: "notify" | "openFolder" | "shutdown";
  fileConflictPolicy: "ask" | "overwrite" | "rename";
  autoCreateSubdir: boolean;
  monitorClipboard: boolean;
}

// 速度设置
export interface SpeedSettings {
  downloadLimit?: number;
  uploadLimit?: number;
  speedMode: "unlimited" | "custom" | "smart";
  allocationMode: "global" | "even";
  smartAcceleration: boolean;
  accelerationThreshold: number;
  applyLimitOnStartup: boolean;
  whitelistTaskIds: string[];
}

// 应用配置 — 与 Rust AppConfig 对应（JSON 配置文件结构）
export interface AppConfig {
  download: DownloadSettings;
  speed: SpeedSettings;
  theme: "dark" | "light";
}

// 磁盘信息 — 与 Rust DiskInfo 对应
export interface DiskInfo {
  total: number;
  free: number;
  used: number;
}

// 系统统计 — 与 Rust SystemStats 对应
export interface SystemStats {
  cpuUsage: number;
  memoryUsage: number;
  networkDownSpeed: number;
  networkUpSpeed: number;
}

// 速度历史数据点
export interface SpeedDataPoint {
  time: number;
  downSpeed: number;
  upSpeed: number;
}

// 任务过滤器类型
export type TaskFilter = TaskStatus | "all";

// 新建下载表单数据
export interface NewDownloadForm {
  url: string;
  filename: string;
  savePath: string;
  queueId: string;
  threadCount: number;
  enableResume: boolean;
  autoStart: boolean;
  enableIntegrityCheck: boolean;
}
