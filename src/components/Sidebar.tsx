import { useState, useEffect } from "react";
import { useTaskStore } from "@/store/taskStore";
import { useTheme } from "@/contexts/ThemeContext";
import { getQueues } from "@/api/queues";
import type { Queue, TaskFilter } from "@/types";
import { cn } from "@/lib/utils";
import {
  List,
  Download,
  Pause,
  CheckCircle2,
  AlertCircle,
  Film,
  Package,
  Book,
  Clock,
  Zap,
  Globe,
  Settings,
  Sun,
  Moon,
} from "lucide-react";

/** 侧边栏组件 Props */
interface SidebarProps {
  /** 打开设置弹窗，并可指定初始 tab */
  onOpenSettings: (tab?: string) => void;
}

/** 状态过滤按钮配置：过滤值、中文标签、对应图标 */
const FILTER_BUTTONS: {
  filter: TaskFilter;
  label: string;
  icon: typeof List;
}[] = [
  { filter: "all", label: "全部任务", icon: List },
  { filter: "Downloading", label: "下载中", icon: Download },
  { filter: "Paused", label: "已暂停", icon: Pause },
  { filter: "Completed", label: "已完成", icon: CheckCircle2 },
  { filter: "Error", label: "错误/失败", icon: AlertCircle },
];

/** 队列图标映射：根据队列 icon 字段匹配 lucide-react 图标组件 */
const QUEUE_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  list: List,
  film: Film,
  package: Package,
  book: Book,
  download: Download,
};

/** 工具链接配置：设置 tab、中文标签、对应图标 */
const TOOL_LINKS: { tab: string; label: string; icon: typeof Settings }[] = [
  { tab: "schedule", label: "计划任务", icon: Clock },
  { tab: "speed", label: "速度限制", icon: Zap },
  { tab: "site", label: "站点管理", icon: Globe },
  { tab: "download", label: "下载设置", icon: Settings },
];

/**
 * 侧边栏组件
 *
 * 包含四个功能区：
 * A. 状态统计区 — 任务过滤按钮
 * B. 队列管理区 — 可选中/取消选中的队列列表
 * C. 工具区 — 跳转到设置页面对应 tab
 * D. 底部主题切换 — 深色/浅色模式切换
 */
export function Sidebar({ onOpenSettings }: SidebarProps) {
  const {
    filter,
    setFilter,
    fetchTasks,
    selectedQueueId,
    setSelectedQueue,
  } = useTaskStore();
  const { theme, toggleTheme } = useTheme();
  const [queues, setQueues] = useState<Queue[]>([]);

  /** 组件挂载时加载队列列表 */
  useEffect(() => {
    getQueues()
      .then(setQueues)
      .catch((err) => console.error("获取队列列表失败:", err));
  }, []);

  /** 点击过滤按钮：切换过滤器并重新拉取任务 */
  const handleFilterClick = (f: TaskFilter) => {
    setFilter(f);
    fetchTasks();
  };

  /** 点击队列项：选中或取消选中 */
  const handleQueueClick = (queueId: string) => {
    setSelectedQueue(selectedQueueId === queueId ? null : queueId);
  };

  /** 根据队列 icon 字段名获取对应的图标组件 */
  const getQueueIcon = (icon?: string) => {
    if (icon && icon in QUEUE_ICON_MAP) {
      return QUEUE_ICON_MAP[icon];
    }
    return List; // 无匹配时回退为 List 图标
  };

  return (
    <aside className="w-56 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full">
      {/* ================================================================ */}
      {/* A. 状态统计区 — 任务过滤按钮                                */}
      {/* ================================================================ */}
      <div className="p-3 space-y-1">
        <p className="px-2 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none">
          状态过滤
        </p>
        {FILTER_BUTTONS.map(({ filter: f, label, icon: Icon }) => {
          const isActive = filter === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => handleFilterClick(f)}
              className={cn(
                "flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-medium"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* 分割线 */}
      <div className="mx-3 h-px bg-slate-200 dark:bg-slate-800 shrink-0" />

      {/* ================================================================ */}
      {/* B. 队列管理区 — 列表项可点击选中/取消选中                  */}
      {/* ================================================================ */}
      <div className="flex-1 flex flex-col min-h-0 p-3">
        <p className="px-2 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none shrink-0">
          队列管理
        </p>
        <div className="flex-1 overflow-auto my-1 space-y-0.5">
          {queues.map((q) => {
            const IconComp = getQueueIcon(q.icon);
            const isSelected = selectedQueueId === q.id;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => handleQueueClick(q.id)}
                className={cn(
                  "flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm text-left transition-colors",
                  isSelected
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-medium"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800",
                )}
              >
                <IconComp className="h-4 w-4 shrink-0" />
                <span className="truncate">{q.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 分割线 */}
      <div className="mx-3 h-px bg-slate-200 dark:bg-slate-800 shrink-0" />

      {/* ================================================================ */}
      {/* C. 工具区 — 点击跳转设置弹窗对应 tab                       */}
      {/* ================================================================ */}
      <div className="p-3 space-y-1">
        <p className="px-2 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none">
          工具
        </p>
        {TOOL_LINKS.map(({ tab, label, icon: Icon }) => (
          <button
            key={tab}
            type="button"
            onClick={() => onOpenSettings(tab)}
            className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* 分割线 */}
      <div className="mx-3 h-px bg-slate-200 dark:bg-slate-800 shrink-0" />

      {/* ================================================================ */}
      {/* D. 底部主题切换 — 深色/浅色模式                            */}
      {/* ================================================================ */}
      <div className="p-3">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 shrink-0" />
          ) : (
            <Moon className="h-4 w-4 shrink-0" />
          )}
          <span>{theme === "dark" ? "浅色模式" : "深色模式"}</span>
        </button>
      </div>
    </aside>
  );
}
