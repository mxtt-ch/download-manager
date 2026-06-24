import * as React from "react";
import "./label.less";

/**
 * 标准标签组件
 * 支持 peer-disabled 样式，与表单控件配套使用
 */
const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => {
    const classes = ["label", className].filter(Boolean).join(" ");
    return <label className={classes} ref={ref} {...props} />;
  }
);
Label.displayName = "Label";

export { Label };
