import { useEffect } from "react";
import "@/assets/style/global-stats.less";
import { useDownloadStore } from "@/store/downloadStore";
import { SpeedChart } from "./SpeedChart";
import { Download, Upload, HardDrive } from "lucide-react";

import { formatDiskSize, formatDownSpeed, formatUpSpeed } from "@/utils/util";

/**
 * 全局统计区组件
 *
 * 固定于主页面右下角的悬浮小组件，展示：
 * - 全局下载/上传实时速率
 * - 实时速度折线图（SpeedChart）
 * - 磁盘空间使用情况（进度条 + 剩余空间）
 *
 * 数据来源：useDownloadStore（globalDownSpeed, globalUpSpeed, speedHistory, diskInfo）
 * 挂载时自动初始化速度历史并获取磁盘空间信息。
 */
export function GlobalStats() {
  const globalDownSpeed = useDownloadStore((s) => s.globalDownSpeed);
  const globalUpSpeed = useDownloadStore((s) => s.globalUpSpeed);
  const diskInfo = useDownloadStore((s) => s.diskInfo);
  const initSpeedHistory = useDownloadStore((s) => s.initSpeedHistory);
  const fetchDiskSpace = useDownloadStore((s) => s.fetchDiskSpace);

  /** 组件挂载时初始化数据 */
  useEffect(() => {
    initSpeedHistory();
    fetchDiskSpace("D:");
  }, [initSpeedHistory, fetchDiskSpace]);

  // 计算磁盘使用百分比
  const diskUsedPercent =
    diskInfo && diskInfo.total > 0
      ? Math.round((diskInfo.used / diskInfo.total) * 100)
      : 0;

  // 磁盘剩余空间文本
  const freeText = diskInfo ? formatDiskSize(diskInfo.free) : "--";

  // 磁盘总量文本
  const totalText = diskInfo ? formatDiskSize(diskInfo.total) : "--";

  return (
    <div
      className={[
        "absolute bottom-4 right-4",
        "w-72 p-3",
        "bg-white/90 dark:bg-slate-900/90 backdrop-blur",
        "border border-slate-200 dark:border-slate-700",
        "rounded-lg",
        "shadow-lg",
        "text-slate-700 dark:text-slate-300",
        "select-none",
      ].join(" ")}
    >
      {/* ================================================================ */}
      {/* 顶部 — 全局下载速率 + 全局上传速率（左右布局）                */}
      {/* ================================================================ */}
      <div className="flex items-center justify-between mb-2">
        {/* 左侧 — 下载速率 */}
        <div className="flex items-center gap-1.5">
          <Download className="h-4 w-4 text-blue-500 shrink-0" />
          <div className="flex items-baseline gap-0.5">
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums leading-tight">
              {formatDownSpeed(globalDownSpeed)}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              MB/s
            </span>
          </div>
        </div>

        {/* 右侧 — 上传速率 */}
        <div className="flex items-center gap-1.5">
          <Upload className="h-4 w-4 text-green-500 shrink-0" />
          <div className="flex items-baseline gap-0.5">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 tabular-nums leading-tight">
              {formatUpSpeed(globalUpSpeed)}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              KB/s
            </span>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 中部 — 实时速度折线图                                            */}
      {/* ================================================================ */}
      <SpeedChart />

      {/* ================================================================ */}
      {/* 底部 — 磁盘空间指示                                             */}
      {/* ================================================================ */}
      <div className="mt-2 space-y-1.5">
        {/* 磁盘图标 + 使用占比进度条 */}
        <div className="flex items-center gap-1.5">
          <HardDrive className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            {/* 进度条填充 — 根据已用空间占比动态设置宽度 */}
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${diskUsedPercent}%` }}
            />
          </div>
        </div>

        {/* 剩余空间 + 总计文本 + 磁盘路径 */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
          <span>
            剩余 {freeText} / 共 {totalText}
          </span>
          <span className="text-slate-400 dark:text-slate-500">
            D:\
          </span>
        </div>
      </div>
    </div>
  );
}
