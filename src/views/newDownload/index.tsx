import { useState, useEffect } from "react";
import "./index.less";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { useTaskStore } from "@/store/taskStore";
import { useSettingsStore } from "@/store/settingsStore";
import { getQueues } from "@/api/queues";
import type { NewDownloadForm, Queue } from "@/types";
import { UrlDownload } from "./UrlDownload";

interface NewDownloadDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * 新建下载弹窗 - 主容器组件
 * 负责管理表单状态、队列加载和任务提交逻辑
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

  const updateField = <K extends keyof NewDownloadForm>(key: K, value: NewDownloadForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    getQueues()
      .then((list) => {
        setQueues(list);
        if (list.length > 0) setForm((prev) => ({ ...prev, queueId: list[0].id }));
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    navigator.clipboard.readText()
      .then((text) => {
        if (text.startsWith("http://") || text.startsWith("https://")) {
          setForm((prev) => ({ ...prev, url: text }));
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!form.url.trim()) return;
    setIsSubmitting(true);
    try {
      await addTask({ ...form, filename: form.filename.trim() || undefined });
      toast({ title: "任务已创建" });
      onClose();
    } catch {
      toast({ title: "创建失败", description: "请稍后重试", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-[520px]">
        <DialogHeader>
          <DialogTitle>新建下载</DialogTitle>
        </DialogHeader>

        <UrlDownload form={form} queues={queues} onUpdateField={updateField} />

        <div className="download-dialog__actions">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>取消</Button>
          <Button onClick={handleSubmit} disabled={!form.url.trim() || isSubmitting}>立即下载</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
