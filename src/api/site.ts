import { invoke } from "@tauri-apps/api/core";
import type { SiteAuth } from "@/types";
import {
  getSitesMock, addSiteMock, updateSiteMock, deleteSiteMock,
} from "@/mocks/handlers";

const USE_MOCK = import.meta.env.VITE_MOCK === "true";

export async function getSites(): Promise<SiteAuth[]> {
  if (USE_MOCK) return getSitesMock();
  try {
    return await invoke("get_sites");
  } catch (e) {
    throw new Error(`获取站点列表失败: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export async function addSite(payload: Omit<SiteAuth, "id">): Promise<SiteAuth> {
  if (USE_MOCK) return addSiteMock(payload);
  try {
    return await invoke("add_site", { payload });
  } catch (e) {
    throw new Error(`添加站点失败: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export async function updateSite(payload: SiteAuth): Promise<SiteAuth> {
  if (USE_MOCK) return updateSiteMock(payload) as Promise<SiteAuth>;
  try {
    return await invoke("update_site", { payload });
  } catch (e) {
    throw new Error(`更新站点失败: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export async function deleteSite(id: string): Promise<void> {
  if (USE_MOCK) { await deleteSiteMock(id); return; }
  try {
    return await invoke("delete_site", { id });
  } catch (e) {
    throw new Error(`删除站点失败: ${e instanceof Error ? e.message : String(e)}`);
  }
}
