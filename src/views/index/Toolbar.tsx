import { useState, useEffect } from "react";
import "./Toolbar.less";
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
 * 左侧 — 操作按钮组：新建、开始/暂停/删除/刷新
 * 中间 — 搜索框：Search 图标前置，防抖 300ms
 * 右侧 — 设置按钮
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

  /** 搜索防抖：300ms 后将搜索词写入状态 */
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchText.trim()) {
        // TODO: 接入搜索逻辑
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  const hasActiveTask = activeTaskId !== null;

  const handleResume = () => { if (activeTaskId) resumeTask(activeTaskId); };
  const handlePause = () => { if (activeTaskId) pauseTask(activeTaskId); };
  const handleDelete = () => { if (activeTaskId) deleteTask(activeTaskId); };
  const handleRefresh = () => { fetchTasks(); };

  return (
    <TooltipProvider>
      <div className="toolbar">
        {/* 左侧 — 操作按钮组 */}
        <div className="toolbar__actions">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="default" size="icon" onClick={onNewDownload}>
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>新建下载</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleResume} disabled={!hasActiveTask}>
                <Play className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>开始</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handlePause} disabled={!hasActiveTask}>
                <Pause className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>暂停</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleDelete} disabled={!hasActiveTask}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>删除</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>刷新</p></TooltipContent>
          </Tooltip>
        </div>

        {/* 中间 — 搜索框 */}
        <div className="flex-1 flex justify-center">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索任务名或URL..."
              className="pl-md h-9"
            />
          </div>
        </div>

        {/* 右侧 — 设置按钮 */}
        <div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onOpenSettings}>
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>设置</p></TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
