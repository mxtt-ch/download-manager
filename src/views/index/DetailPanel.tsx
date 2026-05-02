import { useEffect, useState } from "react";
import "./DetailPanel.less";
import { useTaskStore } from "@/store/taskStore";
import { useSettingsStore } from "@/store/settingsStore";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { getQueues } from "@/api/queues";
import type { Queue } from "@/types";
import { X, FileText, Cpu, FolderTree, ScrollText } from "lucide-react";

import { formatDate, formatBytes, formatSpeed } from "@/utils/util";

// ============================================================
// 子组件
// ============================================================

interface DetailItemProps {
  label: string;
  value: string;
  truncate?: boolean;
  error?: boolean;
}

/** 详情条目子组件 — 网格布局中的一行 */
function DetailItem({ label, value, truncate, error }: DetailItemProps) {
  return (
    <>
      <span className="detail-panel__detail-label">{label}:</span>
      <span
        className={`min-w-0 ${truncate ? "truncate" : ""} ${error ? "text-red-500 font-medium" : ""}`}
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
 * 当 useTaskStore().activeTaskId 不为 null 时从底部滑入展开。
 */
export function DetailPanel() {
  const activeTaskId = useTaskStore((s) => s.activeTaskId);
  const activeTaskDetail = useTaskStore((s) => s.activeTaskDetail);
  const clearActiveTask = useTaskStore((s) => s.clearActiveTask);
  const categories = useSettingsStore((s) => s.categories);
  const fetchCategories = useSettingsStore((s) => s.fetchCategories);

  const [queues, setQueues] = useState<Queue[]>([]);

  useEffect(() => {
    fetchCategories();
    getQueues().then(setQueues).catch(() => { });
  }, [fetchCategories]);

  const isOpen = activeTaskId !== null;
  const detail = activeTaskDetail;

  const queueName = detail
    ? queues.find((q) => q.id === detail.queueId)?.name || detail.queueId
    : "--";

  const categoryName = detail?.categoryId
    ? categories.find((c) => c.id === detail.categoryId)?.name
    : undefined;

  const hashLabel = detail?.expectedHash
    ? detail.expectedHash.length === 64 ? "SHA256" : detail.expectedHash.length === 32 ? "MD5" : "HASH"
    : undefined;

  return (
    <div
      className={`detail-panel ${isOpen ? "detail-panel--open border-t" : "detail-panel--closed border-t-0"}`}
    >
      {isOpen && detail && (
        <div className="flex flex-col max-h-60">
          {/* 顶部栏 */}
          <div className="detail-panel__header">
            <h3 className="mr-sm">{detail.filename}</h3>
            <button type="button" onClick={clearActiveTask} className="detail-panel__close-btn" title="关闭详情面板">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* 选项卡区域 */}
          <Tabs defaultValue="details" className="flex-1 min-h-0 flex flex-col px-lg">
            <TabsList className="shrink-0 mt-sm w-fit">
              <TabsTrigger value="details">
                <FileText className="h-3.5 w-3.5 mr-xs" />任务详情
              </TabsTrigger>
              <TabsTrigger value="threads">
                <Cpu className="h-3.5 w-3.5 mr-xs" />线程信息
              </TabsTrigger>
              <TabsTrigger value="files">
                <FolderTree className="h-3.5 w-3.5 mr-xs" />文件列表
              </TabsTrigger>
              <TabsTrigger value="logs">
                <ScrollText className="h-3.5 w-3.5 mr-xs" />日志
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: 任务详情 */}
            <TabsContent value="details" className="flex-1 min-h-0 overflow-y-auto mt-xs">
              <div className="detail-panel__detail-grid py-sm">
                <DetailItem label="URL" value={detail.url} truncate />
                <DetailItem label="保存路径" value={detail.savePath} truncate />
                <DetailItem label="队列" value={queueName} />
                <DetailItem label="分类" value={categoryName || "未分类"} />
                <DetailItem label="创建时间" value={formatDate(detail.createdAt)} />
                <DetailItem label="开始时间" value={detail.startedAt ? formatDate(detail.startedAt) : "未开始"} />
                <DetailItem label="完成时间" value={formatDate(detail.completedAt)} />
                <DetailItem label="文件大小" value={formatBytes(detail.totalSize)} />
                {hashLabel && detail.expectedHash && (
                  <DetailItem label={`预期哈希 (${hashLabel})`} value={detail.expectedHash} truncate />
                )}
                {detail.errorCode && <DetailItem label="错误码" value={detail.errorCode} error />}
              </div>
            </TabsContent>

            {/* Tab 2: 线程信息 */}
            <TabsContent value="threads" className="flex-1 min-h-0 overflow-y-auto mt-xs">
              {detail.threads.length === 0 ? (
                <div className="flex items-center justify-center py-xl"><p className="text-muted text-sm">暂无线程数据</p></div>
              ) : (
                <table className="detail-panel__thread-table">
                  <thead>
                    <tr className="border-b border-t border-border">
                      <th className="detail-panel__thread-head">线程编号</th>
                      <th className="detail-panel__thread-head">下载区间</th>
                      <th className="detail-panel__thread-head">进度</th>
                      <th className="detail-panel__thread-head">当前速度</th>
                      <th className="detail-panel__thread-head">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.threads.map((t) => {
                      const rangeSize = t.endByte - t.startByte;
                      const isCompleted = t.status === "completed";
                      const isDownloading = t.status === "downloading";
                      return (
                        <tr key={t.chunkIndex} className="detail-panel__thread-row">
                          <td className="py-xs pr-sm font-mono text-xs">#{t.chunkIndex + 1}</td>
                          <td className="py-xs pr-sm text-secondary font-mono text-xs">
                            {formatBytes(t.startByte)} - {formatBytes(t.endByte)}
                          </td>
                          <td className="py-xs pr-sm">
                            <div className="flex items-center gap-1.5">
                              <Progress value={isCompleted ? rangeSize : t.downloadedOffset} max={rangeSize > 0 ? rangeSize : 100} className="w-20" />
                              <span className="text-xs text-muted w-9 text-right shrink-0">
                                {rangeSize > 0 ? `${Math.round((t.downloadedOffset / rangeSize) * 100)}%` : "--"}
                              </span>
                            </div>
                          </td>
                          <td className="py-xs pr-sm text-secondary text-xs">
                            {isDownloading && t.speed > 0 ? formatSpeed(t.speed) : "--"}
                          </td>
                          <td className="py-xs text-xs">
                            <span className={`task-table__status ${isCompleted ? "task-table__status--completed" : isDownloading ? "task-table__status--downloading" : "task-table__status--pending"}`}>
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

            {/* Tab 3: 文件列表 */}
            <TabsContent value="files" className="flex-1 min-h-0 overflow-y-auto flex items-center justify-center">
              <p className="text-muted text-sm">仅支持 URL 下载模式</p>
            </TabsContent>

            {/* Tab 4: 日志 */}
            <TabsContent value="logs" className="flex-1 min-h-0 overflow-y-auto mt-xs">
              {detail.logs.length === 0 ? (
                <div className="flex items-center justify-center py-xl"><p className="text-muted text-sm">暂无日志记录</p></div>
              ) : (
                <div className="py-sm" style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  {[...detail.logs].sort((a, b) => b.timestamp - a.timestamp).map((log, i) => (
                    <div key={i} className="detail-panel__log-item">
                      <span className="shrink-0 text-muted text-xs font-mono tabular-nums w-[140px]">{formatDate(log.timestamp)}</span>
                      <span className="shrink-0" style={{ width: 6, height: 6, borderRadius: "50%", marginTop: 6, backgroundColor: "var(--text-muted)" }} />
                      <span className={`${log.level === "error" ? "detail-panel__log-item--error" : log.level === "warn" ? "detail-panel__log-item--warn" : "detail-panel__log-item--info"}`}>
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
