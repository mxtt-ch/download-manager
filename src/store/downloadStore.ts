import { create } from "zustand";
import type { DiskInfo, SpeedDataPoint } from "@/types";
import { getDiskSpace } from "@/api/system";
import { getSpeedHistoryMock } from "@/mocks/handlers";

interface DownloadStore {
  // 状态
  /** 全局下载速度（字节/秒） */
  globalDownSpeed: number;
  /** 全局上传速度（字节/秒） */
  globalUpSpeed: number;
  /** 速度历史数据，最多保留 60 个数据点 */
  speedHistory: SpeedDataPoint[];
  /** 磁盘空间信息 */
  diskInfo: DiskInfo | null;

  // 操作
  /** 设置当前全局速度 */
  setGlobalSpeed: (down: number, up: number) => void;
  /** 添加一个速度数据点，自动保持最近 60 条 */
  pushSpeedPoint: (point: SpeedDataPoint) => void;
  /** 获取指定路径的磁盘空间信息 */
  fetchDiskSpace: (path: string) => Promise<void>;
  /** 从模拟数据加载初始速度历史 */
  initSpeedHistory: () => Promise<void>;
}

/** 下载速度与系统状态管理 Store */
export const useDownloadStore = create<DownloadStore>((set) => ({
  globalDownSpeed: 0,
  globalUpSpeed: 0,
  speedHistory: [],
  diskInfo: null,

  setGlobalSpeed: (down, up) =>
    set({ globalDownSpeed: down, globalUpSpeed: up }),

  pushSpeedPoint: (point) =>
    set((s) => ({
      // 追加新数据点，并保持数组长度不超过 60
      speedHistory: [...s.speedHistory, point].slice(-60),
    })),

  fetchDiskSpace: async (path) => {
    const diskInfo = await getDiskSpace(path);
    set({ diskInfo });
  },

  initSpeedHistory: async () => {
    const history = await getSpeedHistoryMock();
    // 初始加载时也保留最多 60 个数据点
    set({ speedHistory: history.slice(-60) });
  },
}));
