import { invoke } from "@tauri-apps/api/core";
import type { Queue } from "@/types";
import {
  getQueuesMock, createQueueMock, deleteQueueMock,
} from "@/mocks/handlers";

const USE_MOCK = import.meta.env.VITE_MOCK === "true";

export async function getQueues(): Promise<Queue[]> {
  if (USE_MOCK) return getQueuesMock();
  return invoke("get_queues");
}

export async function createQueue(name: string, icon?: string): Promise<Queue> {
  if (USE_MOCK) return createQueueMock(name, icon);
  return invoke("create_queue", { name, icon });
}

export async function deleteQueue(id: string): Promise<void> {
  if (USE_MOCK) { await deleteQueueMock(id); return; }
  return invoke("delete_queue", { id });
}
