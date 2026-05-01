import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
}

/**
 * 进度条组件
 * 蓝色填充，支持可访问性属性
 */
const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, ...props }, ref) => {
    const percentage = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className={cn(
          "relative h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700",
          className
        )}
        {...props}
      >
        <div
          className="h-full w-full flex-1 bg-blue-600 transition-all duration-300 ease-in-out dark:bg-blue-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  }
);
Progress.displayName = "Progress";

export { Progress };
export type { ProgressProps };
