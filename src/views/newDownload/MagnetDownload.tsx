import { Magnet } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    TooltipProvider,
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from "@/components/ui/tooltip";

/**
 * 磁力链接下载模式组件（开发中）
 * 
 * 当前显示占位提示，后续将实现磁力链接解析和下载功能
 */
export function MagnetDownload() {
    return (
        <TooltipProvider>
            <div className="flex flex-col gap-4">
                {/* A. 下载类型 Tabs */}
                <div>
                    <Label className="mb-2 block text-xs text-slate-500 dark:text-slate-400">
                        下载类型
                    </Label>
                    <Tabs value="magnet" className="w-full">
                        <TabsList className="w-full">
                            {/* URL 下载 — 开发中，禁用 */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="inline-flex flex-1 cursor-not-allowed">
                                        <TabsTrigger
                                            value="url"
                                            disabled
                                            className="flex-1 gap-1.5 text-slate-400 dark:text-slate-500"
                                        >
                                            URL 下载
                                        </TabsTrigger>
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>该功能正在开发中</p>
                                </TooltipContent>
                            </Tooltip>

                            {/* BT 种子 — 开发中，禁用 */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="inline-flex flex-1 cursor-not-allowed">
                                        <TabsTrigger
                                            value="bt"
                                            disabled
                                            className="flex-1 gap-1.5 text-slate-400 dark:text-slate-500"
                                        >
                                            BT 种子
                                        </TabsTrigger>
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>该功能正在开发中</p>
                                </TooltipContent>
                            </Tooltip>

                            {/* 磁力链接 — 当前选中模式 */}
                            <TabsTrigger value="magnet" className="flex-1 gap-1.5">
                                <Magnet className="h-4 w-4" />
                                磁力链接
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {/* B. 占位内容 */}
                <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-2">
                        <Magnet className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600" />
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            磁力链接下载功能正在开发中
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            敬请期待...
                        </p>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}
