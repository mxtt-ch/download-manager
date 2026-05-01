import { create } from "zustand";
import type { AppConfig, Category } from "@/types";
import * as settingsApi from "@/api/settings";

// ============================================================
// 默认配置 — 与 mocks/data/settings.json 保持一致
// ============================================================
const DEFAULT_CONFIG: AppConfig = {
  download: {
    defaultPath: "D:/Downloads/",
    maxConcurrentTasks: 5,
    maxThreadsPerTask: 8,
    enableResume: true,
    postDownloadAction: "notify",
    fileConflictPolicy: "ask",
    autoCreateSubdir: true,
    monitorClipboard: false,
  },
  speed: {
    downloadLimit: 0,
    uploadLimit: 0,
    speedMode: "unlimited",
    allocationMode: "global",
    smartAcceleration: false,
    accelerationThreshold: 10,
    applyLimitOnStartup: false,
    whitelistTaskIds: [],
  },
  theme: "dark",
};

interface SettingsStore {
  /** 应用配置 */
  config: AppConfig;
  /** 文件分类列表 */
  categories: Category[];
  /** 加载中标志 */
  isLoading: boolean;

  /** 从后端获取应用配置 */
  fetchSettings: () => Promise<void>;
  /** 从后端获取分类列表 */
  fetchCategories: () => Promise<void>;
  /** 合并更新应用配置 */
  updateSettings: (section: Partial<AppConfig>) => Promise<void>;
  /** 插入或更新分类 */
  upsertCategory: (cat: Category) => Promise<void>;
  /** 删除指定分类 */
  deleteCategory: (id: string) => Promise<void>;
}

/** 应用配置与分类管理 Store */
export const useSettingsStore = create<SettingsStore>((set, get) => ({
  config: DEFAULT_CONFIG,
  categories: [],
  isLoading: false,

  fetchSettings: async () => {
    set({ isLoading: true });
    const config = await settingsApi.getSettings();
    set({ config, isLoading: false });
  },

  fetchCategories: async () => {
    const categories = await settingsApi.getCategories();
    set({ categories });
  },

  updateSettings: async (section) => {
    // 在前端合并部分更新为完整配置，匹配后端全量覆盖逻辑
    const merged = { ...get().config, ...section };
    const config = await settingsApi.updateSettings(merged);
    set({ config });
  },

  upsertCategory: async (cat) => {
    const updated = await settingsApi.upsertCategory(cat);
    set((s) => {
      const idx = s.categories.findIndex((c) => c.id === updated.id);
      if (idx >= 0) {
        // 更新已有分类
        const next = [...s.categories];
        next[idx] = updated;
        return { categories: next };
      }
      // 插入新分类
      return { categories: [...s.categories, updated] };
    });
  },

  deleteCategory: async (id) => {
    await settingsApi.deleteCategory(id);
    set((s) => ({
      categories: s.categories.filter((c) => c.id !== id),
    }));
  },
}));
