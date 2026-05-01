import { invoke } from "@tauri-apps/api/core";
import type { SiteAuth } from "@/types";
import {
  getSitesMock, addSiteMock, updateSiteMock, deleteSiteMock,
} from "@/mocks/handlers";

const USE_MOCK = import.meta.env.VITE_MOCK === "true";

export async function getSites(): Promise<SiteAuth[]> {
  if (USE_MOCK) return getSitesMock();
  return invoke("get_sites");
}

export async function addSite(payload: Omit<SiteAuth, "id">): Promise<SiteAuth> {
  if (USE_MOCK) return addSiteMock(payload);
  return invoke("add_site", { payload });
}

export async function updateSite(payload: SiteAuth): Promise<SiteAuth> {
  if (USE_MOCK) return updateSiteMock(payload) as Promise<SiteAuth>;
  return invoke("update_site", { payload });
}

export async function deleteSite(id: string): Promise<void> {
  if (USE_MOCK) { await deleteSiteMock(id); return; }
  return invoke("delete_site", { id });
}
