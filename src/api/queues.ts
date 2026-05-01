import { invoke } from "@tauri-apps/api/core";
import type { Queue } from "@/types";
import {
  getQueuesMock, createQueueMock, deleteQueueMock,
} from "@/mocks/handlers";

const USE_MOCK = import.meta.env.VITE_MOCK === "true";

export async function getQueues(): Promise<Queue[]> {
  if (USE_MOCK) return getQueuesMock();
  try {
    return await invoke("get_queues");
  } catch (e) {
    throw new Error(`获取队列列表失败: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export async function createQueue(name: string, icon?: string): Promise<Queue> {
  if (USE_MOCK) return createQueueMock(name, icon);
  try {
    return await invoke("create_queue", { name, icon });
  } catch (e) {
    throw new Error(`创建队列失败: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export async function deleteQueue(id: string): Promise<void> {
  if (USE_MOCK) { await deleteQueueMock(id); return; }
  try {
    return await invoke("delete_queue", { id });
  } catch (e) {
    throw new Error(`删除队列失败: ${e instanceof Error ? e.message : String(e)}`);
  }
}
