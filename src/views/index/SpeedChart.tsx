import { useDownloadStore } from "@/store/downloadStore";
import type { SpeedDataPoint } from "@/types";
import "./SpeedChart.less";

/** 图表尺寸常量 */
const SVG_WIDTH = 600;
const SVG_HEIGHT = 200;
const PADDING_TOP = 8;
const PADDING_BOTTOM = 20;
const PADDING_LEFT = 8;
const PADDING_RIGHT = 8;
const PLOT_WIDTH = SVG_WIDTH - PADDING_LEFT - PADDING_RIGHT;
const PLOT_HEIGHT = SVG_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

/**
 * 将速度历史数组转换为折线 points 属性字符串
 */
function buildPoints(
  data: SpeedDataPoint[],
  field: "downSpeed" | "upSpeed",
  maxVal: number,
  width: number,
  height: number,
): string {
  if (data.length === 0) return "";
  return data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - (d[field] / maxVal) * height;
      return `${x},${y}`;
    })
    .join(" ");
}

/**
 * 计算 Y 轴刻度：将最大值向上取整到最近的 MB/s。
 */
function computeYAxisMax(maxBytesPerSec: number): number {
  if (maxBytesPerSec <= 0) return 1 * 1024 * 1024;
  const mb = maxBytesPerSec / (1024 * 1024);
  const roundedUpMb = Math.ceil(mb);
  return roundedUpMb * 1024 * 1024;
}

import { formatSpeedSmart } from "@/utils/util";

/** 生成虚线网格线 */
function GridLines() {
  return (
    <>
      {[0, 1, 2, 3].map((i) => {
        const y = PADDING_TOP + (PLOT_HEIGHT / 4) * (i + 1);
        return (
          <line key={`h-${i}`} x1={PADDING_LEFT} y1={y} x2={SVG_WIDTH - PADDING_RIGHT} y2={y}
            stroke="var(--text-muted)" strokeDasharray="4 4" strokeWidth={0.5} />
        );
      })}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const x = PADDING_LEFT + (PLOT_WIDTH / 6) * (i + 1);
        return (
          <line key={`v-${i}`} x1={x} y1={PADDING_TOP} x2={x} y2={SVG_HEIGHT - PADDING_BOTTOM}
            stroke="var(--text-muted)" strokeDasharray="4 4" strokeWidth={0.5} />
        );
      })}
    </>
  );
}

/**
 * 实时速度折线图组件
 * 使用 SVG 绘制下载和上传速度的实时折线图。
 */
export function SpeedChart() {
  const speedHistory = useDownloadStore((s) => s.speedHistory);

  if (!speedHistory || speedHistory.length < 2) {
    return (
      <div className="speed-chart__empty w-full" style={{ height: 90, display: "flex", alignItems: "center", justifyContent: "center" }}>
        暂无数据
      </div>
    );
  }

  const maxDownSpeed = Math.max(...speedHistory.map((d) => d.downSpeed));
  const maxUpSpeed = Math.max(...speedHistory.map((d) => d.upSpeed));
  const rawMax = Math.max(maxDownSpeed, maxUpSpeed);
  const yAxisMax = computeYAxisMax(rawMax);

  const downPoints = buildPoints(speedHistory, "downSpeed", yAxisMax, PLOT_WIDTH, PLOT_HEIGHT);
  const upPoints = buildPoints(speedHistory, "upSpeed", yAxisMax, PLOT_WIDTH, PLOT_HEIGHT);

  function buildAreaPath(pointsStr: string): string {
    if (!pointsStr || speedHistory.length < 2) return "";
    const firstX = 0;
    const lastX = PLOT_WIDTH;
    const bottomY = PLOT_HEIGHT;
    return `M${firstX},${bottomY} L${pointsStr} L${lastX},${bottomY} Z`;
  }

  const downAreaPath = buildAreaPath(downPoints);
  const upAreaPath = buildAreaPath(upPoints);
  const yLabel = formatSpeedSmart(yAxisMax).replace("/s", "");

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} preserveAspectRatio="none" className="w-full" style={{ height: 90 }}>
        <GridLines />
        <defs>
          <linearGradient id="downGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="upGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#22c55e" stopOpacity={0.05} />
          </linearGradient>
        </defs>

        <g transform={`translate(${PADDING_LEFT}, ${PADDING_TOP})`}>
          {downAreaPath && <path d={downAreaPath} fill="url(#downGradient)" stroke="none" />}
          {upAreaPath && <path d={upAreaPath} fill="url(#upGradient)" stroke="none" />}
          {downPoints && <polyline points={downPoints} fill="none" stroke="#3b82f6" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />}
          {upPoints && <polyline points={upPoints} fill="none" stroke="#22c55e" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />}
        </g>

        <text x={PADDING_LEFT + 2} y={PADDING_TOP + 12} className="speed-chart__label">{yLabel}</text>
      </svg>
    </div>
  );
}
