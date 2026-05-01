import * as React from "react";
import { Toast, type ToastProps } from "./toast";

/**
 * Toast 操作类型
 */
type ToastActionType =
  | { type: "ADD_TOAST"; toast: ToastProps }
  | { type: "DISMISS_TOAST"; toastId: string }
  | { type: "REMOVE_TOAST"; toastId: string };

interface ToastState {
  toasts: ToastProps[];
}

let memoryState: ToastState = { toasts: [] };
const listeners: Array<(state: ToastState) => void> = [];

/**
 * 触发所有订阅者更新，使用不可变状态提升
 */
function dispatch(action: ToastActionType) {
  switch (action.type) {
    case "ADD_TOAST":
      memoryState = {
        ...memoryState,
        toasts: [...memoryState.toasts, action.toast],
      };
      break;
    case "DISMISS_TOAST": {
      const { toastId } = action;
      memoryState = {
        ...memoryState,
        toasts: memoryState.toasts.map((t) =>
          t.id === toastId ? { ...t } : t
        ),
      };
      break;
    }
    case "REMOVE_TOAST": {
      const { toastId } = action;
      memoryState = {
        ...memoryState,
        toasts: memoryState.toasts.filter((t) => t.id !== toastId),
      };
      break;
    }
    default:
      return;
  }
  listeners.forEach((listener) => listener(memoryState));
}

let toastCount = 0;

/**
 * 生成唯一的 toast ID
 */
function genId(): string {
  toastCount += 1;
  return `toast-${Date.now()}-${toastCount}`;
}

interface ToastInput {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
}

/**
 * useToast Hook
 * 全局 toast 通知管理器，基于模块级变量 + listener 模式
 *
 * @example
 * const { toast } = useToast();
 * toast({ title: "下载完成", description: "文件已保存到本地" });
 */
function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  const toast = React.useCallback(
    ({ duration = 4000, ...props }: ToastInput) => {
      const id = genId();

      dispatch({
        type: "ADD_TOAST",
        toast: { ...props, id, duration },
      });

      if (duration > 0) {
        setTimeout(() => {
          dispatch({ type: "REMOVE_TOAST", toastId: id });
        }, duration);
      }

      return id;
    },
    []
  );

  const dismiss = React.useCallback((toastId: string) => {
    dispatch({ type: "REMOVE_TOAST", toastId });
  }, []);

  return {
    toasts: state.toasts,
    toast,
    dismiss,
  };
}

/**
 * Toaster 组件
 * fixed 定位在右下角，渲染所有活跃 toast
 */
const Toaster = () => {
  const { toasts, dismiss } = useToast();

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex max-w-sm flex-col gap-2"
      aria-live="polite"
      aria-label="通知"
    >
      {toasts.map((t) => (
        <Toast
          key={t.id}
          id={t.id}
          title={t.title}
          description={t.description}
          variant={t.variant}
          onClose={dismiss}
        />
      ))}
    </div>
  );
};

export { useToast, Toaster };
export type { ToastInput };
