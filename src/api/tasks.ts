import { invoke } from "@tauri-apps/api/core";
import type { DownloadTask, TaskDetail, TaskFilter, CreateTaskPayload } from "@/types";
import {
  getTasksMock, getTaskDetailMock, createTaskMock,
  pauseTaskMock, resumeTaskMock, deleteTaskMock, retryTaskMock,
} from "@/mocks/handlers";

const USE_MOCK = import.meta.env.VITE_MOCK === "true";

export async function getTasks(filter: TaskFilter = "all", queueId?: string): Promise<DownloadTask[]> {
  if (USE_MOCK) return getTasksMock(filter, queueId);
  return invoke("get_tasks", { filter, queueId });
}

export async function getTaskDetail(id: string): Promise<TaskDetail> {
  if (USE_MOCK) return getTaskDetailMock(id) as Promise<TaskDetail>;
  return invoke("get_task_detail", { id });
}

export async function createTask(payload: CreateTaskPayload): Promise<DownloadTask> {
  if (USE_MOCK) return createTaskMock(payload);
  return invoke("create_task", { payload });
}

export async function pauseTask(id: string): Promise<void> {
  if (USE_MOCK) { await pauseTaskMock(id); return; }
  return invoke("pause_task", { id });
}

export async function resumeTask(id: string): Promise<void> {
  if (USE_MOCK) { await resumeTaskMock(id); return; }
  return invoke("resume_task", { id });
}

export async function deleteTask(id: string, deleteFile: boolean = false): Promise<void> {
  if (USE_MOCK) { await deleteTaskMock(id); return; }
  return invoke("delete_task", { id, deleteFile });
}

export async function retryTask(id: string): Promise<DownloadTask> {
  if (USE_MOCK) return retryTaskMock(id) as Promise<DownloadTask>;
  return invoke("retry_task", { id });
}
