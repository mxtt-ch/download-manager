import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toaster";
import { useSettingsStore } from "@/store/settingsStore";
import { useTaskStore } from "@/store/taskStore";
import type { SpeedSettings as SpeedSettingsType } from "@/types";

import "./DownloadSettings.less";

const LIMIT_UNIT_OPTIONS = [
  { value: "KB" as const, label: "KB/s" },
  { value: "MB" as const, label: "MB/s" },
  { value: "unlimited" as const, label: "不限速" },
];
const SPEED_MODE_OPTIONS = [
  { value: "unlimited" as const, label: "不限速" },
  { value: "custom" as const, label: "限制为指定值" },
  { value: "smart" as const, label: "智能限速" },
];
const ALLOCATION_MODE_OPTIONS = [
  { value: "global" as const, label: "全局限速" },
  { value: "even" as const, label: "均分限速" },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="settings-section__title">{children}</h3>;
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="settings-field">
      <Label className="settings-field__label">{label}</Label>
      <div className="settings-field__control">{children}</div>
    </div>
  );
}

function FormRadio({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-secondary cursor-pointer">
      <input type="radio" checked={checked} onChange={onChange} className="h-4 w-4" />{label}
    </label>
  );
}

/**
 * 速度设置表单组件
 */
export function SpeedSettings() {
  const { toast } = useToast();
  const configSpeed = useSettingsStore((s) => s.config.speed);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const tasks = useTaskStore((s) => s.tasks);

  const [form, setForm] = useState<SpeedSettingsType>(() => ({ ...configSpeed }));

  const [downloadUnit, setDownloadUnit] = useState<"KB" | "MB" | "unlimited">(() => {
    if (!configSpeed.downloadLimit || configSpeed.downloadLimit === 0) return "unlimited";
    if (configSpeed.downloadLimit >= 1024 * 1024) return "MB";
    return "KB";
  });

  const [uploadUnit, setUploadUnit] = useState<"KB" | "MB" | "unlimited">(() => {
    if (!configSpeed.uploadLimit || configSpeed.uploadLimit === 0) return "unlimited";
    if (configSpeed.uploadLimit >= 1024 * 1024) return "MB";
    return "KB";
  });

  const updateField = <K extends keyof SpeedSettingsType>(key: K, value: SpeedSettingsType[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const computeLimitValue = (inputValue: number, unit: "KB" | "MB" | "unlimited") => {
    if (unit === "unlimited" || !inputValue || inputValue <= 0) return 0;
    if (unit === "MB") return inputValue * 1024 * 1024;
    return inputValue * 1024;
  };

  const getDisplayValue = (limitValue: number | undefined, unit: "KB" | "MB" | "unlimited") => {
    if (!limitValue || limitValue === 0 || unit === "unlimited") return 0;
    if (unit === "MB") return Math.round(limitValue / (1024 * 1024));
    return Math.round(limitValue / 1024);
  };

  const toggleWhitelistTask = (taskId: string) => {
    const current = form.whitelistTaskIds ?? [];
    const next = current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId];
    updateField("whitelistTaskIds", next);
  };

  const handleSave = async () => {
    try {
      const downloadLimit = computeLimitValue(getDisplayValue(form.downloadLimit, downloadUnit), downloadUnit);
      const uploadLimit = computeLimitValue(getDisplayValue(form.uploadLimit, uploadUnit), uploadUnit);
      const speedSettings: SpeedSettingsType = { ...form, downloadLimit, uploadLimit };
      await updateSettings({ speed: speedSettings });
      toast({ title: "速度设置已保存" });
    } catch {
      toast({ title: "保存失败", description: "请稍后重试", variant: "destructive" });
    }
  };

  const activeTasks = tasks.filter((t) => t.status === "Downloading" || t.status === "Pending" || t.status === "Paused");

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <section>
          <SectionTitle>基础限速配置</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <FormRow label="下载速度">
              <Input type="number" min={0} placeholder="0"
                value={downloadUnit === "unlimited" ? "" : getDisplayValue(form.downloadLimit, downloadUnit)}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (downloadUnit === "unlimited") return;
                  updateField("downloadLimit", computeLimitValue(val, downloadUnit));
                }}
                disabled={downloadUnit === "unlimited"} className="w-24" />
              <Select value={downloadUnit} onValueChange={(v) => { setDownloadUnit(v as "KB" | "MB" | "unlimited"); if (v === "unlimited") updateField("downloadLimit", 0); }}>
                <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                <SelectContent>{LIMIT_UNIT_OPTIONS.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent>
              </Select>
            </FormRow>

            <FormRow label="上传速度">
              <Input type="number" min={0} placeholder="0"
                value={uploadUnit === "unlimited" ? "" : getDisplayValue(form.uploadLimit, uploadUnit)}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (uploadUnit === "unlimited") return;
                  updateField("uploadLimit", computeLimitValue(val, uploadUnit));
                }}
                disabled={uploadUnit === "unlimited"} className="w-24" />
              <Select value={uploadUnit} onValueChange={(v) => { setUploadUnit(v as "KB" | "MB" | "unlimited"); if (v === "unlimited") updateField("uploadLimit", 0); }}>
                <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                <SelectContent>{LIMIT_UNIT_OPTIONS.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent>
              </Select>
            </FormRow>

            <div className="settings-field">
              <Label className="settings-field__label">速度模式</Label>
              <div className="flex items-center gap-4">
                {SPEED_MODE_OPTIONS.map((opt) => (
                  <FormRadio key={opt.value} label={opt.label} checked={form.speedMode === opt.value} onChange={() => updateField("speedMode", opt.value)} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section>
          <SectionTitle>限速分配模式</SectionTitle>
          <div className="flex items-center gap-4 py-1.5">
            {ALLOCATION_MODE_OPTIONS.map((opt) => (
              <FormRadio key={opt.value} label={opt.label} checked={form.allocationMode === opt.value} onChange={() => updateField("allocationMode", opt.value)} />
            ))}
          </div>
        </section>

        <section>
          <SectionTitle>高级智能选项</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <FormRow label="启动时应用限速">
              <Switch checked={form.applyLimitOnStartup} onCheckedChange={(v) => updateField("applyLimitOnStartup", v)} />
            </FormRow>
            <FormRow label="网络空闲加速">
              <Switch checked={form.smartAcceleration} onCheckedChange={(v) => updateField("smartAcceleration", v)} />
            </FormRow>
            {form.smartAcceleration && (
              <div className="settings-field">
                <Label className="settings-field__label">加速阈值</Label>
                <div className="flex items-center gap-3 flex-1" style={{ maxWidth: 240 }}>
                  <input type="range" min={1} max={50} value={form.accelerationThreshold}
                    onChange={(e) => updateField("accelerationThreshold", Number(e.target.value))}
                    className="flex-1" style={{ height: 8, appearance: "auto", accentColor: "var(--primary)" }} />
                  <span className="text-sm text-secondary w-12 text-right">{form.accelerationThreshold}%</span>
                </div>
              </div>
            )}
            {activeTasks.length > 0 && (
              <div className="py-sm">
                <Label className="text-sm text-secondary mb-sm block">白名单管理（选中任务不受限速）</Label>
                <div className="space-y-1 max-h-[160px] overflow-y-auto border rounded-md p-sm" style={{ borderColor: "var(--border-color)" }}>
                  {activeTasks.map((task) => (
                    <label key={task.id} className="flex items-center gap-2 px-sm py-1.5 rounded hover:bg-hover cursor-pointer">
                      <input type="checkbox" checked={(form.whitelistTaskIds ?? []).includes(task.id)}
                        onChange={() => toggleWhitelistTask(task.id)} className="h-4 w-4" />
                      <span className="text-sm text-primary truncate">{task.filename}</span>
                      <span className="text-xs text-muted shrink-0">
                        {task.status === "Downloading" ? "下载中" : task.status === "Pending" ? "等待中" : "已暂停"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            {activeTasks.length === 0 && (
              <p className="text-xs text-muted py-1.5">暂无可用于白名单的活跃任务</p>
            )}
          </div>
        </section>

        <div className="pt-sm border-t flex justify-end" style={{ borderColor: "var(--border-color)" }}>
          <Button onClick={handleSave}>保存设置</Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
