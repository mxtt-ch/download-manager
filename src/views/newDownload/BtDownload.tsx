import { Network } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

/**
 * BT 种子下载模式组件（开发中）
 */
export function BtDownload() {
  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4">
        <div>
          <Label className="mb-sm block text-xs text-muted">下载类型</Label>
          <Tabs value="bt" className="w-full">
            <TabsList className="w-full">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex flex-1 cursor-not-allowed">
                    <TabsTrigger value="url" disabled className="flex-1 gap-1.5 text-muted">URL 下载</TabsTrigger>
                  </span>
                </TooltipTrigger>
                <TooltipContent><p>该功能正在开发中</p></TooltipContent>
              </Tooltip>
              <TabsTrigger value="bt" className="flex-1 gap-1.5">
                <Network className="h-4 w-4" />BT 种子
              </TabsTrigger>
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

        <div className="flex items-center justify-center" style={{ padding: "48px 0" }}>
          <div className="text-center" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <Network className="h-12 w-12 mx-auto text-muted" />
            <p className="text-sm text-secondary">BT 种子下载功能正在开发中</p>
            <p className="text-xs text-muted">敬请期待...</p>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
