import type {
  DownloadTask, TaskDetail, TaskFilter, CreateTaskPayload,
  Queue, Category, SiteAuth, AppConfig, DiskInfo, ThreadInfo, TaskLog,
} from "@/types";
import tasksData from "./data/tasks.json";
import categoriesData from "./data/categories.json";
import queuesData from "./data/queues.json";
import sitesData from "./data/sites.json";
import settingsData from "./data/settings.json";
import speedHistoryData from "./data/speedHistory.json";

// ============================================================
// 工具函数
// ============================================================

/** 模拟网络延迟 100-300ms */
function delay(): Promise<void> {
  const ms = 100 + Math.random() * 200;
  return new Promise((r) => setTimeout(r, ms));
}

/** 生成唯一 ID */
function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ============================================================
// 内存数据库（可变副本）
// ============================================================

/** 深拷贝模拟数据，模拟内存数据库的可变操作 */
let tasks: DownloadTask[] = JSON.parse(JSON.stringify(tasksData));
let categories: Category[] = JSON.parse(JSON.stringify(categoriesData));
let queues: Queue[] = JSON.parse(JSON.stringify(queuesData));
let sites: SiteAuth[] = JSON.parse(JSON.stringify(sitesData));
let settings: AppConfig = JSON.parse(JSON.stringify(settingsData));

// ============================================================
// 任务相关处理器
// ============================================================

/** 获取任务列表，按 filter 和可选的 queueId 过滤 */
export async function getTasksMock(filter: TaskFilter, queueId?: string): Promise<DownloadTask[]> {
  await delay();
  let result = tasks;
  if (queueId) {
    result = result.filter((t) => t.queueId === queueId);
  }
  if (filter !== "all") {
    result = result.filter((t) => t.status === filter);
  }
  // 按创建时间倒序排列
  return [...result].sort((a, b) => b.createdAt - a.createdAt);
}

/** 获取任务详情，包含线程信息与日志 */
export async function getTaskDetailMock(id: string): Promise<TaskDetail | null> {
  await delay();
  const task = tasks.find((t) => t.id === id);
  if (!task) return null;

  // 根据 threadCount 和 totalSize 生成线程信息
  const threads = generateThreads(task);

  // 根据任务状态生成日志
  const logs = generateLogs(task);

  return { ...task, threads, logs };
}

/** 生成线程信息 */
function generateThreads(task: DownloadTask): ThreadInfo[] {
  const { threadCount, totalSize, downloadedSize, status } = task;
  const chunkSize = Math.ceil(totalSize / threadCount);
  const threads: ThreadInfo[] = [];

  for (let i = 0; i < threadCount; i++) {
    const startByte = i * chunkSize;
    const endByte = Math.min(startByte + chunkSize - 1, totalSize - 1);

    // 计算该分块已下载的字节（顺序填充）
    let chunkDownloaded = 0;
    if (downloadedSize > startByte) {
      chunkDownloaded = Math.min(downloadedSize, endByte + 1) - startByte;
    }

    const chunkLen = endByte - startByte + 1;
    const isCompleted = status === "Completed";

    threads.push({
      chunkIndex: i,
      startByte,
      endByte,
      downloadedOffset: isCompleted ? endByte + 1 : startByte + chunkDownloaded,
      speed: status === "Downloading" && chunkDownloaded < chunkLen
        ? Math.floor(512000 + Math.random() * 3072000)
        : 0,
      status: isCompleted || (status === "Downloading" && chunkDownloaded >= chunkLen)
        ? "completed"
        : status === "Downloading" && chunkDownloaded > 0
          ? "downloading"
          : "idle",
    });
  }

  return threads;
}

/** 生成任务日志 */
function generateLogs(task: DownloadTask): TaskLog[] {
  const now = Date.now();
  const logs: TaskLog[] = [
    { timestamp: task.createdAt, level: "info", message: `任务创建：${task.filename}` },
  ];

  if (task.startedAt) {
    logs.push({
      timestamp: task.startedAt,
      level: "info",
      message: task.threadCount > 1
        ? `开始多线程下载，共 ${task.threadCount} 个线程`
        : "开始单线程下载",
    });
  }

  if (task.supportsRanges === false) {
    logs.push({
      timestamp: (task.startedAt ?? task.createdAt) + 500,
      level: "warn",
      message: "服务器不支持断点续传，已回退至单线程模式",
    });
  }

  if (task.status === "Error") {
    logs.push({
      timestamp: now - 60000,
      level: "error",
      message: `下载失败：${task.errorCode ?? "未知错误"}`,
    });
  }

  if (task.status === "Paused") {
    logs.push({
      timestamp: (task.startedAt ?? now) + 300000,
      level: "info",
      message: "用户暂停下载",
    });
  }

  if (task.status === "Completed" && task.completedAt) {
    logs.push({
      timestamp: task.completedAt,
      level: "info",
      message: "下载完成，等待校验",
    });
    if (task.expectedHash) {
      logs.push({
        timestamp: task.completedAt + 2000,
        level: "info",
        message: `哈希校验通过 (${task.expectedHash.slice(0, 12)}...)`,
      });
    }
  }

  return logs;
}

