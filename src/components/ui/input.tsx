import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * 标准输入框组件
 * 带边框和聚焦环样式，支持暗色模式
 */
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm text-slate-900 shadow-sm transition-colors",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-slate-400",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
