import { useState } from "react";
import { Link, FolderOpen } from "lucide-react";
import "./UrlDownload.less";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { NewDownloadForm, Queue } from "@/types";

interface UrlDownloadProps {
  form: NewDownloadForm;
  queues: Queue[];
  onUpdateField: <K extends keyof NewDownloadForm>(key: K, value: NewDownloadForm[K]) => void;
}

/**
 * URL 下载模式组件
 * 包含 URL 输入、文件名、保存路径、队列选择和高级选项
 */
export function UrlDownload({ form, queues, onUpdateField }: UrlDownloadProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleUrlFocus = () => {
    navigator.clipboard.readText()
      .then((text) => {
        if (!form.url && (text.startsWith("http://") || text.startsWith("https://"))) {
          onUpdateField("url", text);
        }
      })
      .catch(() => {});
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4">
        {/* A. 下载类型 Tabs */}
        <div>
          <Label className="mb-sm block text-xs text-muted">下载类型</Label>
          <Tabs value="url" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="url" className="flex-1 gap-1.5">
                <Link className="h-4 w-4" />URL 下载
              </TabsTrigger>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex flex-1 cursor-not-allowed">
                    <TabsTrigger value="bt" disabled className="flex-1 gap-1.5 text-muted">BT 种子</TabsTrigger>
                  </span>
                </TooltipTrigger>
                <TooltipContent><p>该功能正在开发中</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex flex-1 cursor-not-allowed">
                    <TabsTrigger value="magnet" disabled className="flex-1 gap-1.5 text-muted">磁力链接</TabsTrigger>
                  </span>
                </TooltipTrigger>
                <TooltipContent><p>该功能正在开发中</p></TooltipContent>
              </Tooltip>
            </TabsList>
          </Tabs>
        </div>

        {/* B. URL 输入框 */}
        <div className="url-download__field">
          <Label htmlFor="download-url">下载链接</Label>
          <Input id="download-url" placeholder="请输入下载链接..." value={form.url}
            onChange={(e) => onUpdateField("url", e.target.value)} onFocus={handleUrlFocus} autoFocus />
        </div>

        {/* C. 文件名 */}
        <div className="url-download__field">
          <Label htmlFor="download-filename" className="text-secondary">文件名（可选）</Label>
          <Input id="download-filename" placeholder="自动从链接解析" value={form.filename}
            onChange={(e) => onUpdateField("filename", e.target.value)} />
        </div>

        {/* D. 保存路径 */}
        <div className="url-download__field">
          <Label htmlFor="download-path">保存路径</Label>
          <div className="flex gap-2">
            <Input id="download-path" value={form.savePath}
              onChange={(e) => onUpdateField("savePath", e.target.value)} className="flex-1" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="outline" size="icon" className="shrink-0">
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>选择文件夹功能正在开发中</p></TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* E. 队列选择 */}
        <div className="url-download__field">
          <Label htmlFor="download-queue">下载队列</Label>
          <Select value={form.queueId} onValueChange={(value) => onUpdateField("queueId", value)}>
            <SelectTrigger id="download-queue"><SelectValue placeholder="选择队列" /></SelectTrigger>
            <SelectContent>
              {queues.map((q) => (<SelectItem key={q.id} value={q.id}>{q.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        {/* F. 高级选项 */}
        <div>
          <button type="button" className="flex items-center gap-1 text-sm text-muted hover:text-primary transition-colors"
            onClick={() => setShowAdvanced((v) => !v)}>
            {showAdvanced ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
            )}
            高级选项
          </button>

          {showAdvanced && (
            <div className="url-download__advanced">
              <div className="url-download__row">
                <Label htmlFor="thread-count" className="cursor-pointer">线程数</Label>
                <Input id="thread-count" type="number" min={1} max={32} value={form.threadCount}
                  onChange={(e) => { const v = Math.max(1, Math.min(32, Number(e.target.value) || 1)); onUpdateField("threadCount", v); }}
                  className="w-20 text-center" />
              </div>
              <div className="url-download__row">
                <Label className="cursor-pointer">断点续传</Label>
                <Switch checked={form.enableResume} onCheckedChange={(v) => onUpdateField("enableResume", v)} />
              </div>
              <div className="url-download__row">
                <Label className="cursor-pointer">自动开始下载</Label>
                <Switch checked={form.autoStart} onCheckedChange={(v) => onUpdateField("autoStart", v)} />
              </div>
              <div className="url-download__row">
                <Label className="cursor-pointer">下载完成后校验文件完整性</Label>
                <Switch checked={form.enableIntegrityCheck} onCheckedChange={(v) => onUpdateField("enableIntegrityCheck", v)} />
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
