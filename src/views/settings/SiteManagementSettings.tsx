import { useState, useEffect } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/toaster";
import * as siteApi from "@/api/site";
import type { SiteAuth } from "@/types";

import { formatBytes } from "@/utils/util";

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
// 登录状态配置
// ============================================================

/** 登录状态显示映射 */
const LOGIN_STATUS_MAP: Record<
  SiteAuth["loginStatus"],
  { label: string; color: string }
> = {
  logged_in: { label: "已登录", color: "bg-green-500" },
  unknown: { label: "未知", color: "bg-slate-400" },
  expired: { label: "已过期", color: "bg-red-500" },
  error: { label: "错误", color: "bg-red-500" },
};

// ============================================================
// 站点弹窗子组件
// ============================================================

/** 空站点表单的默认值 */
function emptySiteForm(): Omit<SiteAuth, "id" | "quotaUsed"> {
  return {
    siteName: "",
    domainPattern: "",
    cookies: "",
    customUa: "",
    referer: "",
    loginStatus: "unknown",
  };
}

interface SiteDialogProps {
  /** 弹窗是否打开 */
  open: boolean;
  /** 编辑时传入已有站点数据；新建时传入 null */
  initialData: SiteAuth | null;
  /** 关闭回调 */
  onClose: () => void;
  /** 保存成功后的刷新回调 */
  onSaved: () => void;
}

/**
 * 添加 / 编辑站点弹窗
 *
 * 包含站点名称、匹配规则、Cookie、自定义 User-Agent、Referer 等表单字段。
 */
