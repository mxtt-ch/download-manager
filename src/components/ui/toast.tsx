import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
}

interface ToastComponentProps extends ToastProps {
  onClose: (id: string) => void;
}

/**
 * Toast 通知组件
 * 支持 default 和 destructive 两种变体，4 秒自动消失
 */
const Toast = React.forwardRef<HTMLDivElement, ToastComponentProps>(
  ({ id, title, description, variant = "default", onClose }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 shadow-lg transition-all",
          "animate-in slide-in-from-right-full fade-in",
          variant === "default" &&
            "border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
          variant === "destructive" &&
            "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
        )}
      >
        <div className="flex-1">
          {title && (
            <div className="text-sm font-semibold">{title}</div>
          )}
          {description && (
            <div className="text-sm opacity-90">{description}</div>
          )}
        </div>
        <button
          onClick={() => onClose(id)}
          className={cn(
            "shrink-0 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
          )}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">关闭</span>
        </button>
      </div>
    );
  }
);
Toast.displayName = "Toast";

export { Toast };
