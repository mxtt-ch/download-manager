import { useState, useEffect } from "react";
import {
  Download,
  Wifi,
  Zap,
  FolderKanban,
  Layout,
  Bell,
  Network,
  Cpu,
  Ellipsis,
  Globe,
  type LucideIcon,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { DownloadSettings } from "@/views/settings/DownloadSettings";
import { SpeedSettings } from "@/views/settings/SpeedSettings";
import { TaskManagementSettings } from "@/views/settings/TaskManagementSettings";
import { SiteManagementSettings } from "@/views/settings/SiteManagementSettings";
import { PlaceholderSettings } from "@/views/settings/PlaceholderSettings";

// ============================================================
// 类型定义
// ============================================================

interface SettingsDialogProps {
  /** 弹窗是否打开 */
  open: boolean;
  /** 初始选中的 tab */
  initialTab?: string;
  /** 关闭回调 */
  onClose: () => void;
}

/** 导航项定义 */
interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  /** 是否为 TODO 项（功能尚未实现） */
  todo?: boolean;
}

// ============================================================
// 导航项配置
// ============================================================

const NAV_ITEMS: NavItem[] = [
  { id: "download", label: "下载设置", icon: Download },
  { id: "connection", label: "连接设置", icon: Wifi, todo: true },
  { id: "speed", label: "速度设置", icon: Zap },
  { id: "task-management", label: "任务管理", icon: FolderKanban },
  { id: "ui", label: "界面设置", icon: Layout, todo: true },
  { id: "notification", label: "通知设置", icon: Bell, todo: true },
  { id: "bt", label: "BT 设置", icon: Network, todo: true },
  { id: "advanced", label: "高级设置", icon: Cpu, todo: true },
  { id: "other", label: "其他设置", icon: Ellipsis, todo: true },
  { id: "site", label: "站点管理", icon: Globe },
];

// ============================================================
// 获取指定 tab 的导航标签（供 PlaceholderSettings 使用）
// ============================================================

function getNavLabel(tabId: string): string {
  return NAV_ITEMS.find((item) => item.id === tabId)?.label ?? "";
}

// ============================================================
// SettingsDialog 组件
// ============================================================

/**
 * 设置弹窗
 *
 * 使用 shadcn Dialog 组件实现非模态弹窗，左导航 + 右表单区域布局。
 * 左侧使用 radix Tabs（垂直方向）作为导航列表，
 * 右侧根据当前选中的 tab 渲染对应的设置子组件。
 */
export function SettingsDialog({
  open,
  initialTab = "download",
  onClose,
}: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState(initialTab);

  /** 弹窗打开时同步 initialTab */
  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);

  /** 根据 tab 值渲染对应的内容组件 */
  const renderContent = () => {
    switch (activeTab) {
      case "download":
        return <DownloadSettings />;
      case "speed":
        return <SpeedSettings />;
      case "task-management":
        return <TaskManagementSettings />;
      case "site":
        return <SiteManagementSettings />;
      default:
        return <PlaceholderSettings title={getNavLabel(activeTab)} />;
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="max-w-3xl h-[600px] p-0 gap-0 flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center shrink-0 px-6 py-3 border-b border-slate-200 dark:border-slate-700">
          <DialogTitle>设置</DialogTitle>
        </div>

        {/* 主体区域：左侧导航 + 右侧内容 */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          orientation="vertical"
          className="flex flex-1 min-h-0"
        >
          {/* 左侧导航列表 */}
          <TabsList className="flex-col h-full w-48 justify-start rounded-none border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-2 space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <TabsTrigger
                key={item.id}
                value={item.id}
                className={cn(
                  "w-full justify-start gap-2 px-3 py-2 text-sm font-normal rounded-md",
                  "text-slate-600 dark:text-slate-400",
                  "hover:bg-slate-200 dark:hover:bg-slate-800",
                  "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700",
                  "dark:data-[state=active]:bg-blue-900/30 dark:data-[state=active]:text-blue-400",
                  "data-[state=active]:shadow-none",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* 右侧表单内容区 */}
          <div className="flex-1 overflow-auto p-6">
            {renderContent()}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
