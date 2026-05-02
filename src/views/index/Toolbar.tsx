import { useState, useEffect } from "react";
import "@/assets/style/toolbar.less";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useTaskStore } from "@/store/taskStore";
import {
  Plus,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  Search,
  Settings,
} from "lucide-react";

/** 顶部工具栏组件 Props */
interface ToolbarProps {
  /** 点击"新建下载"按钮时的回调 */
  onNewDownload: () => void;
  /** 点击"设置"按钮时的回调 */
  onOpenSettings: () => void;
}

/**
 * 顶部工具栏组件
 *
 * 布局结构：flex items-center gap-2 px-4 py-2，高度约 h-12。
 * 左侧 — 操作按钮组：新建（蓝色 default）、开始/暂停/删除/刷新（outline）
 * 中间 — 搜索框：Search 图标前置，防抖 300ms，placeholder="搜索任务名或URL..."
 * 右侧 — 设置按钮：ghost 变体
 * 所有按钮均包裹在 Tooltip 中显示中文文字提示。
 */
export function Toolbar({ onNewDownload, onOpenSettings }: ToolbarProps) {
  const {
    activeTaskId,
    fetchTasks,
    pauseTask,
    deleteTask,
    resumeTask,
    isLoading,
  } = useTaskStore();
  const [searchText, setSearchText] = useState("");

  /** 搜索防抖：300ms 后将搜索词写入状态（后续可接入后端搜索接口） */
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchText.trim()) {
        // TODO: 接入搜索逻辑，当前仅保留搜索词状态供后续使用
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  const hasActiveTask = activeTaskId !== null;

  /** 恢复当前选中任务 */
  const handleResume = () => {
    if (activeTaskId) resumeTask(activeTaskId);
  };

  /** 暂停当前选中任务 */
  const handlePause = () => {
    if (activeTaskId) pauseTask(activeTaskId);
  };

  /** 删除当前选中任务 */
  const handleDelete = () => {
    if (activeTaskId) deleteTask(activeTaskId);
  };

  /** 刷新任务列表 */
  const handleRefresh = () => {
    fetchTasks();
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200 dark:border-slate-700 h-12 shrink-0">
        {/* ================================================================ */}
        {/* 左侧 — 操作按钮组                                                */}
        {/* ================================================================ */}
        <div className="flex items-center gap-1">
          {/* 新建下载 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="default" size="icon" onClick={onNewDownload}>
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>新建下载</p>
            </TooltipContent>
          </Tooltip>

          {/* 开始（恢复暂停的任务） */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleResume}
                disabled={!hasActiveTask}
              >
                <Play className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>开始</p>
            </TooltipContent>
          </Tooltip>

          {/* 暂停 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handlePause}
                disabled={!hasActiveTask}
              >
                <Pause className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>暂停</p>
            </TooltipContent>
          </Tooltip>

          {/* 删除 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleDelete}
                disabled={!hasActiveTask}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>删除</p>
            </TooltipContent>
          </Tooltip>

          {/* 刷新 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>刷新</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* ================================================================ */}
        {/* 中间 — 搜索框（flex-1 居中，宽度 w-64）                          */}
        {/* ================================================================ */}
        <div className="flex-1 flex justify-center">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索任务名或URL..."
              className="pl-8 h-9"
            />
          </div>
        </div>

        {/* ================================================================ */}
        {/* 右侧 — 设置按钮                                                  */}
        {/* ================================================================ */}
        <div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onOpenSettings}>
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>设置</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
