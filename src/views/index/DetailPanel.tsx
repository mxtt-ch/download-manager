import { useEffect, useState } from "react";
import { useTaskStore } from "@/store/taskStore";
import { useSettingsStore } from "@/store/settingsStore";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { getQueues } from "@/api/queues";
import type { Queue } from "@/types";
import { X, FileText, Cpu, FolderTree, ScrollText } from "lucide-react";

import { formatDate, formatBytes, formatSpeed } from "@/utils/util";

// ============================================================
// 子组件
// ============================================================

/** 详情条目 Props */
interface DetailItemProps {
  /** 标签文字 */
  label: string;
  /** 显示值 */
  value: string;
  /** 是否截断文字并显示 title 完整值 */
  truncate?: boolean;
  /** 是否以红色显示（错误码） */
  error?: boolean;
}

/**
 * 详情条目子组件
 * 网格布局中的一行：左侧灰色标签 + 右侧值
 */
function DetailItem({ label, value, truncate, error }: DetailItemProps) {
  return (
    <>
      <span className="text-slate-400 shrink-0 select-none">{label}:</span>
      <span
        className={cn(
          "min-w-0",
          truncate && "truncate",
          error && "text-red-600 dark:text-red-400 font-medium",
        )}
        title={truncate ? value : undefined}
      >
        {value}
      </span>
    </>
  );
}

// ============================================================
// 线程状态中文映射
// ============================================================

const THREAD_STATUS_LABEL: Record<string, string> = {
  idle: "空闲",
  downloading: "下载中",
  completed: "已完成",
};

// ============================================================
// 主组件
// ============================================================

/**
 * 底部任务详情面板
 *
 * 当 useTaskStore().activeTaskId 不为 null 时从底部滑入展开。
 * 包含四个选项卡：任务详情、线程信息、文件列表、日志。
 * 使用 transition-all duration-300 实现滑入/滑出动画。
 */
