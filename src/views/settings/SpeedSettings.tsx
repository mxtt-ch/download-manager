import { useState } from "react";
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
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toaster";
import { useSettingsStore } from "@/store/settingsStore";
import { useTaskStore } from "@/store/taskStore";
import type { SpeedSettings as SpeedSettingsType } from "@/types";

// ============================================================
// 下拉选项常量
// ============================================================

/** 限速单位选项 */
const LIMIT_UNIT_OPTIONS = [
  { value: "KB" as const, label: "KB/s" },
  { value: "MB" as const, label: "MB/s" },
  { value: "unlimited" as const, label: "不限速" },
];

/** 速度模式选项 */
const SPEED_MODE_OPTIONS = [
  { value: "unlimited" as const, label: "不限速" },
  { value: "custom" as const, label: "限制为指定值" },
  { value: "smart" as const, label: "智能限速" },
];

/** 分配模式选项 */
const ALLOCATION_MODE_OPTIONS = [
  { value: "global" as const, label: "全局限速" },
  { value: "even" as const, label: "均分限速" },
];

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

/** 自定义 Radio 按钮 */
function FormRadio({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer"
    >
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500 dark:border-slate-600"
      />
      {label}
    </label>
  );
}

// ============================================================
// 速度设置表单
// ============================================================

/**
 * 速度设置表单组件
 *
 * 包含基础限速配置、限速分配模式、高级智能选项和白名单管理。
 * 所有更改暂存于本地 useState，点击"保存设置"时批量提交至 useSettingsStore。
 */
