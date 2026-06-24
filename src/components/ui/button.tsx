import * as React from "react";
import "./button.less";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 按钮变体：default-主按钮/destructive-危险/outline-边框/ghost-透明/link-链接 */
  variant?: "default" | "destructive" | "outline" | "ghost" | "link";
  /** 按钮尺寸 */
  size?: "default" | "sm" | "lg" | "icon";
}

/**
 * 通用按钮组件
 * 支持多种变体和尺寸，通过 variant 和 size 属性控制样式
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const classes = [
      "btn",
      `btn--${size}`,
      `btn--${variant}${variant !== "default" ? "" : "-variant"}`,
      className || "",
    ]
      .filter(Boolean)
      .join(" ");

    return <button className={classes} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button };
