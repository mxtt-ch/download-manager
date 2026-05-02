import { useEffect } from "react";
import "./GlobalStats.less";
import { useDownloadStore } from "@/store/downloadStore";
import { SpeedChart } from "./SpeedChart";
import { Download, Upload, HardDrive } from "lucide-react";

import { formatDiskSize, formatDownSpeed, formatUpSpeed } from "@/utils/util";

/**
 * 全局统计区组件
 * 固定于主页面右下角的悬浮小组件，展示全局速率、速度折线图和磁盘空间。
 */
export function GlobalStats() {
  const globalDownSpeed = useDownloadStore((s) => s.globalDownSpeed);
  const globalUpSpeed = useDownloadStore((s) => s.globalUpSpeed);
  const diskInfo = useDownloadStore((s) => s.diskInfo);
  const initSpeedHistory = useDownloadStore((s) => s.initSpeedHistory);
  const fetchDiskSpace = useDownloadStore((s) => s.fetchDiskSpace);

  useEffect(() => {
    initSpeedHistory();
    fetchDiskSpace("D:");
  }, [initSpeedHistory, fetchDiskSpace]);

  const diskUsedPercent = diskInfo && diskInfo.total > 0 ? Math.round((diskInfo.used / diskInfo.total) * 100) : 0;
  const freeText = diskInfo ? formatDiskSize(diskInfo.free) : "--";
  const totalText = diskInfo ? formatDiskSize(diskInfo.total) : "--";

  return (
    <div className="global-stats">
      {/* 顶部 — 下载/上传速率 */}
      <div className="flex items-center justify-between mb-sm">
        <div className="flex items-center gap-1.5">
          <Download className="h-4 w-4 text-link shrink-0" />
          <div className="flex items-baseline gap-0.5">
            <span className="global-stats__speed-value tabular-nums leading-tight">
              {formatDownSpeed(globalDownSpeed)}
            </span>
            <span className="global-stats__speed-unit">MB/s</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Upload className="h-4 w-4" style={{ color: "#22c55e" }} />
          <div className="flex items-baseline gap-0.5">
            <span className="text-sm font-semibold text-primary tabular-nums leading-tight">
              {formatUpSpeed(globalUpSpeed)}
            </span>
            <span className="global-stats__speed-unit">KB/s</span>
          </div>
        </div>
      </div>

      {/* 中部 — 速度折线图 */}
      <SpeedChart />

      {/* 底部 — 磁盘空间 */}
      <div className="mt-sm" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <div className="flex items-center gap-1.5">
          <HardDrive className="h-3.5 w-3.5 text-muted shrink-0" />
          <div className="global-stats__disk-bar">
            <div className="global-stats__disk-fill" style={{ width: `${diskUsedPercent}%` }} />
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-muted">
          <span>剩余 {freeText} / 共 {totalText}</span>
          <span>D:\</span>
        </div>
      </div>
    </div>
  );
}