function SiteDialog({
  open,
  initialData,
  onClose,
  onSaved,
}: SiteDialogProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(() =>
    initialData
      ? {
        siteName: initialData.siteName,
        domainPattern: initialData.domainPattern,
        cookies: initialData.cookies ?? "",
        customUa: initialData.customUa ?? "",
        referer: initialData.referer ?? "",
      }
      : emptySiteForm(),
  );

  // 弹窗打开时同步 initialData
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      if (initialData) {
        setForm({
          siteName: initialData.siteName,
          domainPattern: initialData.domainPattern,
          cookies: initialData.cookies ?? "",
          customUa: initialData.customUa ?? "",
          referer: initialData.referer ?? "",
        });
      } else {
        setForm(emptySiteForm());
      }
    }
    if (!isOpen) onClose();
  };

  /** 更新表单字段 */
  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  /** 提交保存 */
  const handleSave = async () => {
    if (!form.siteName.trim()) {
      toast({ title: "请输入站点名称", variant: "destructive" });
      return;
    }
    if (!form.domainPattern.trim()) {
      toast({ title: "请输入匹配规则", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (initialData) {
        // 编辑已有站点
        await siteApi.updateSite({
          ...initialData,
          siteName: form.siteName,
          domainPattern: form.domainPattern,
          cookies: form.cookies || undefined,
          customUa: form.customUa || undefined,
          referer: form.referer || undefined,
        });
        toast({ title: "站点已更新" });
      } else {
        // 添加新站点
        await siteApi.addSite({
          siteName: form.siteName,
          domainPattern: form.domainPattern,
          cookies: form.cookies || undefined,
          customUa: form.customUa || undefined,
          referer: form.referer || undefined,
          loginStatus: "unknown",
          quotaUsed: 0,
        });
        toast({ title: "站点已添加" });
      }
      onSaved();
      onClose();
    } catch {
      toast({ title: "保存失败", description: "请稍后重试", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "编辑站点" : "添加站点"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* 站点名称 */}
          <div className="space-y-1.5">
            <Label className="text-sm">站点名称</Label>
            <Input
              value={form.siteName}
              onChange={(e) => updateField("siteName", e.target.value)}
              placeholder="例如：百度网盘"
            />
          </div>

          {/* 匹配规则 */}
          <div className="space-y-1.5">
            <Label className="text-sm">匹配规则</Label>
            <Input
              value={form.domainPattern}
              onChange={(e) => updateField("domainPattern", e.target.value)}
              placeholder="*.baidu.com"
            />
          </div>

          {/* Cookie */}
          <div className="space-y-1.5">
            <Label className="text-sm">Cookie（可选）</Label>
            <textarea
              value={form.cookies}
              onChange={(e) => updateField("cookies", e.target.value)}
              placeholder="粘贴浏览器 Cookie 字符串"
              rows={3}
              className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 resize-none"
              style={{ fontFamily: "monospace", fontSize: "11px" }}
            />
          </div>

          {/* 自定义 User-Agent */}
          <div className="space-y-1.5">
            <Label className="text-sm">自定义 User-Agent（可选）</Label>
            <Input
              value={form.customUa}
              onChange={(e) => updateField("customUa", e.target.value)}
              placeholder="Mozilla/5.0 ..."
            />
          </div>

          {/* Referer */}
          <div className="space-y-1.5">
            <Label className="text-sm">Referer（可选）</Label>
            <Input
              value={form.referer}
              onChange={(e) => updateField("referer", e.target.value)}
              placeholder="https://example.com/"
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "保存中..." : "保存"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 站点管理设置表单
// ============================================================

/**
 * 站点管理设置表单组件
 *
 * 包含站点列表、添加/编辑站点弹窗，以及全局下载规则区域。
 * 站点数据通过 siteApi 直接与后端通信。
 */
export function SiteManagementSettings() {
  const { toast } = useToast();

  // 站点列表状态
  const [sites, setSites] = useState<SiteAuth[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 弹窗状态
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<SiteAuth | null>(null);

  // 全局下载规则（本组件内状态）
  const [globalReferer, setGlobalReferer] = useState("");
  const [globalUserAgent, setGlobalUserAgent] = useState("");
  const [autoDetectLinks, setAutoDetectLinks] = useState(true);
  const [autoInjectCookies, setAutoInjectCookies] = useState(true);
  const [enableRedirectTracking, setEnableRedirectTracking] = useState(true);

  /** 加载站点列表 */
  const fetchSites = async () => {
    setIsLoading(true);
    try {
      const data = await siteApi.getSites();
      setSites(data);
    } catch {
      toast({ title: "加载站点列表失败", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // 组件挂载时加载站点数据
  useEffect(() => {
    fetchSites();
  }, []);

  /** 打开新建弹窗 */
  const handleAdd = () => {
    setEditingSite(null);
    setDialogOpen(true);
  };

  /** 打开编辑弹窗 */
  const handleEdit = (site: SiteAuth) => {
    setEditingSite(site);
    setDialogOpen(true);
  };

  /** 删除站点 */
  const handleDelete = async (site: SiteAuth) => {
    try {
      await siteApi.deleteSite(site.id);
      setSites((prev) => prev.filter((s) => s.id !== site.id));
      toast({ title: `已删除站点：${site.siteName}` });
    } catch {
      toast({ title: "删除失败", description: "请稍后重试", variant: "destructive" });
    }
  };

  /** 保存全局下载规则 */
  const handleSaveGlobal = async () => {
    try {
      // 全局规则目前暂存于本地状态
      // 后续可扩展为通过 settings API 持久化
      toast({ title: "全局下载规则已保存" });
    } catch {
      toast({ title: "保存失败", description: "请稍后重试", variant: "destructive" });
    }
  };

  /** 获取登录状态的样式 */
  const getStatusDot = (status: SiteAuth["loginStatus"]) => {
    const config = LOGIN_STATUS_MAP[status];
    return (
      <span className="inline-flex items-center gap-1.5 text-xs">
        <span
          className={`inline-block w-2 h-2 rounded-full ${config.color}`}
        />
        {config.label}
      </span>
    );
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* ================================================ */}
        {/* 站点列表 */}
        {/* ================================================ */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <SectionTitle>站点列表</SectionTitle>
            <Button size="sm" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-1" />
              添加站点
            </Button>
          </div>

          {isLoading ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">
              加载中...
            </p>
          ) : sites.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>站点名称</TableHead>
                  <TableHead>匹配规则</TableHead>
                  <TableHead className="w-[100px]">登录状态</TableHead>
                  <TableHead className="w-[130px]">已用/配额</TableHead>
                  <TableHead className="w-[100px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sites.map((site) => (
                  <TableRow key={site.id}>
                    <TableCell className="font-medium text-slate-700 dark:text-slate-300">
                      {site.siteName}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {site.domainPattern}
                    </TableCell>
                    <TableCell>
                      {getStatusDot(site.loginStatus)}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                      {site.quotaTotal
                        ? `${formatBytes(site.quotaUsed)} / ${formatBytes(site.quotaTotal)}`
                        : "--"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(site)}
                          className="h-7 px-2 text-xs"
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          编辑
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(site)}
                          className="h-7 px-2 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          删除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">
              暂无站点，点击上方"添加站点"创建
            </p>
          )}
        </section>

        {/* ================================================ */}
        {/* 分隔线 */}
        {/* ================================================ */}
        <div className="border-t border-slate-200 dark:border-slate-700" />

        {/* ================================================ */}
        {/* 全局下载规则 */}
        {/* ================================================ */}
        <section>
          <SectionTitle>全局下载规则</SectionTitle>
          <div className="space-y-4">
            {/* 默认 Referer */}
            <div className="flex items-center justify-between gap-4">
              <Label className="text-sm text-slate-600 dark:text-slate-400 shrink-0">
                默认 Referer
              </Label>
              <Input
                value={globalReferer}
                onChange={(e) => setGlobalReferer(e.target.value)}
                placeholder="https://example.com/"
                className="flex-1 max-w-[360px]"
              />
            </div>

            {/* 默认 User-Agent */}
            <div className="flex items-center justify-between gap-4">
              <Label className="text-sm text-slate-600 dark:text-slate-400 shrink-0">
                默认 User-Agent
              </Label>
              <Input
                value={globalUserAgent}
                onChange={(e) => setGlobalUserAgent(e.target.value)}
                placeholder="Mozilla/5.0 ..."
                className="flex-1 max-w-[360px]"
              />
            </div>

            {/* 辅助功能 */}
            <div className="space-y-1 pt-2">
              <FormRow label="自动识别下载链接">
                <Switch
                  checked={autoDetectLinks}
                  onCheckedChange={setAutoDetectLinks}
                />
              </FormRow>
              <FormRow label="自动带入网站 Cookie">
                <Switch
                  checked={autoInjectCookies}
                  onCheckedChange={setAutoInjectCookies}
                />
              </FormRow>
              <FormRow label="启用重定向追踪">
                <Switch
                  checked={enableRedirectTracking}
                  onCheckedChange={setEnableRedirectTracking}
                />
              </FormRow>
            </div>
          </div>
        </section>

        {/* ================================================ */}
        {/* 保存按钮 */}
        {/* ================================================ */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <Button onClick={handleSaveGlobal}>保存设置</Button>
        </div>

        {/* ================================================ */}
        {/* 新建/编辑站点弹窗 */}
        {/* ================================================ */}
        <SiteDialog
          open={dialogOpen}
          initialData={editingSite}
          onClose={() => setDialogOpen(false)}
          onSaved={fetchSites}
        />
      </div>
    </TooltipProvider>
  );
}
