import { invoke } from "@tauri-apps/api/core";
import type { DiskInfo } from "@/types";
import { getDiskSpaceMock } from "@/mocks/handlers";

const USE_MOCK = import.meta.env.VITE_MOCK === "true";

export async function getDiskSpace(path: string): Promise<DiskInfo> {
  if (USE_MOCK) return getDiskSpaceMock();
  try {
    return await invoke("get_disk_space", { path });
  } catch (e) {
    throw new Error(`获取磁盘空间失败: ${e instanceof Error ? e.message : String(e)}`);
  }
}
