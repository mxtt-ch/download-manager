import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { useTaskStore } from "@/store/taskStore";
import type { DownloadProgressEvent } from "@/types";

/**
 * 下载进度监听 Hook
 *
 * 监听后端通过 Tauri Event 推送的 `download:progress` 事件，
 * 实时更新 taskStore 中对应任务的已下载字节数。
 *
 * 当前为 mock 模式预留接口，实际事件监听待后端实现后生效。
 */
export function useDownloadProgress() {
  const updateTaskProgress = useTaskStore((s) => s.updateTaskProgress);

  useEffect(() => {
    let unlistenFn: (() => void) | undefined;

    const setupListener = async () => {
      try {
        const unlisten = await listen<DownloadProgressEvent>(
          "download:progress",
          (event) => {
            const { taskId, chunkIndex, offset } = event.payload;
            updateTaskProgress(taskId, chunkIndex, offset);
          },
        );
        unlistenFn = unlisten;
      } catch {
        // 在 mock 模式下或后端尚未实现时，静默忽略错误
      }
    };

    setupListener();

    return () => {
      if (unlistenFn) unlistenFn();
    };
  }, [updateTaskProgress]);
}
