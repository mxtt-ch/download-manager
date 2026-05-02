import * as React from "react";
import "./input.less";

/**
 * 标准输入框组件
 * 带边框和聚焦环样式，支持暗色模式
 */
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    const classes = ["input", className].filter(Boolean).join(" ");
    return <input type={type} className={classes} ref={ref} {...props} />;
  }
);
Input.displayName = "Input";

export { Input };
