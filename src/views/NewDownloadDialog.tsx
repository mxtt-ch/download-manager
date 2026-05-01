import { useState, useEffect } from "react";
import { Link, Network, Magnet, ChevronDown, ChevronUp, FolderOpen } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toaster";
import { useTaskStore } from "@/store/taskStore";
import { useSettingsStore } from "@/store/settingsStore";
import { getQueues } from "@/api/queues";
import type { NewDownloadForm, Queue } from "@/types";

interface NewDownloadDialogProps {
  open: boolean;
  onClose: () => void;
}

/** 新建下载弹窗 — 支持 URL 模式、剪贴板识别和高级选项 */
export function NewDownloadDialog({ open, onClose }: NewDownloadDialogProps) {
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

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  /** URL 输入框聚焦时尝试从剪贴板读取 */
  const handleUrlFocus = () => {
    navigator.clipboard
      .readText()
      .then((text) => {
        if (
          !form.url &&
          (text.startsWith("http://") || text.startsWith("https://"))
        ) {
          setForm((prev) => ({ ...prev, url: text }));
        }
      })
      .catch(() => {
        // 剪贴板访问被拒绝，静默忽略
      });
  };

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

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>新建下载</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {/* A. 下载类型 Tabs */}
            <div>
              <Label className="mb-2 block text-xs text-slate-500 dark:text-slate-400">
                下载类型
              </Label>
              <Tabs value="url" className="w-full">
                <TabsList className="w-full">
                  {/* URL 下载 — 当前唯一可用模式 */}
                  <TabsTrigger value="url" className="flex-1 gap-1.5">
                    <Link className="h-4 w-4" />
                    URL 下载
                  </TabsTrigger>

                  {/* BT 种子 — 开发中，禁用 */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex flex-1 cursor-not-allowed">
                        <TabsTrigger
                          value="bt"
                          disabled
                          className="flex-1 gap-1.5 text-slate-400 dark:text-slate-500"
                        >
                          <Network className="h-4 w-4" />
                          BT 种子
                        </TabsTrigger>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>该功能正在开发中</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* 磁力链接 — 开发中，禁用 */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex flex-1 cursor-not-allowed">
                        <TabsTrigger
                          value="magnet"
                          disabled
                          className="flex-1 gap-1.5 text-slate-400 dark:text-slate-500"
                        >
                          <Magnet className="h-4 w-4" />
                          磁力链接
                        </TabsTrigger>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>该功能正在开发中</p>
                    </TooltipContent>
                  </Tooltip>
                </TabsList>
              </Tabs>
            </div>

            {/* B. URL 输入框 */}
            <div className="space-y-1.5">
              <Label htmlFor="download-url">下载链接</Label>
              <Input
                id="download-url"
                placeholder="请输入下载链接..."
                value={form.url}
                onChange={(e) => updateField("url", e.target.value)}
                onFocus={handleUrlFocus}
                autoFocus
              />
            </div>

            {/* C. 文件名（可选） */}
            <div className="space-y-1.5">
              <Label
                htmlFor="download-filename"
                className="text-slate-500 dark:text-slate-400"
              >
                文件名（可选）
              </Label>
              <Input
                id="download-filename"
                placeholder="自动从链接解析"
                value={form.filename}
                onChange={(e) => updateField("filename", e.target.value)}
              />
            </div>

            {/* D. 保存路径 */}
            <div className="space-y-1.5">
              <Label htmlFor="download-path">保存路径</Label>
              <div className="flex gap-2">
                <Input
                  id="download-path"
                  value={form.savePath}
                  onChange={(e) => updateField("savePath", e.target.value)}
                  className="flex-1"
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                    >
                      <FolderOpen className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>选择文件夹功能正在开发中</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* E. 队列选择 */}
            <div className="space-y-1.5">
              <Label htmlFor="download-queue">下载队列</Label>
              <Select
                value={form.queueId}
                onValueChange={(value) => updateField("queueId", value)}
              >
                <SelectTrigger id="download-queue">
                  <SelectValue placeholder="选择队列" />
                </SelectTrigger>
                <SelectContent>
                  {queues.map((q) => (
                    <SelectItem key={q.id} value={q.id}>
                      {q.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* F. 高级选项（折叠/展开） */}
            <div>
              <button
                type="button"
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                onClick={() => setShowAdvanced((v) => !v)}
              >
                {showAdvanced ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                高级选项
              </button>

              {showAdvanced && (
                <div className="mt-3 space-y-3 rounded-md border border-slate-200 dark:border-slate-700 p-3">
                  {/* 线程数 */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="thread-count" className="cursor-pointer">
                      线程数
                    </Label>
                    <Input
                      id="thread-count"
                      type="number"
                      min={1}
                      max={32}
                      value={form.threadCount}
                      onChange={(e) => {
                        const v = Math.max(
                          1,
                          Math.min(32, Number(e.target.value) || 1),
                        );
                        updateField("threadCount", v);
                      }}
                      className="w-20 text-center"
                    />
                  </div>

                  {/* 断点续传 */}
                  <div className="flex items-center justify-between">
                    <Label className="cursor-pointer">
                      断点续传
                    </Label>
                    <Switch
                      checked={form.enableResume}
                      onCheckedChange={(v) => updateField("enableResume", v)}
                    />
                  </div>

                  {/* 自动开始下载 */}
                  <div className="flex items-center justify-between">
                    <Label className="cursor-pointer">
                      自动开始下载
                    </Label>
                    <Switch
                      checked={form.autoStart}
                      onCheckedChange={(v) => updateField("autoStart", v)}
                    />
                  </div>

                  {/* 下载完成后校验文件完整性 */}
                  <div className="flex items-center justify-between">
                    <Label className="cursor-pointer">
                      下载完成后校验文件完整性
                    </Label>
                    <Switch
                      checked={form.enableIntegrityCheck}
                      onCheckedChange={(v) =>
                        updateField("enableIntegrityCheck", v)
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* G. 底部按钮 */}
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
    </TooltipProvider>
  );
}
