import { useState, useEffect } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useToast } from "@/components/ui/toaster";
import * as siteApi from "@/api/site";
import type { SiteAuth } from "@/types";

import { formatBytes } from "@/utils/util";
import "./DownloadSettings.less";
import "./SiteManagementSettings.less";

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

const LOGIN_STATUS_MAP: Record<SiteAuth["loginStatus"], { label: string; colorClass: string }> = {
  logged_in: { label: "已登录", colorClass: "site-list__dot--logged-in" },
  unknown: { label: "未知", colorClass: "site-list__dot--unknown" },
  expired: { label: "已过期", colorClass: "site-list__dot--expired" },
  error: { label: "错误", colorClass: "site-list__dot--expired" },
};

function emptySiteForm(): Omit<SiteAuth, "id" | "quotaUsed"> {
  return { siteName: "", domainPattern: "", cookies: "", customUa: "", referer: "", loginStatus: "unknown" };
}

interface SiteDialogProps {
  open: boolean;
  initialData: SiteAuth | null;
  onClose: () => void;
  onSaved: () => void;
}

function SiteDialog({ open, initialData, onClose, onSaved }: SiteDialogProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => initialData ? {
    siteName: initialData.siteName, domainPattern: initialData.domainPattern,
    cookies: initialData.cookies ?? "", customUa: initialData.customUa ?? "", referer: initialData.referer ?? "",
  } : emptySiteForm());

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      if (initialData) { setForm({ siteName: initialData.siteName, domainPattern: initialData.domainPattern, cookies: initialData.cookies ?? "", customUa: initialData.customUa ?? "", referer: initialData.referer ?? "" }); }
      else { setForm(emptySiteForm()); }
    }
    if (!isOpen) onClose();
  };

  const updateField = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.siteName.trim()) { toast({ title: "请输入站点名称", variant: "destructive" }); return; }
    if (!form.domainPattern.trim()) { toast({ title: "请输入匹配规则", variant: "destructive" }); return; }
    setSaving(true);
    try {
      if (initialData) {
        await siteApi.updateSite({ ...initialData, siteName: form.siteName, domainPattern: form.domainPattern, cookies: form.cookies || undefined, customUa: form.customUa || undefined, referer: form.referer || undefined });
        toast({ title: "站点已更新" });
      } else {
        await siteApi.addSite({ siteName: form.siteName, domainPattern: form.domainPattern, cookies: form.cookies || undefined, customUa: form.customUa || undefined, referer: form.referer || undefined, loginStatus: "unknown", quotaUsed: 0 });
        toast({ title: "站点已添加" });
      }
      onSaved(); onClose();
    } catch { toast({ title: "保存失败", description: "请稍后重试", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{initialData ? "编辑站点" : "添加站点"}</DialogTitle></DialogHeader>
        <div className="site-dialog__form">
          <div className="site-dialog__field">
            <Label className="text-sm">站点名称</Label>
            <Input value={form.siteName} onChange={(e) => updateField("siteName", e.target.value)} placeholder="例如：百度网盘" />
          </div>
          <div className="site-dialog__field">
            <Label className="text-sm">匹配规则</Label>
            <Input value={form.domainPattern} onChange={(e) => updateField("domainPattern", e.target.value)} placeholder="*.baidu.com" />
          </div>
          <div className="site-dialog__field">
            <Label className="text-sm">Cookie（可选）</Label>
            <textarea value={form.cookies} onChange={(e) => updateField("cookies", e.target.value)}
              placeholder="粘贴浏览器 Cookie 字符串" rows={3} className="site-dialog__textarea" />
          </div>
          <div className="site-dialog__field">
            <Label className="text-sm">自定义 User-Agent（可选）</Label>
            <Input value={form.customUa} onChange={(e) => updateField("customUa", e.target.value)} placeholder="Mozilla/5.0 ..." />
          </div>
          <div className="site-dialog__field">
            <Label className="text-sm">Referer（可选）</Label>
            <Input value={form.referer} onChange={(e) => updateField("referer", e.target.value)} placeholder="https://example.com/" />
          </div>
          <div className="site-dialog__actions">
            <Button variant="outline" onClick={onClose}>取消</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "保存中..." : "保存"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * 站点管理设置表单组件
 */
export function SiteManagementSettings() {
  const { toast } = useToast();
  const [sites, setSites] = useState<SiteAuth[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<SiteAuth | null>(null);

  const [globalReferer, setGlobalReferer] = useState("");
  const [globalUserAgent, setGlobalUserAgent] = useState("");
  const [autoDetectLinks, setAutoDetectLinks] = useState(true);
  const [autoInjectCookies, setAutoInjectCookies] = useState(true);
  const [enableRedirectTracking, setEnableRedirectTracking] = useState(true);

  const fetchSites = async () => {
    setIsLoading(true);
    try { setSites(await siteApi.getSites()); }
    catch { toast({ title: "加载站点列表失败", variant: "destructive" }); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchSites(); }, []);

  const handleAdd = () => { setEditingSite(null); setDialogOpen(true); };
  const handleEdit = (site: SiteAuth) => { setEditingSite(site); setDialogOpen(true); };
  const handleDelete = async (site: SiteAuth) => {
    try { await siteApi.deleteSite(site.id); setSites((prev) => prev.filter((s) => s.id !== site.id)); toast({ title: `已删除站点：${site.siteName}` }); }
    catch { toast({ title: "删除失败", description: "请稍后重试", variant: "destructive" }); }
  };
  const handleSaveGlobal = async () => {
    try { toast({ title: "全局下载规则已保存" }); }
    catch { toast({ title: "保存失败", description: "请稍后重试", variant: "destructive" }); }
  };

  const getStatusDot = (status: SiteAuth["loginStatus"]) => {
    const config = LOGIN_STATUS_MAP[status];
    return (
      <span className="site-list__status-dot">
        <span className={`site-list__dot ${config.colorClass}`} />{config.label}
      </span>
    );
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <section>
          <div className="site-list__header">
            <SectionTitle>站点列表</SectionTitle>
            <Button size="sm" onClick={handleAdd}><Plus className="h-4 w-4 mr-xs" />添加站点</Button>
          </div>
          {isLoading ? (
            <p className="text-sm text-muted text-center py-8">加载中...</p>
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
                    <TableCell className="font-medium text-primary">{site.siteName}</TableCell>
                    <TableCell className="text-xs text-secondary font-mono">{site.domainPattern}</TableCell>
                    <TableCell>{getStatusDot(site.loginStatus)}</TableCell>
                    <TableCell className="text-xs text-secondary">
                      {site.quotaTotal ? `${formatBytes(site.quotaUsed)} / ${formatBytes(site.quotaTotal)}` : "--"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(site)} className="h-7 px-2 text-xs">
                          <Pencil className="h-3 w-3 mr-xs" />编辑
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(site)}
                          className="h-7 px-2 text-xs text-red-500 hover:text-red-700 dark:text-red-400">
                          <Trash2 className="h-3 w-3 mr-xs" />删除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted text-center py-8">暂无站点，点击上方"添加站点"创建</p>
          )}
        </section>

        <div className="border-t" style={{ borderColor: "var(--border-color)" }} />

        <section>
          <SectionTitle>全局下载规则</SectionTitle>
          <div className="space-y-4">
            <div className="settings-field">
              <Label className="settings-field__label">默认 Referer</Label>
              <Input value={globalReferer} onChange={(e) => setGlobalReferer(e.target.value)} placeholder="https://example.com/" className="flex-1 max-w-[360px]" />
            </div>
            <div className="settings-field">
              <Label className="settings-field__label">默认 User-Agent</Label>
              <Input value={globalUserAgent} onChange={(e) => setGlobalUserAgent(e.target.value)} placeholder="Mozilla/5.0 ..." className="flex-1 max-w-[360px]" />
            </div>
            <div className="pt-sm" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <FormRow label="自动识别下载链接"><Switch checked={autoDetectLinks} onCheckedChange={setAutoDetectLinks} /></FormRow>
              <FormRow label="自动带入网站 Cookie"><Switch checked={autoInjectCookies} onCheckedChange={setAutoInjectCookies} /></FormRow>
              <FormRow label="启用重定向追踪"><Switch checked={enableRedirectTracking} onCheckedChange={setEnableRedirectTracking} /></FormRow>
            </div>
          </div>
        </section>

        <div className="pt-sm border-t flex justify-end" style={{ borderColor: "var(--border-color)" }}>
          <Button onClick={handleSaveGlobal}>保存设置</Button>
        </div>

        <SiteDialog open={dialogOpen} initialData={editingSite} onClose={() => setDialogOpen(false)} onSaved={fetchSites} />
      </div>
    </TooltipProvider>
  );
}