export function SpeedSettings() {
  const { toast } = useToast();
  const configSpeed = useSettingsStore((s) => s.config.speed);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const tasks = useTaskStore((s) => s.tasks);

  /** 本地表单状态 — 从全局配置初始化为浅拷贝 */
  const [form, setForm] = useState<SpeedSettingsType>(() => ({
    ...configSpeed,
  }));

  /** 下载限速单位状态（从限速值推断初始单位） */
  const [downloadUnit, setDownloadUnit] = useState<"KB" | "MB" | "unlimited">(
    () => {
      if (!configSpeed.downloadLimit || configSpeed.downloadLimit === 0) return "unlimited";
      if (configSpeed.downloadLimit >= 1024 * 1024) return "MB";
      return "KB";
    },
  );

  /** 上传限速单位状态 */
  const [uploadUnit, setUploadUnit] = useState<"KB" | "MB" | "unlimited">(
    () => {
      if (!configSpeed.uploadLimit || configSpeed.uploadLimit === 0) return "unlimited";
      if (configSpeed.uploadLimit >= 1024 * 1024) return "MB";
      return "KB";
    },
  );

  /** 更新单个表单字段 */
  const updateField = <K extends keyof SpeedSettingsType>(
    key: K,
    value: SpeedSettingsType[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  /** 根据单位和数值计算字节/秒限速值 */
  const computeLimitValue = (
    inputValue: number,
    unit: "KB" | "MB" | "unlimited",
  ): number => {
    if (unit === "unlimited" || !inputValue || inputValue <= 0) return 0;
    if (unit === "MB") return inputValue * 1024 * 1024;
    return inputValue * 1024;
  };

  /** 根据限速字节值反推显示数值 */
  const getDisplayValue = (
    limitValue: number | undefined,
    unit: "KB" | "MB" | "unlimited",
  ): number => {
    if (!limitValue || limitValue === 0 || unit === "unlimited") return 0;
    if (unit === "MB") return Math.round(limitValue / (1024 * 1024));
    return Math.round(limitValue / 1024);
  };

  /** 切换白名单中的任务 */
  const toggleWhitelistTask = (taskId: string) => {
    const current = form.whitelistTaskIds ?? [];
    const next = current.includes(taskId)
      ? current.filter((id) => id !== taskId)
      : [...current, taskId];
    updateField("whitelistTaskIds", next);
  };

  /** 批量提交保存 */
  const handleSave = async () => {
    try {
      // 根据单位和数值计算实际限速值
      const downloadLimit = computeLimitValue(
        getDisplayValue(form.downloadLimit, downloadUnit),
        downloadUnit,
      );
      const uploadLimit = computeLimitValue(
        getDisplayValue(form.uploadLimit, uploadUnit),
        uploadUnit,
      );

      const speedSettings: SpeedSettingsType = {
        ...form,
        downloadLimit,
        uploadLimit,
      };

      await updateSettings({ speed: speedSettings });
      toast({ title: "速度设置已保存" });
    } catch {
      toast({
        title: "保存失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    }
  };

  // 筛选活跃任务（下载中或等待中的任务）
  const activeTasks = tasks.filter(
    (t) => t.status === "Downloading" || t.status === "Pending" || t.status === "Paused",
  );

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* ================================================ */}
        {/* 基础限速配置 */}
        {/* ================================================ */}
        <section>
          <SectionTitle>基础限速配置</SectionTitle>
          <div className="space-y-1">
            {/* 下载速度 */}
            <FormRow label="下载速度">
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={
                  downloadUnit === "unlimited"
                    ? ""
                    : getDisplayValue(form.downloadLimit, downloadUnit)
                }
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (downloadUnit === "unlimited") return;
                  const bytes = computeLimitValue(val, downloadUnit);
                  updateField("downloadLimit", bytes);
                }}
                disabled={downloadUnit === "unlimited"}
                className="w-24"
              />
              <Select
                value={downloadUnit}
                onValueChange={(v) => {
                  setDownloadUnit(v as "KB" | "MB" | "unlimited");
                  if (v === "unlimited") {
                    updateField("downloadLimit", 0);
                  }
                }}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LIMIT_UNIT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormRow>

            {/* 上传速度 */}
            <FormRow label="上传速度">
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={
                  uploadUnit === "unlimited"
                    ? ""
                    : getDisplayValue(form.uploadLimit, uploadUnit)
                }
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (uploadUnit === "unlimited") return;
                  const bytes = computeLimitValue(val, uploadUnit);
                  updateField("uploadLimit", bytes);
                }}
                disabled={uploadUnit === "unlimited"}
                className="w-24"
              />
              <Select
                value={uploadUnit}
                onValueChange={(v) => {
                  setUploadUnit(v as "KB" | "MB" | "unlimited");
                  if (v === "unlimited") {
                    updateField("uploadLimit", 0);
                  }
                }}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LIMIT_UNIT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormRow>

            {/* 速度模式 */}
            <div className="flex items-center justify-between gap-4 py-1.5">
              <Label className="text-sm text-slate-600 dark:text-slate-400 shrink-0">
                速度模式
              </Label>
              <div className="flex items-center gap-4">
                {SPEED_MODE_OPTIONS.map((opt) => (
                  <FormRadio
                    key={opt.value}
                    label={opt.label}
                    checked={form.speedMode === opt.value}
                    onChange={() => updateField("speedMode", opt.value)}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================================================ */}
        {/* 限速分配模式 */}
        {/* ================================================ */}
        <section>
          <SectionTitle>限速分配模式</SectionTitle>
          <div className="space-y-1">
            <div className="flex items-center gap-4 py-1.5">
              {ALLOCATION_MODE_OPTIONS.map((opt) => (
                <FormRadio
                  key={opt.value}
                  label={opt.label}
                  checked={form.allocationMode === opt.value}
                  onChange={() => updateField("allocationMode", opt.value)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ================================================ */}
        {/* 高级智能选项 */}
        {/* ================================================ */}
        <section>
          <SectionTitle>高级智能选项</SectionTitle>
          <div className="space-y-1">
            {/* 启动时应用限速 */}
            <FormRow label="启动时应用限速">
              <Switch
                checked={form.applyLimitOnStartup}
                onCheckedChange={(v) => updateField("applyLimitOnStartup", v)}
              />
            </FormRow>

            {/* 网络空闲加速 */}
            <FormRow label="网络空闲加速">
              <Switch
                checked={form.smartAcceleration}
                onCheckedChange={(v) => updateField("smartAcceleration", v)}
              />
            </FormRow>

            {/* 加速阈值滑块 */}
            {form.smartAcceleration && (
              <div className="flex items-center justify-between gap-4 py-1.5">
                <Label className="text-sm text-slate-600 dark:text-slate-400 shrink-0">
                  加速阈值
                </Label>
                <div className="flex items-center gap-3 flex-1 max-w-[240px]">
                  <input
                    type="range"
                    min={1}
                    max={50}
                    value={form.accelerationThreshold}
                    onChange={(e) =>
                      updateField("accelerationThreshold", Number(e.target.value))
                    }
                    className="flex-1 h-2 rounded-full appearance-none bg-slate-200 dark:bg-slate-700 accent-blue-600 cursor-pointer"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400 w-12 text-right">
                    {form.accelerationThreshold}%
                  </span>
                </div>
              </div>
            )}

            {/* 白名单管理 */}
            {activeTasks.length > 0 && (
              <div className="py-2">
                <Label className="text-sm text-slate-600 dark:text-slate-400 mb-2 block">
                  白名单管理（选中任务不受限速）
                </Label>
                <div className="space-y-1 max-h-[160px] overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-md p-2">
                  {activeTasks.map((task) => (
                    <label
                      key={task.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={(form.whitelistTaskIds ?? []).includes(task.id)}
                        onChange={() => toggleWhitelistTask(task.id)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
                        {task.filename}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                        {task.status === "Downloading"
                          ? "下载中"
                          : task.status === "Pending"
                            ? "等待中"
                            : "已暂停"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeTasks.length === 0 && (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-1.5">
                暂无可用于白名单的活跃任务
              </p>
            )}
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
