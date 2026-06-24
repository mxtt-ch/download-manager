import { invoke } from "@tauri-apps/api/core";
import type { DownloadTask, TaskDetail, TaskFilter, CreateTaskPayload } from "@/types";
import {
  getTasksMock, getTaskDetailMock, createTaskMock,
  pauseTaskMock, resumeTaskMock, deleteTaskMock, retryTaskMock,
} from "@/mocks/handlers";

const USE_MOCK = import.meta.env.VITE_MOCK === "true";

export async function getTasks(filter: TaskFilter = "all", queueId?: string): Promise<DownloadTask[]> {
  if (USE_MOCK) return getTasksMock(filter, queueId);
  try {
    return await invoke("get_tasks", { filter, queueId });
  } catch (e) {
    throw new Error(`获取任务列表失败: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export async function getTaskDetail(id: string): Promise<TaskDetail> {
  if (USE_MOCK) return getTaskDetailMock(id) as Promise<TaskDetail>;
  try {
    return await invoke("get_task_detail", { id });
  } catch (e) {
    throw new Error(`获取任务详情失败: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export async function createTask(payload: CreateTaskPayload): Promise<DownloadTask> {
  if (USE_MOCK) return createTaskMock(payload);
  try {
    return await invoke("create_task", { payload });
  } catch (e) {
    throw new Error(`创建任务失败: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export async function pauseTask(id: string): Promise<void> {
  if (USE_MOCK) { await pauseTaskMock(id); return; }
  try {
    return await invoke("pause_task", { id });
  } catch (e) {
    throw new Error(`暂停任务失败: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export async function resumeTask(id: string): Promise<void> {
  if (USE_MOCK) { await resumeTaskMock(id); return; }
  try {
    return await invoke("resume_task", { id });
  } catch (e) {
    throw new Error(`恢复任务失败: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export async function deleteTask(id: string, deleteFile: boolean = false): Promise<void> {
  if (USE_MOCK) { await deleteTaskMock(id); return; }
  try {
    return await invoke("delete_task", { id, deleteFile });
  } catch (e) {
    throw new Error(`删除任务失败: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export async function retryTask(id: string): Promise<DownloadTask> {
  if (USE_MOCK) return retryTaskMock(id) as Promise<DownloadTask>;
  try {
    return await invoke("retry_task", { id });
  } catch (e) {
    throw new Error(`重试任务失败: ${e instanceof Error ? e.message : String(e)}`);
  }
}
