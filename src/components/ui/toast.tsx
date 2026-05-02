import * as React from "react";
import { X } from "lucide-react";
import "./toast.less";

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
    const classes = ["toast", variant === "destructive" ? "toast--destructive" : "toast--default"].join(" ");

    return (
      <div ref={ref} className={classes}>
        <div className="flex-1">
          {title && <div className="toast__title">{title}</div>}
          {description && <div className="toast__desc">{description}</div>}
        </div>
        <button onClick={() => onClose(id)} className="toast__close">
          <X className="w-4 h-4" />
          <span style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", borderWidth: 0 }}>关闭</span>
        </button>
      </div>
    );
  }
);
Toast.displayName = "Toast";

export { Toast };
