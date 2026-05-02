import { Link } from "react-router-dom";

/**
 * 404 页面未找到组件
 */
export function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-slate-950">
      <div className="text-center p-8">
        <div className="text-6xl font-bold text-slate-300 dark:text-slate-600 mb-4">
          404
        </div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          页面未找到
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          您访问的页面不存在或已被移除
        </p>
        <Link
          to="/"
          className="inline-flex px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}
