import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * 标准标签组件
 * 支持 peer-disabled 样式，与表单控件配套使用
 */
const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => {
    return (
      <label
        className={cn(
          "text-sm font-medium leading-none text-slate-900",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
          "dark:text-slate-100",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Label.displayName = "Label";

export { Label };
