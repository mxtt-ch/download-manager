import { useEffect, useCallback } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
  FileVideo,
  FileArchive,
  FileCode,
  File,
  FileImage,
  FileAudio,
  FileText,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useTaskStore } from "@/store/taskStore";
import type { DownloadTask, TaskStatus } from "@/types";

import { formatBytes, formatSpeed, formatEta, getFileType } from "@/utils/util";

/** 根据文件名返回对应的图标组件 */
function getFileIcon(filename: string) {
  const fileType = getFileType(filename);

  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    video: FileVideo,
    archive: FileArchive,
    code: FileCode,
    image: FileImage,
    audio: FileAudio,
    document: FileText,
    executable: File,
  };

  return iconMap[fileType] ?? File;
}

// ============================================================
// 状态标签配置
// ============================================================

/** 任务状态对应的中文名及样式 */
const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  Pending: {
    label: "等待中",
    className:
      "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
  },
  Downloading: {
    label: "下载中",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },
  Paused: {
    label: "已暂停",
    className:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  },
  Completed: {
    label: "已完成",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  },
  Error: {
    label: "错误",
    className:
      "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  },
  Merging: {
    label: "合并中",
    className:
      "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  },
  Checking: {
    label: "校验中",
    className:
      "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
  },
};

// ============================================================
// 可排序列表头按钮
// ============================================================

/** 可排序表头 Props */
interface SortableHeadProps {
  /** 排序字段名 */
  field: "filename" | "size" | "progress" | "createdAt";
  /** 列标题文字 */
  children: React.ReactNode;
}

/** 可排序的表头单元格，点击触发排序切换 */
function SortableHead({ field, children }: SortableHeadProps) {
  const sortField = useTaskStore((s) => s.sortField);
  const sortDirection = useTaskStore((s) => s.sortDirection);
  const setSortField = useTaskStore((s) => s.setSortField);
  const toggleSortDirection = useTaskStore((s) => s.toggleSortDirection);

  const isActive = sortField === field;

  const handleClick = () => {
    if (isActive) {
      toggleSortDirection();
    } else {
      setSortField(field);
    }
  };

  return (
    <TableHead>
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
      >
        {children}
        {isActive ? (
          sortDirection === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
        )}
      </button>
    </TableHead>
  );
}

// ============================================================
// 数据行组件
// ============================================================

/** 单行任务 Props */
interface TaskRowProps {
  task: DownloadTask;
  onSelect: (id: string) => void;
  onOpenFolder: (savePath: string) => void;
  onCopyLink: (url: string) => void;
  onDelete: (id: string) => void;
}

/** 任务行 — 展示单条任务的所有列信息，包裹右键菜单 */
function TaskRow({
  task,
  onSelect,
  onOpenFolder,
  onCopyLink,
  onDelete,
}: TaskRowProps) {
  const FileIcon = getFileIcon(task.filename);
  const progressPercent =
    task.totalSize > 0
      ? Math.round((task.downloadedSize / task.totalSize) * 100)
      : 0;
  const isDownloading = task.status === "Downloading";
  const statusCfg = statusConfig[task.status];

  // 计算剩余秒数
  const remainingBytes = task.totalSize - task.downloadedSize;
  const etaSeconds =
    isDownloading && (task.speed ?? 0) > 0
      ? remainingBytes / (task.speed ?? 1)
      : NaN;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <TableRow
          className="cursor-pointer"
          onClick={() => onSelect(task.id)}
        >
          {/* 文件名 */}
          <TableCell>
            <div className="flex items-center gap-2 min-w-0 max-w-[400px]">
              <FileIcon className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="truncate text-sm font-medium">
                {task.filename}
              </span>
            </div>
          </TableCell>

          {/* 大小 */}
          <TableCell className="w-24 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
            {formatBytes(task.totalSize)}
          </TableCell>

          {/* 进度条 */}
          <TableCell className="w-52">
            <div className="flex items-center gap-2">
              <Progress
                value={task.downloadedSize}
                max={task.totalSize > 0 ? task.totalSize : 100}
                className={
                  task.totalSize === 0
                    ? "animate-pulse"
                    : ""
                }
              />
              <span className="text-xs text-slate-500 w-11 text-right shrink-0">
                {task.totalSize > 0 ? `${progressPercent}%` : "--"}
              </span>
            </div>
          </TableCell>

          {/* 速度 */}
          <TableCell className="w-24 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
            {isDownloading && task.speed != null
              ? formatSpeed(task.speed)
              : "--"}
          </TableCell>

          {/* 剩余时间 */}
          <TableCell className="w-24 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
            {isDownloading && !isNaN(etaSeconds)
              ? formatEta(etaSeconds)
              : "--"}
          </TableCell>

          {/* 状态 */}
          <TableCell className="w-28">
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.className}`}
            >
              {statusCfg.label}
              {task.status === "Error" && task.errorCode
                ? ` (${task.errorCode})`
                : ""}
            </span>
          </TableCell>

          {/* 线程数 */}
          <TableCell className="w-20 text-sm text-slate-600 dark:text-slate-400 text-center">
            {task.supportsRanges === false
              ? "1 (单线程)"
              : task.threadCount}
          </TableCell>
        </TableRow>
      </ContextMenuTrigger>

      {/* 右键菜单 */}
      <ContextMenuContent className="w-40">
        <ContextMenuItem onClick={() => onOpenFolder(task.savePath)}>
          打开文件夹
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onCopyLink(task.url)}>
          复制下载链接
        </ContextMenuItem>
        <ContextMenuItem disabled>
          重新校验
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
          onClick={() => onDelete(task.id)}
        >
          删除任务
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

// ============================================================
// 主表格组件
// ============================================================

/**
 * 任务列表表格
 *
 * 从 taskStore 中获取任务列表数据，支持按列排序、行点击选中、右键菜单操作。
 * 挂载时自动调用 fetchTasks 加载数据。
 */
export function TaskTable() {
  const {
    tasks,
    isLoading,
    sortField,
    sortDirection,
    filter,
    selectedQueueId,
    fetchTasks,
    fetchTaskDetail,
    setActiveTask,
    deleteTask,
  } = useTaskStore();

  /** 组件挂载时拉取任务列表 */
  useEffect(() => {
    fetchTasks();
  }, [filter, selectedQueueId]); // eslint-disable-line react-hooks/exhaustive-deps

  /** 行点击：选中任务并加载详情 */
  const handleSelect = useCallback(
    (id: string) => {
      setActiveTask(id);
      fetchTaskDetail(id);
    },
    [setActiveTask, fetchTaskDetail],
  );

  /** 右键菜单 — 打开文件夹（暂用 console.log 模拟） */
  const handleOpenFolder = useCallback((savePath: string) => {
    // TODO: 对接 Tauri 的打开文件夹/文件所在目录 API
    console.log("[TaskTable] 打开文件夹:", savePath);
  }, []);

  /** 右键菜单 — 复制下载链接到剪贴板 */
  const handleCopyLink = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // 降级：使用传统方法
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
  }, []);

  /** 右键菜单 — 删除任务 */
  const handleDelete = useCallback(
    (id: string) => {
      deleteTask(id);
    },
    [deleteTask],
  );

  // ============================================================
  // 排序后任务列表
  // ============================================================
  const sortedTasks = [...tasks].sort((a, b) => {
    const dir = sortDirection === "asc" ? 1 : -1;
    switch (sortField) {
      case "filename":
        return a.filename.localeCompare(b.filename) * dir;
      case "size":
        return (a.totalSize - b.totalSize) * dir;
      case "progress": {
        const ratioA = a.totalSize > 0 ? a.downloadedSize / a.totalSize : 0;
        const ratioB = b.totalSize > 0 ? b.downloadedSize / b.totalSize : 0;
        return (ratioA - ratioB) * dir;
      }
      case "createdAt":
        return (a.createdAt - b.createdAt) * dir;
      default:
        return 0;
    }
  });

  // ============================================================
  // 加载中状态
  // ============================================================
  if (isLoading && tasks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  // ============================================================
  // 空状态
  // ============================================================
  if (sortedTasks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-400 text-sm">暂无下载任务</p>
      </div>
    );
  }

  // ============================================================
  // 渲染表格
  // ============================================================
  return (
    <div className="flex-1 overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHead field="filename">文件名</SortableHead>
            <SortableHead field="size">大小</SortableHead>
            <SortableHead field="progress">进度</SortableHead>
            <TableHead>速度</TableHead>
            <TableHead>剩余时间</TableHead>
            <TableHead>状态</TableHead>
            <TableHead className="text-center">线程数</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onSelect={handleSelect}
              onOpenFolder={handleOpenFolder}
              onCopyLink={handleCopyLink}
              onDelete={handleDelete}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
