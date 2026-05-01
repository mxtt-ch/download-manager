import { useState } from "react";
import { FolderOpen } from "lucide-react";
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
import { useSettingsStore } from "@/store/settingsStore";
import type { DownloadSettings as DownloadSettingsType } from "@/types";

// ============================================================
// 下拉选项常量
// ============================================================

/** 同时下载任务数上限：1-10 */
const CONCURRENT_TASKS_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

/** 单任务最大线程数：常用阶梯值 */
const MAX_THREADS_OPTIONS = [1, 2, 4, 8, 16, 32, 64, 128] as const;

/** 下载完成后操作 */
const POST_DOWNLOAD_OPTIONS = [
  { value: "notify" as const, label: "通知提醒" },
  { value: "openFolder" as const, label: "打开文件夹" },
  { value: "shutdown" as const, label: "自动关机" },
];

/** 文件冲突处理策略 */
const FILE_CONFLICT_OPTIONS = [
  { value: "ask" as const, label: "询问" },
  { value: "overwrite" as const, label: "覆盖" },
  { value: "rename" as const, label: "重命名" },
];

/** 浏览器扩展列表 */
const BROWSER_EXTENSIONS = [
  { name: "Chrome", key: "chrome" },
  { name: "Edge", key: "edge" },
  { name: "Firefox", key: "firefox" },
] as const;

/** 文件关联类型列表 */
const FILE_EXTENSIONS = [
  ".zip",
  ".rar",
  ".iso",
  ".mp4",
  ".avi",
  ".mkv",
  ".mp3",
  ".exe",
] as const;

// ============================================================
// 表单区块子组件
// ============================================================

/** 表单区块标题 */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
      {children}
    </h3>
  );
}

/** 行布局：左侧标签 + 右侧控件 */
function FormRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <Label className="text-sm text-slate-600 dark:text-slate-400 shrink-0 cursor-pointer">
        {label}
      </Label>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

// ============================================================
// 下载设置表单
// ============================================================

/**
 * 下载设置表单组件
 *
 * 包含基础设置、交互反馈、浏览器集成和文件关联四大区块。
 * 所有更改暂存于本地 useState，点击"保存设置"时批量提交至 useSettingsStore。
 */
export function DownloadSettings() {
  const { toast } = useToast();
  const configDownload = useSettingsStore((s) => s.config.download);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  /** 本地表单状态 — 从全局配置初始化为浅拷贝 */
  const [form, setForm] = useState<DownloadSettingsType>(() => ({
    ...configDownload,
  }));

  /** 更新单个表单字段 */
  const updateField = <K extends keyof DownloadSettingsType>(
    key: K,
    value: DownloadSettingsType[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  /** 批量提交保存 */
  const handleSave = async () => {
    try {
      await updateSettings({ download: form });
      toast({ title: "下载设置已保存" });
    } catch {
      toast({
        title: "保存失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* ================================================ */}
        {/* 基础设置 */}
        {/* ================================================ */}
        <section>
          <SectionTitle>基础设置</SectionTitle>
          <div className="space-y-1">
            {/* 默认下载路径 */}
            <div className="flex items-center justify-between gap-4 py-1.5">
              <Label className="text-sm text-slate-600 dark:text-slate-400 shrink-0">
                默认下载路径
              </Label>
              <div className="flex items-center gap-2 flex-1 max-w-[340px]">
                <Input
                  value={form.defaultPath}
                  onChange={(e) => updateField("defaultPath", e.target.value)}
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
                    <p>浏览文件夹功能正在开发中</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* 同时下载任务数上限 */}
            <FormRow label="同时下载任务数上限">
              <Select
                value={String(form.maxConcurrentTasks)}
                onValueChange={(v) =>
                  updateField("maxConcurrentTasks", Number(v))
                }
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONCURRENT_TASKS_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormRow>

            {/* 单任务最大线程数 */}
            <FormRow label="单任务最大线程数">
              <Select
                value={String(form.maxThreadsPerTask)}
                onValueChange={(v) =>
                  updateField("maxThreadsPerTask", Number(v))
                }
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MAX_THREADS_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormRow>

            {/* 断点续传 */}
            <FormRow label="断点续传">
              <Switch
                checked={form.enableResume}
                onCheckedChange={(v) => updateField("enableResume", v)}
              />
            </FormRow>
          </div>
        </section>

        {/* ================================================ */}
        {/* 交互反馈 */}
        {/* ================================================ */}
        <section>
          <SectionTitle>交互反馈</SectionTitle>
          <div className="space-y-1">
            {/* 下载完成后操作 */}
            <FormRow label="下载完成后操作">
              <Select
                value={form.postDownloadAction}
                onValueChange={(v) =>
                  updateField(
                    "postDownloadAction",
                    v as DownloadSettingsType["postDownloadAction"],
                  )
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POST_DOWNLOAD_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormRow>

            {/* 文件冲突处理 */}
            <FormRow label="文件冲突处理">
              <Select
                value={form.fileConflictPolicy}
                onValueChange={(v) =>
                  updateField(
                    "fileConflictPolicy",
                    v as DownloadSettingsType["fileConflictPolicy"],
                  )
                }
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FILE_CONFLICT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormRow>

            {/* 按任务名创建子文件夹 */}
            <FormRow label="按任务名创建子文件夹">
              <Switch
                checked={form.autoCreateSubdir}
                onCheckedChange={(v) => updateField("autoCreateSubdir", v)}
              />
            </FormRow>
          </div>
        </section>

        {/* ================================================ */}
        {/* 浏览器集成 */}
        {/* ================================================ */}
        <section>
          <SectionTitle>浏览器集成</SectionTitle>
          <div className="space-y-1">
            {/* 剪贴板自动监控 */}
            <FormRow label="剪贴板自动监控">
              <Switch
                checked={form.monitorClipboard}
                onCheckedChange={(v) => updateField("monitorClipboard", v)}
              />
            </FormRow>

            {/* 浏览器扩展插件 */}
            {BROWSER_EXTENSIONS.map((ext) => (
              <FormRow key={ext.key} label={`${ext.name} 扩展插件`}>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  未安装
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled
                      className="text-xs h-7 px-2"
                    >
                      安装
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>该功能正在开发中</p>
                  </TooltipContent>
                </Tooltip>
              </FormRow>
            ))}
          </div>
        </section>

        {/* ================================================ */}
        {/* 文件关联 */}
        {/* ================================================ */}
        <section>
          <SectionTitle>文件关联</SectionTitle>
          <div className="space-y-2">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              选择与下载管理器关联的文件类型（该功能正在开发中）
            </p>
            <div className="grid grid-cols-4 gap-2">
              {FILE_EXTENSIONS.map((ext) => (
                <label
                  key={ext}
                  className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
                >
                  <input
                    type="checkbox"
                    disabled
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 opacity-50 cursor-not-allowed"
                  />
                  {ext}
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================ */}
        {/* 保存按钮 */}
        {/* ================================================ */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <Button onClick={handleSave}>保存设置</Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
