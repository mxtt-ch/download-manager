import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Toolbar } from "@/components/Toolbar";
import { TaskTable } from "@/components/TaskTable";
import { DetailPanel } from "@/components/DetailPanel";
import { GlobalStats } from "@/components/GlobalStats";
import { NewDownloadDialog } from "@/views/NewDownloadDialog";
import { SettingsDialog } from "@/views/SettingsDialog";

/**
 * 主页面布局
 *
 * 左侧 220px 侧边栏 + 右侧主内容区。
 * 主内容区自上而下为：工具栏、任务列表、详情面板、全局状态栏。
 *
 * 当前 Toolbar / TaskTable / DetailPanel / GlobalStats 尚未实现，
 * 使用占位区域替代，待后续 Task 逐步替换。
 */
export function MainPage() {
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<string>("download");
  const [showNewDownload, setShowNewDownload] = useState(false);

  /** 打开设置弹窗并定位到指定 tab */
  const handleOpenSettings = (tab?: string) => {
    setSettingsTab(tab || "download");
    setShowSettings(true);
  };

  return (
    <div className="flex h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* 侧边栏 */}
      <Sidebar onOpenSettings={handleOpenSettings} />

      {/* 主内容区 — relative 定位以支持 GlobalStats 的 absolute 定位 */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* 顶部工具栏 */}
        <Toolbar onNewDownload={() => setShowNewDownload(true)} onOpenSettings={() => handleOpenSettings()} />

        <div className="flex-1 flex flex-col min-h-0">
          {/* 任务列表表格 */}
          <TaskTable />

          {/* 任务详情面板 — 底部滑入，显示任务详情/线程/文件列表/日志 */}
          <DetailPanel />
        </div>

        {/* 全局统计区 — 右下角悬浮小组件（速率图 + 磁盘空间） */}
        <GlobalStats />
      </div>

      {/* 新建下载弹窗 */}
      {showNewDownload && (
        <NewDownloadDialog
          open={showNewDownload}
          onClose={() => setShowNewDownload(false)}
        />
      )}

      {/* 设置弹窗 */}
      {showSettings && (
        <SettingsDialog
          open={showSettings}
          initialTab={settingsTab}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
