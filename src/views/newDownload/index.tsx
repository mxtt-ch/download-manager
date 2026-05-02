import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { useTaskStore } from "@/store/taskStore";
import { useSettingsStore } from "@/store/settingsStore";
import { getQueues } from "@/api/queues";
import type { NewDownloadForm, Queue } from "@/types";
import { UrlDownload } from "./UrlDownload";
import { BtDownload } from "./BtDownload";
import { MagnetDownload } from "./MagnetDownload";

interface NewDownloadDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * 新建下载弹窗 - 主容器组件
 * 
 * 负责管理表单状态、队列加载和任务提交逻辑
 * 根据当前选中的下载模式渲染对应的子组件
 */
export default function NewDownloadDialog({ open, onClose }: NewDownloadDialogProps) {
  const { toast } = useToast();
  const addTask = useTaskStore((s) => s.addTask);
  const defaultPath = useSettingsStore((s) => s.config.download.defaultPath);

  const [form, setForm] = useState<NewDownloadForm>(() => ({
    url: "",
    filename: "",
    savePath: defaultPath,
    queueId: "queue-default",
    threadCount: 4,
    enableResume: true,
    autoStart: true,
    enableIntegrityCheck: false,
  }));

  const [queues, setQueues] = useState<Queue[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [downloadMode, setDownloadMode] = useState<"url" | "bt" | "magnet">("url");

  /** 更新单个表单字段 */
  const updateField = <K extends keyof NewDownloadForm>(
    key: K,
    value: NewDownloadForm[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  /** 挂载时加载队列列表，默认选中第一个 */
  useEffect(() => {
    getQueues()
      .then((list) => {
        setQueues(list);
        if (list.length > 0) {
          setForm((prev) => ({ ...prev, queueId: list[0].id }));
        }
      })
      .catch(console.error);
  }, []);

  /** 挂载时尝试从剪贴板读取 URL */
  useEffect(() => {
    navigator.clipboard
      .readText()
      .then((text) => {
        if (text.startsWith("http://") || text.startsWith("https://")) {
          setForm((prev) => ({ ...prev, url: text }));
        }
      })
      .catch(() => {
        // 剪贴板访问被拒绝或为空，静默忽略
      });
  }, []);

  /** 提交表单创建下载任务 */
  const handleSubmit = async () => {
    if (!form.url.trim()) return;
    setIsSubmitting(true);
    try {
      await addTask({
        ...form,
        // 空文件名回退为 undefined，由后端自动解析
        filename: form.filename.trim() || undefined,
      });
      toast({ title: "任务已创建" });
      onClose();
    } catch {
      toast({ title: "创建失败", description: "请稍后重试", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  /** 根据下载模式渲染对应的内容组件 */
  const renderContent = () => {
    switch (downloadMode) {
      case "url":
        return <UrlDownload form={form} queues={queues} onUpdateField={updateField} />;
      case "bt":
        return <BtDownload />;
      case "magnet":
        return <MagnetDownload />;
      default:
        return <UrlDownload form={form} queues={queues} onUpdateField={updateField} />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>新建下载</DialogTitle>
        </DialogHeader>

        {/* 渲染当前下载模式的内容 */}
        {renderContent()}

        {/* 底部按钮 */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!form.url.trim() || isSubmitting}
          >
            立即下载
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
