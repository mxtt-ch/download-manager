import * as React from "react";
import "./scroll-area.less";

/**
 * 滚动区域容器组件
 * 基于 overflow-auto 的简单滚动容器封装
 */
const ScrollArea = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const classes = ["scroll-area", className].filter(Boolean).join(" ");
  return (
    <div ref={ref} className={classes} {...props}>
      {children}
    </div>
  );
});
ScrollArea.displayName = "ScrollArea";

export { ScrollArea };
