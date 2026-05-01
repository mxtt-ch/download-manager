import { invoke } from "@tauri-apps/api/core";
import type { AppConfig, Category } from "@/types";
import {
  getSettingsMock, updateSettingsMock,
  getCategoriesMock, upsertCategoryMock, deleteCategoryMock,
} from "@/mocks/handlers";

const USE_MOCK = import.meta.env.VITE_MOCK === "true";

export async function getSettings(): Promise<AppConfig> {
  if (USE_MOCK) return getSettingsMock();
  return invoke("get_settings");
}

export async function updateSettings(section: Partial<AppConfig>): Promise<AppConfig> {
  if (USE_MOCK) return updateSettingsMock(section);
  return invoke("update_settings", { section });
}

export async function getCategories(): Promise<Category[]> {
  if (USE_MOCK) return getCategoriesMock();
  return invoke("get_categories");
}

export async function upsertCategory(cat: Category): Promise<Category> {
  if (USE_MOCK) return upsertCategoryMock(cat);
  return invoke("upsert_category", { cat });
}

export async function deleteCategory(id: string): Promise<void> {
  if (USE_MOCK) { await deleteCategoryMock(id); return; }
  return invoke("delete_category", { id });
}
