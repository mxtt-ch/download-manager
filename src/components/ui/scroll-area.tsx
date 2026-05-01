import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * 滚动区域容器组件
 * 基于 overflow-auto 的简单滚动容器封装
 */
const ScrollArea = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("overflow-auto", className)}
      {...props}
    >
      {children}
    </div>
  );
});
ScrollArea.displayName = "ScrollArea";

export { ScrollArea };
