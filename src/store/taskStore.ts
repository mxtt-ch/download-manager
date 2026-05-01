import { create } from "zustand";
import type { DownloadTask, TaskFilter, TaskDetail } from "@/types";
import * as taskApi from "@/api/tasks";

interface TaskStore {
  // 状态
  tasks: DownloadTask[];
  activeTaskId: string | null;
  activeTaskDetail: TaskDetail | null;
  filter: TaskFilter;
  selectedQueueId: string | null;
  sortField: "filename" | "size" | "progress" | "createdAt";
  sortDirection: "asc" | "desc";
  isLoading: boolean;

  // UI 操作
  setFilter: (filter: TaskFilter) => void;
  setSelectedQueue: (queueId: string | null) => void;
  setSortField: (field: TaskStore["sortField"]) => void;
  toggleSortDirection: () => void;
  setActiveTask: (id: string | null) => void;
  clearActiveTask: () => void;

  // 数据操作
  fetchTasks: () => Promise<void>;
  fetchTaskDetail: (id: string) => Promise<void>;
  addTask: (payload: Parameters<typeof taskApi.createTask>[0]) => Promise<void>;
  pauseTask: (id: string) => Promise<void>;
  resumeTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  retryTask: (id: string) => Promise<void>;
}

/** 任务状态管理 — 所有任务相关操作的核心 Store */
export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  activeTaskId: null,
  activeTaskDetail: null,
  filter: "all",
  selectedQueueId: null,
  sortField: "createdAt",
  sortDirection: "desc",
  isLoading: false,

  // ============================================================
  // UI 操作
  // ============================================================

  /** 切换任务状态过滤器 */
  setFilter: (filter) => set({ filter }),

  /** 按队列筛选任务 */
  setSelectedQueue: (selectedQueueId) => set({ selectedQueueId }),

  /** 设置排序字段 */
  setSortField: (sortField) => set({ sortField }),

  /** 切换排序方向（升序/降序） */
  toggleSortDirection: () =>
    set((s) => ({
      sortDirection: s.sortDirection === "asc" ? "desc" : "asc",
    })),

  /** 设置当前选中的任务 */
  setActiveTask: (id) => set({ activeTaskId: id }),

  /** 清除当前选中的任务及其详情 */
  clearActiveTask: () => set({ activeTaskId: null, activeTaskDetail: null }),

  // ============================================================
  // 数据操作
  // ============================================================

  /** 拉取任务列表，自动应用当前过滤器和队列筛选 */
  fetchTasks: async () => {
    set({ isLoading: true });
    const { filter, selectedQueueId } = get();
    const tasks = await taskApi.getTasks(
      filter,
      selectedQueueId ?? undefined,
    );
    set({ tasks, isLoading: false });
  },

  /** 获取单个任务的详细信息（含线程状态与日志） */
  fetchTaskDetail: async (id) => {
    const detail = await taskApi.getTaskDetail(id);
    set({ activeTaskDetail: detail });
  },

  /** 创建新的下载任务并插入列表顶部 */
  addTask: async (payload) => {
    const task = await taskApi.createTask(payload);
    set((s) => ({ tasks: [task, ...s.tasks] }));
  },

  /** 暂停指定任务 */
  pauseTask: async (id) => {
    await taskApi.pauseTask(id);
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, status: "Paused" as const } : t,
      ),
    }));
  },

  /** 恢复指定任务 */
  resumeTask: async (id) => {
    await taskApi.resumeTask(id);
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, status: "Downloading" as const } : t,
      ),
    }));
  },

  /** 删除任务，若该任务为当前选中任务则自动清除选中状态 */
  deleteTask: async (id) => {
    await taskApi.deleteTask(id);
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== id),
      activeTaskId: s.activeTaskId === id ? null : s.activeTaskId,
      activeTaskDetail:
        s.activeTaskId === id ? null : s.activeTaskDetail,
    }));
  },

  /** 重试失败的任务 */
  retryTask: async (id) => {
    const task = await taskApi.retryTask(id);
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? task : t)),
    }));
  },
}));
