import * as React from "react";
import "./switch.less";

interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * 开关切换组件
 * 纯 CSS transition 实现滑动动画，使用 role="switch" 确保可访问性
 */
const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked = false, onCheckedChange, disabled = false, className, ...props }, ref) => {
    const classes = ["switch", className].filter(Boolean).join(" ");
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        data-state={checked ? "checked" : "unchecked"}
        disabled={disabled}
        className={classes}
        onClick={() => onCheckedChange?.(!checked)}
        ref={ref}
        {...props}
      >
        <span className="switch__thumb" />
      </button>
    );
  }
);
Switch.displayName = "Switch";

export { Switch };
export type { SwitchProps };
