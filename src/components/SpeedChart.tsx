import { useDownloadStore } from "@/store/downloadStore";
import type { SpeedDataPoint } from "@/types";

/** 图表尺寸常量 */
const SVG_WIDTH = 600;
const SVG_HEIGHT = 200;
/** 图表内边距（为轴标签留空间） */
const PADDING_TOP = 8;
const PADDING_BOTTOM = 20;
const PADDING_LEFT = 8;
const PADDING_RIGHT = 8;

/** 可绘制区域尺寸 */
const PLOT_WIDTH = SVG_WIDTH - PADDING_LEFT - PADDING_RIGHT;
const PLOT_HEIGHT = SVG_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

/**
 * 将速度历史数组转换为折线 points 属性字符串
 *
 * @param data    - 速度历史数据点数组
 * @param field   - 要绘制的字段（"downSpeed" 或 "upSpeed"）
 * @param maxVal  - Y 轴最大值
 * @param width   - 可绘制区域宽度
 * @param height  - 可绘制区域高度
 * @returns SVG polyline points 属性值，例如 "0,100 10,80 20,90"
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
 *
 * 例如：
 * - 如果最大速度为 3.7 MB/s → 向上取整为 4 MB/s
 * - 如果最大速度为 12.3 MB/s → 向上取整为 13 MB/s
 *
 * @param maxBytesPerSec - 最大速度（字节/秒）
 * @returns 向上取整后的最大值（字节/秒）
 */
function computeYAxisMax(maxBytesPerSec: number): number {
  if (maxBytesPerSec <= 0) return 1 * 1024 * 1024; // 默认 1 MB/s
  const mb = maxBytesPerSec / (1024 * 1024);
  const roundedUpMb = Math.ceil(mb);
  return roundedUpMb * 1024 * 1024;
}

/**
 * 格式化速度文本为可读的 MB/s 或 KB/s
 *
 * @param bytesPerSec - 字节/秒
 * @returns 格式化字符串，例如 "10.5 MB/s" 或 "512 KB/s"
 */
function formatSpeed(bytesPerSec: number): string {
  const mb = bytesPerSec / (1024 * 1024);
  if (mb >= 1) {
    return `${mb.toFixed(1)} MB/s`;
  }
  const kb = bytesPerSec / 1024;
  return `${kb.toFixed(0)} KB/s`;
}

/** 生成虚线网格线 */
function GridLines() {
  return (
    <>
      {/* 水平网格线 — 4 条（等分 Y 轴） */}
      {[0, 1, 2, 3].map((i) => {
        const y =
          PADDING_TOP + (PLOT_HEIGHT / 4) * (i + 1);
        return (
          <line
            key={`h-${i}`}
            x1={PADDING_LEFT}
            y1={y}
            x2={SVG_WIDTH - PADDING_RIGHT}
            y2={y}
            stroke="#cbd5e1"
            strokeDasharray="4 4"
            strokeWidth={0.5}
          />
        );
      })}
      {/* 垂直网格线 — 6 条（等分 X 轴） */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const x =
          PADDING_LEFT + (PLOT_WIDTH / 6) * (i + 1);
        return (
          <line
            key={`v-${i}`}
            x1={x}
            y1={PADDING_TOP}
            x2={x}
            y2={SVG_HEIGHT - PADDING_BOTTOM}
            stroke="#cbd5e1"
            strokeDasharray="4 4"
            strokeWidth={0.5}
          />
        );
      })}
    </>
  );
}

/**
 * 实时速度折线图组件
 *
 * 使用 SVG 绘制下载和上传速度的实时折线图。
 * 包括虚线网格背景、蓝色下载折线（带半透明面积填充）、绿色上传折线。
 * Y 轴范围自适应数据最大值。
 * 无数据时显示"暂无数据"提示。
 */
export function SpeedChart() {
  const speedHistory = useDownloadStore((s) => s.speedHistory);

  // 无数据时渲染空状态
  if (!speedHistory || speedHistory.length < 2) {
    return (
      <div className="w-full h-[90px] flex items-center justify-center text-xs text-slate-400 select-none">
        暂无数据
      </div>
    );
  }

  // 找出数据中的最大速度值
  const maxDownSpeed = Math.max(...speedHistory.map((d) => d.downSpeed));
  const maxUpSpeed = Math.max(...speedHistory.map((d) => d.upSpeed));
  const rawMax = Math.max(maxDownSpeed, maxUpSpeed);
  const yAxisMax = computeYAxisMax(rawMax);

  // 构建折线点字符串
  const downPoints = buildPoints(
    speedHistory,
    "downSpeed",
    yAxisMax,
    PLOT_WIDTH,
    PLOT_HEIGHT,
  );
  const upPoints = buildPoints(
    speedHistory,
    "upSpeed",
    yAxisMax,
    PLOT_WIDTH,
    PLOT_HEIGHT,
  );

  // 构建填充区域路径：折线 + 底部闭合（绘图空间坐标，后续通过 <g> 平移）
  function buildAreaPath(pointsStr: string): string {
    if (!pointsStr || speedHistory.length < 2) return "";
    const firstX = 0;
    const lastX = PLOT_WIDTH;
    const bottomY = PLOT_HEIGHT;
    return `M${firstX},${bottomY} L${pointsStr} L${lastX},${bottomY} Z`;
  }

  const downAreaPath = buildAreaPath(downPoints);
  const upAreaPath = buildAreaPath(upPoints);

  // 格式化 Y 轴标签
  const yLabel = formatSpeed(yAxisMax).replace("/s", ""); // 只显示 "X.X MB"

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        preserveAspectRatio="none"
        className="w-full h-[90px]"
      >
        {/* 虚线网格背景 */}
        <GridLines />

        {/* 渐变定义 */}
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

        {/* 绘图区域 — 整体平移至图表内边距位置 */}
        <g transform={`translate(${PADDING_LEFT}, ${PADDING_TOP})`}>
          {/* 下载速度面积填充（半透明蓝色） */}
          {downAreaPath && (
            <path
              d={downAreaPath}
              fill="url(#downGradient)"
              stroke="none"
            />
          )}

          {/* 上传速度面积填充（半透明绿色） */}
          {upAreaPath && (
            <path
              d={upAreaPath}
              fill="url(#upGradient)"
              stroke="none"
            />
          )}

          {/* 下载速度折线（蓝色） */}
          {downPoints && (
            <polyline
              points={downPoints}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* 上传速度折线（绿色） */}
          {upPoints && (
            <polyline
              points={upPoints}
              fill="none"
              stroke="#22c55e"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </g>

        {/* Y 轴最大值标签 */}
        <text
          x={PADDING_LEFT + 2}
          y={PADDING_TOP + 12}
          className="fill-slate-400 dark:fill-slate-500 text-[10px]"
          fontSize={10}
        >
          {yLabel}
        </text>
      </svg>
    </div>
  );
}