/** 创建新任务 */
export async function createTaskMock(payload: CreateTaskPayload): Promise<DownloadTask> {
  await delay();
  const filename = payload.filename ?? extractFilename(payload.url);
  const now = Date.now();
  const newTask: DownloadTask = {
    id: `task-${uid()}`,
    url: payload.url,
    filename,
    savePath: payload.savePath,
    queueId: payload.queueId,
    threadCount: payload.threadCount ?? 4,
    totalSize: 0,
    downloadedSize: 0,
    supportsRanges: payload.enableResume ?? true,
    status: payload.autoStart === false ? "Pending" : "Downloading",
    createdAt: now,
    startedAt: payload.autoStart === false ? undefined : now,
  };
  tasks = [newTask, ...tasks];
  return newTask;
}

/** 从 URL 中提取文件名 */
function extractFilename(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const name = pathname.split("/").pop() ?? "unknown-file";
    return decodeURIComponent(name);
  } catch {
    return url.split("/").pop()?.split("?")[0] ?? "unknown-file";
  }
}

/** 暂停任务 */
export async function pauseTaskMock(id: string): Promise<DownloadTask | null> {
  await delay();
  const task = tasks.find((t) => t.id === id);
  if (!task || task.status !== "Downloading") return null;
  task.status = "Paused";
  return task;
}

/** 恢复任务 */
export async function resumeTaskMock(id: string): Promise<DownloadTask | null> {
  await delay();
  const task = tasks.find((t) => t.id === id);
  if (!task || task.status !== "Paused") return null;
  task.status = "Downloading";
  task.startedAt = Date.now();
  return task;
}

/** 删除任务 */
export async function deleteTaskMock(id: string): Promise<{ success: boolean }> {
  await delay();
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return { success: false };
  tasks = tasks.filter((t) => t.id !== id);
  return { success: true };
}

/** 重试失败任务 */
export async function retryTaskMock(id: string): Promise<DownloadTask | null> {
  await delay();
  const task = tasks.find((t) => t.id === id);
  if (!task || task.status !== "Error") return null;
  task.status = "Pending";
  task.downloadedSize = 0;
  if (task.errorCode !== undefined) {
    delete task.errorCode;
  }
  return task;
}

// ============================================================
// 设置相关处理器
// ============================================================

/** 获取应用配置 */
export async function getSettingsMock(): Promise<AppConfig> {
  await delay();
  return { ...settings };
}

/** 更新应用配置（合并更新） */
export async function updateSettingsMock(section: Partial<AppConfig>): Promise<AppConfig> {
  await delay();
  settings = { ...settings, ...section };
  return { ...settings };
}

/** 获取分类列表 */
export async function getCategoriesMock(): Promise<Category[]> {
  await delay();
  return [...categories];
}

/** 更新或插入分类 */
export async function upsertCategoryMock(cat: Category): Promise<Category> {
  await delay();
  const index = categories.findIndex((c) => c.id === cat.id);
  if (index >= 0) {
    categories[index] = cat;
  } else {
    categories = [...categories, cat];
  }
  return cat;
}

/** 删除分类 */
export async function deleteCategoryMock(id: string): Promise<{ success: boolean }> {
  await delay();
  const index = categories.findIndex((c) => c.id === id);
  if (index === -1) return { success: false };
  categories = categories.filter((c) => c.id !== id);
  return { success: true };
}

// ============================================================
// 站点相关处理器
// ============================================================

/** 获取站点列表 */
export async function getSitesMock(): Promise<SiteAuth[]> {
  await delay();
  return [...sites];
}

/** 新增站点 */
export async function addSiteMock(payload: Omit<SiteAuth, "id">): Promise<SiteAuth> {
  await delay();
  const newSite: SiteAuth = { id: `site-${uid()}`, ...payload };
  sites = [...sites, newSite];
  return newSite;
}

/** 更新站点 */
export async function updateSiteMock(payload: SiteAuth): Promise<SiteAuth | null> {
  await delay();
  const index = sites.findIndex((s) => s.id === payload.id);
  if (index === -1) return null;
  sites[index] = payload;
  return payload;
}

/** 删除站点 */
export async function deleteSiteMock(id: string): Promise<{ success: boolean }> {
  await delay();
  const index = sites.findIndex((s) => s.id === id);
  if (index === -1) return { success: false };
  sites = sites.filter((s) => s.id !== id);
  return { success: true };
}

// ============================================================
// 队列相关处理器
// ============================================================

/** 获取队列列表 */
export async function getQueuesMock(): Promise<Queue[]> {
  await delay();
  return [...queues];
}

/** 创建新队列 */
export async function createQueueMock(name: string, icon?: string): Promise<Queue> {
  await delay();
  const maxWeight = queues.reduce((max, q) => Math.max(max, q.sortWeight), 0);
  const newQueue: Queue = {
    id: `queue-${uid()}`,
    name,
    sortWeight: maxWeight + 1,
    icon,
  };
  queues = [...queues, newQueue];
  return newQueue;
}

/** 删除队列 */
export async function deleteQueueMock(id: string): Promise<{ success: boolean }> {
  await delay();
  const index = queues.findIndex((q) => q.id === id);
  if (index === -1) return { success: false };
  queues = queues.filter((q) => q.id !== id);
  return { success: true };
}

// ============================================================
// 系统相关处理器
// ============================================================

/** 获取磁盘空间信息 */
export async function getDiskSpaceMock(): Promise<DiskInfo> {
  await delay();
  return {
    total: 500 * 1024 * 1024 * 1024, // 500 GB
    free: 150 * 1024 * 1024 * 1024,  // 150 GB
    used: 350 * 1024 * 1024 * 1024,  // 350 GB
  };
}

/** 获取速度历史数据 */
export async function getSpeedHistoryMock(): Promise<typeof speedHistoryData> {
  await delay();
  return speedHistoryData;
}
