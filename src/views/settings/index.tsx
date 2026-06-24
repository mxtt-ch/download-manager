import { useState, useEffect } from "react";
import "./index.less";
import {
  Download, Wifi, Zap, FolderKanban, Layout, Bell, Network, Cpu, Ellipsis, Globe,
  type LucideIcon,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DownloadSettings } from "./DownloadSettings";
import { SpeedSettings } from "./SpeedSettings";
import { TaskManagementSettings } from "./TaskManagementSettings";
import { SiteManagementSettings } from "./SiteManagementSettings";
import { PlaceholderSettings } from "./PlaceholderSettings";

interface SettingsDialogProps {
  open: boolean;
  initialTab?: string;
  onClose: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  todo?: boolean;
}

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

function getNavLabel(tabId: string): string {
  return NAV_ITEMS.find((item) => item.id === tabId)?.label ?? "";
}

/**
 * 设置弹窗
 * 左导航 + 右表单区域布局。
 */
export default function SettingsDialog({
  open,
  initialTab = "download",
  onClose,
}: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (open) setActiveTab(initialTab);
  }, [open, initialTab]);

  const renderContent = () => {
    switch (activeTab) {
      case "download": return <DownloadSettings />;
      case "speed": return <SpeedSettings />;
      case "task-management": return <TaskManagementSettings />;
      case "site": return <SiteManagementSettings />;
      default: return <PlaceholderSettings title={getNavLabel(activeTab)} />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-3xl p-0 gap-0 flex flex-col" style={{ height: 600 }}>
        <div className="settings-dialog__header">
          <DialogTitle>设置</DialogTitle>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="flex flex-1 min-h-0">
          <TabsList className="flex-col h-full w-48 justify-start rounded-none border-r border-border p-sm" style={{ backgroundColor: "var(--bg-sidebar)", gap: "2px" }}>
            {NAV_ITEMS.map((item) => (
              <TabsTrigger
                key={item.id}
                value={item.id}
                className="w-full justify-start gap-2 px-md py-sm text-sm font-normal rounded-md text-secondary hover:bg-hover data-[state=active]:bg-active data-[state=active]:text-link data-[state=active]:shadow-none"
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex-1 overflow-auto p-xl">
            {renderContent()}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
