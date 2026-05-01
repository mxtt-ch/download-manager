/**
 * MainPage - 主页面骨架
 *
 * 当前为占位版本，后续 Task 8-12 将逐步替换为完整的 Sidebar、
 * Toolbar、TaskTable、DetailPanel、GlobalStats 等组件。
 */

export function MainPage() {
  return (
    <div className="flex h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="w-56 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
        {/* 侧边栏占位 — 将在 Task 8 中替换 */}
        <div className="p-4 text-sm text-slate-400">侧边栏加载中...</div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <p className="text-lg text-slate-400">下载管理器 — 主页面</p>
      </div>
    </div>
  );
}
