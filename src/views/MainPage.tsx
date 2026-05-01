import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Toolbar } from "@/components/Toolbar";
import { TaskTable } from "@/components/TaskTable";

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

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部工具栏 */}
        <Toolbar onNewDownload={() => setShowNewDownload(true)} onOpenSettings={() => handleOpenSettings()} />

        <div className="flex-1 flex flex-col min-h-0">
          {/* 任务列表表格 */}
          <TaskTable />

          {/* 详情面板占位 — 将在 Task 11 中替换为 <DetailPanel> */}
          <div className="h-40 border-t border-slate-200 dark:border-slate-800 p-4 shrink-0">
            <p className="text-slate-400 text-sm">详情面板</p>
          </div>
        </div>

        {/* 全局状态栏占位 — 将在 Task 12 中替换为 <GlobalStats> */}
        <div className="h-8 border-t border-slate-200 dark:border-slate-800 flex items-center px-4 shrink-0">
          <span className="text-xs text-slate-400">全局状态栏</span>
        </div>
      </div>

      {/* 新建下载弹窗占位 — 将在后续 Task 中实现 */}
      {showNewDownload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl p-6 min-w-[400px]">
            <h2 className="text-lg font-semibold mb-4">新建下载</h2>
            <p className="text-sm text-slate-400 mb-4">新建下载面板将在后续实现</p>
            <button
              type="button"
              onClick={() => setShowNewDownload(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* 设置弹窗占位 — 将在后续 Task 中实现 */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl p-6 min-w-[400px]">
            <h2 className="text-lg font-semibold mb-4">
              设置 — {settingsTab}
            </h2>
            <p className="text-sm text-slate-400 mb-4">设置面板将在后续实现</p>
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