export function DetailPanel() {
  const activeTaskId = useTaskStore((s) => s.activeTaskId);
  const activeTaskDetail = useTaskStore((s) => s.activeTaskDetail);
  const clearActiveTask = useTaskStore((s) => s.clearActiveTask);
  const categories = useSettingsStore((s) => s.categories);
  const fetchCategories = useSettingsStore((s) => s.fetchCategories);

  const [queues, setQueues] = useState<Queue[]>([]);

  /** 组件挂载时加载分类和队列列表，供名称查找使用 */
  useEffect(() => {
    fetchCategories();
    getQueues()
      .then(setQueues)
      .catch(() => { });
  }, [fetchCategories]);

  const isOpen = activeTaskId !== null;
  const detail = activeTaskDetail;

  // ——————————————————————————————————————————————
  // 查找关联名称
  // ——————————————————————————————————————————————

  /** 根据 queueId 查找队列名称，找不到则回退为 queueId 本身 */
  const queueName = detail
    ? queues.find((q) => q.id === detail.queueId)?.name || detail.queueId
    : "--";

  /** 根据 categoryId 查找分类名称 */
  const categoryName = detail?.categoryId
    ? categories.find((c) => c.id === detail.categoryId)?.name
    : undefined;

  // ——————————————————————————————————————————————
  // 检测哈希类型
  // ——————————————————————————————————————————————

  /**
   * 根据预期哈希字符串长度推断类型标签
   * MD5: 32 字符十六进制, SHA256: 64 字符十六进制
   */
  const hashLabel = detail?.expectedHash
    ? detail.expectedHash.length === 64
      ? "SHA256"
      : detail.expectedHash.length === 32
        ? "MD5"
        : "HASH"
    : undefined;

  return (
    <div
      className={cn(
        "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0 transition-all duration-300 ease-in-out overflow-hidden",
        isOpen ? "max-h-60 border-t" : "max-h-0 border-t-0",
      )}
    >
      {isOpen && detail && (
        <div className="flex flex-col max-h-60">
          {/* ============================================================ */}
          {/* 顶部栏：文件名 + 关闭按钮                                     */}
          {/* ============================================================ */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <h3 className="font-medium text-sm truncate mr-2">
              {detail.filename}
            </h3>
            <button
              type="button"
              onClick={clearActiveTask}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              title="关闭详情面板"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* ============================================================ */}
          {/* 选项卡区域                                                      */}
          {/* ============================================================ */}
          <Tabs
            defaultValue="details"
            className="flex-1 min-h-0 flex flex-col px-4"
          >
            {/* 选项卡导航 */}
            <TabsList className="shrink-0 mt-2 w-fit">
              <TabsTrigger value="details">
                <FileText className="h-3.5 w-3.5 mr-1" />
                任务详情
              </TabsTrigger>
              <TabsTrigger value="threads">
                <Cpu className="h-3.5 w-3.5 mr-1" />
                线程信息
              </TabsTrigger>
              <TabsTrigger value="files">
                <FolderTree className="h-3.5 w-3.5 mr-1" />
                文件列表
              </TabsTrigger>
              <TabsTrigger value="logs">
                <ScrollText className="h-3.5 w-3.5 mr-1" />
                日志
              </TabsTrigger>
            </TabsList>

            {/* ========================================================== */}
            {/* Tab 1: 任务详情                                              */}
            {/* ========================================================== */}
            <TabsContent
              value="details"
              className="flex-1 min-h-0 overflow-y-auto mt-1"
            >
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm py-2">
                <DetailItem label="URL" value={detail.url} truncate />
                <DetailItem
                  label="保存路径"
                  value={detail.savePath}
                  truncate
                />
                <DetailItem label="队列" value={queueName} />
                <DetailItem
                  label="分类"
                  value={categoryName || "未分类"}
                />
                <DetailItem
                  label="创建时间"
                  value={formatDate(detail.createdAt)}
                />
                <DetailItem
                  label="开始时间"
                  value={
                    detail.startedAt
                      ? formatDate(detail.startedAt)
                      : "未开始"
                  }
                />
                <DetailItem
                  label="完成时间"
                  value={formatDate(detail.completedAt)}
                />
                <DetailItem
                  label="文件大小"
                  value={formatBytes(detail.totalSize)}
                />
                {hashLabel && detail.expectedHash && (
                  <DetailItem
                    label={`预期哈希 (${hashLabel})`}
                    value={detail.expectedHash}
                    truncate
                  />
                )}
                {detail.errorCode && (
                  <DetailItem
                    label="错误码"
                    value={detail.errorCode}
                    error
                  />
                )}
              </div>
            </TabsContent>

            {/* ========================================================== */}
            {/* Tab 2: 线程信息                                              */}
            {/* ========================================================== */}
            <TabsContent
              value="threads"
              className="flex-1 min-h-0 overflow-y-auto mt-1"
            >
              {detail.threads.length === 0 ? (
                <div className="flex items-center justify-center py-6">
                  <p className="text-slate-400 text-sm">暂无线程数据</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-left">
                      <th className="py-1.5 pr-2 font-medium text-slate-600 dark:text-slate-400">
                        线程编号
                      </th>
                      <th className="py-1.5 pr-2 font-medium text-slate-600 dark:text-slate-400">
                        下载区间
                      </th>
                      <th className="py-1.5 pr-2 font-medium text-slate-600 dark:text-slate-400">
                        进度
                      </th>
                      <th className="py-1.5 pr-2 font-medium text-slate-600 dark:text-slate-400">
                        当前速度
                      </th>
                      <th className="py-1.5 font-medium text-slate-600 dark:text-slate-400">
                        状态
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.threads.map((t) => {
                      const rangeSize = t.endByte - t.startByte;
                      const isCompleted = t.status === "completed";
                      const isDownloading = t.status === "downloading";

                      return (
                        <tr
                          key={t.chunkIndex}
                          className="border-b border-slate-50 dark:border-slate-800/40"
                        >
                          {/* 线程编号 */}
                          <td className="py-1.5 pr-2 font-mono text-xs">
                            #{t.chunkIndex + 1}
                          </td>

                          {/* 下载区间 */}
                          <td className="py-1.5 pr-2 text-slate-600 dark:text-slate-400 font-mono text-xs">
                            {formatBytes(t.startByte)} -{" "}
                            {formatBytes(t.endByte)}
                          </td>

                          {/* 进度条 */}
                          <td className="py-1.5 pr-2">
                            <div className="flex items-center gap-1.5">
                              <Progress
                                value={
                                  isCompleted
                                    ? rangeSize
                                    : t.downloadedOffset
                                }
                                max={rangeSize > 0 ? rangeSize : 100}
                                className="w-20"
                              />
                              <span className="text-xs text-slate-400 w-9 text-right shrink-0">
                                {rangeSize > 0
                                  ? `${Math.round(
                                    (t.downloadedOffset / rangeSize) *
                                    100,
                                  )}%`
                                  : "--"}
                              </span>
                            </div>
                          </td>

                          {/* 当前速度 */}
                          <td className="py-1.5 pr-2 text-slate-600 dark:text-slate-400 text-xs">
                            {isDownloading && t.speed > 0
                              ? formatSpeed(t.speed)
                              : "--"}
                          </td>

                          {/* 状态 */}
                          <td className="py-1.5 text-xs">
                            <span
                              className={cn(
                                "inline-flex px-1.5 py-0.5 rounded-full",
                                isCompleted &&
                                "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
                                isDownloading &&
                                "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
                                t.status === "idle" &&
                                "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
                              )}
                            >
                              {THREAD_STATUS_LABEL[t.status] || t.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </TabsContent>

            {/* ========================================================== */}
            {/* Tab 3: 文件列表（占位）                                      */}
            {/* ========================================================== */}
            <TabsContent
              value="files"
              className="flex-1 min-h-0 overflow-y-auto flex items-center justify-center"
            >
              <p className="text-slate-400 text-sm">
                仅支持 URL 下载模式
              </p>
            </TabsContent>

            {/* ========================================================== */}
            {/* Tab 4: 日志                                                  */}
            {/* ========================================================== */}
            <TabsContent
              value="logs"
              className="flex-1 min-h-0 overflow-y-auto mt-1"
            >
              {detail.logs.length === 0 ? (
                <div className="flex items-center justify-center py-6">
                  <p className="text-slate-400 text-sm">暂无日志记录</p>
                </div>
              ) : (
                <div className="py-2 space-y-0.5">
                  {[...detail.logs]
                    // 按时间戳降序排列，最新日志在上方
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .map((log, i) => (
                      <div
                        key={i}
                        className="flex gap-3 text-sm py-0.5 items-baseline"
                      >
                        {/* 时间戳 */}
                        <span className="shrink-0 text-slate-400 text-xs font-mono tabular-nums w-[140px]">
                          {formatDate(log.timestamp)}
                        </span>
                        {/* 分隔线 */}
                        <span className="shrink-0 w-1.5 h-1.5 rounded-full mt-1.5 bg-slate-300 dark:bg-slate-600" />
                        {/* 日志消息 */}
                        <span
                          className={cn(
                            log.level === "error" &&
                            "text-red-600 dark:text-red-400",
                            log.level === "warn" &&
                            "text-yellow-600 dark:text-yellow-400",
                            log.level === "info" &&
                            "text-slate-600 dark:text-slate-400",
                          )}
                        >
                          {log.message}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
