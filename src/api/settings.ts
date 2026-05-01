import { invoke } from "@tauri-apps/api/core";
import type { AppConfig, Category } from "@/types";
import {
  getSettingsMock, updateSettingsMock,
  getCategoriesMock, upsertCategoryMock, deleteCategoryMock,
} from "@/mocks/handlers";

const USE_MOCK = import.meta.env.VITE_MOCK === "true";

export async function getSettings(): Promise<AppConfig> {
  if (USE_MOCK) return getSettingsMock();
  try {
    return await invoke("get_settings");
  } catch (e) {
    throw new Error(`获取设置失败: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export async function updateSettings(section: AppConfig): Promise<AppConfig> {
  if (USE_MOCK) return updateSettingsMock(section);
  try {
    return await invoke("update_settings", { section });
  } catch (e) {
    throw new Error(`更新设置失败: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export async function getCategories(): Promise<Category[]> {
  if (USE_MOCK) return getCategoriesMock();
  try {
    return await invoke("get_categories");
  } catch (e) {
    throw new Error(`获取分类列表失败: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export async function upsertCategory(cat: Category): Promise<Category> {
  if (USE_MOCK) return upsertCategoryMock(cat);
  try {
    return await invoke("upsert_category", { cat });
  } catch (e) {
    throw new Error(`保存分类失败: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export async function deleteCategory(id: string): Promise<void> {
  if (USE_MOCK) { await deleteCategoryMock(id); return; }
  try {
    return await invoke("delete_category", { id });
  } catch (e) {
    throw new Error(`删除分类失败: ${e instanceof Error ? e.message : String(e)}`);
  }
}
