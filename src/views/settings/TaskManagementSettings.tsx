import { useState, type KeyboardEvent } from "react";
import { X, Plus, Pencil, Trash2, FolderOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
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
import { useSettingsStore } from "@/store/settingsStore";
import type { Category } from "@/types";

// ============================================================
// 下拉选项常量
// ============================================================

/** 分类图标选项 */
const ICON_OPTIONS = [
  { value: "film" as const, label: "视频" },
  { value: "archive" as const, label: "压缩包" },
  { value: "package" as const, label: "软件包" },
  { value: "disc" as const, label: "光盘" },
  { value: "file-text" as const, label: "文件" },
  { value: "folder" as const, label: "文件夹" },
];

/** 完成后操作选项 */
const POST_ACTION_OPTIONS = [
  { value: "none" as const, label: "不执行操作" },
  { value: "openFile" as const, label: "打开文件" },
  { value: "openFolder" as const, label: "打开文件夹" },
  { value: "extract" as const, label: "解压至指定目录" },
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

/** Tag 输入组件 — 支持回车添加标签，X 删除标签，显示为 Pill */
function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      if (!value.includes(inputValue.trim())) {
        onChange([...value, inputValue.trim()]);
      }
      setInputValue("");
    }
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
      </div>
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? "输入后回车添加"}
        className="h-8 text-sm"
      />
    </div>
  );
}

// ============================================================
// 分类弹窗子组件
// ============================================================

/** 空表单的默认值 */
function emptyCategory(): Category {
  return {
    id: "",
    name: "",
    icon: "folder",
    defaultPath: "D:/Downloads/",
    postAction: "none",
    fileExtensions: [],
    labels: [],
  };
}

interface CategoryDialogProps {
  /** 弹窗是否打开 */
  open: boolean;
  /** 编辑时传入已有分类数据；新建时传入 null */
  initialData: Category | null;
  /** 关闭回调 */
  onClose: () => void;
}

/**
 * 新建 / 编辑分类弹窗
 *
 * 包含分类名称、图标、默认保存路径、完成后动作、关联文件后缀、关联标签。
 * 新建时 id 留空（后端生成），编辑时使用已有 id。
 */
function CategoryDialog({ open, initialData, onClose }: CategoryDialogProps) {
  const { toast } = useToast();
  const upsertCategory = useSettingsStore((s) => s.upsertCategory);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<Category>(() =>
    initialData ? { ...initialData } : emptyCategory(),
  );

  // 弹窗打开时同步 initialData
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && initialData) {
      setForm({ ...initialData });
    } else if (isOpen && !initialData) {
      setForm(emptyCategory());
    }
    if (!isOpen) onClose();
  };

  /** 更新单个表单字段 */
  const updateField = <K extends keyof Category>(
    key: K,
    value: Category[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  /** 提交保存 */
  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "请输入分类名称", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await upsertCategory({
        ...form,
        // 新建时生成临时 ID，后端会替换
        id: form.id || `user-cat-${Date.now()}`,
      });
      toast({ title: initialData ? "分类已更新" : "分类已添加" });
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
            {initialData ? "编辑分类" : "新建分类"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* 分类名称 */}
          <div className="space-y-1.5">
            <Label className="text-sm">分类名称</Label>
            <Input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="输入分类名称"
            />
          </div>

          {/* 图标 */}
          <div className="space-y-1.5">
            <Label className="text-sm">图标</Label>
            <Select
              value={form.icon ?? "folder"}
              onValueChange={(v) => updateField("icon", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ICON_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 默认保存路径 */}
          <div className="space-y-1.5">
            <Label className="text-sm">默认保存路径</Label>
            <div className="flex items-center gap-2">
              <Input
                value={form.defaultPath}
                onChange={(e) => updateField("defaultPath", e.target.value)}
                placeholder="D:/Downloads/"
                className="flex-1"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="outline" size="icon" className="shrink-0">
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>浏览文件夹功能正在开发中</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* 完成后动作 */}
          <div className="space-y-1.5">
            <Label className="text-sm">完成后动作</Label>
            <Select
              value={form.postAction}
              onValueChange={(v) =>
                updateField("postAction", v as Category["postAction"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POST_ACTION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 关联文件后缀 */}
          <div className="space-y-1.5">
            <Label className="text-sm">关联文件后缀</Label>
            <TagInput
              value={form.fileExtensions}
              onChange={(v) => updateField("fileExtensions", v)}
              placeholder="输入后缀名后回车，如 .mp4"
            />
          </div>

          {/* 关联标签 */}
          <div className="space-y-1.5">
            <Label className="text-sm">关联标签</Label>
            <TagInput
              value={form.labels}
              onChange={(v) => updateField("labels", v)}
              placeholder="输入标签名后回车"
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
// 任务管理设置表单
// ============================================================

/**
 * 任务管理设置表单组件
 *
 * 包含分类列表的表格展示、新建/编辑分类弹窗。
 * 预设分类（id 以 "cat-" 开头）不可删除。
 */
export function TaskManagementSettings() {
  const { toast } = useToast();
  const categories = useSettingsStore((s) => s.categories);
  const deleteCategory = useSettingsStore((s) => s.deleteCategory);

  /** 弹窗状态 */
  const [dialogOpen, setDialogOpen] = useState(false);
  /** 编辑时传入数据，null 表示新建 */
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  /** 是否为预设分类 */
  const isPreset = (id: string) => id.startsWith("cat-");

  /** 打开新建弹窗 */
  const handleAdd = () => {
    setEditingCategory(null);
    setDialogOpen(true);
  };

  /** 打开编辑弹窗 */
  const handleEdit = (cat: Category) => {
    setEditingCategory(cat);
    setDialogOpen(true);
  };

  /** 删除分类 */
  const handleDelete = async (cat: Category) => {
    if (isPreset(cat.id)) return;
    try {
      await deleteCategory(cat.id);
      toast({ title: `已删除分类：${cat.name}` });
    } catch {
      toast({ title: "删除失败", description: "请稍后重试", variant: "destructive" });
    }
  };

  /** 获取完成后动作的显示文本 */
  const getPostActionLabel = (action: Category["postAction"]): string => {
    return POST_ACTION_OPTIONS.find((o) => o.value === action)?.label ?? action;
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* ================================================ */}
        {/* 分类列表 */}
        {/* ================================================ */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <SectionTitle>分类列表</SectionTitle>
            <Button size="sm" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-1" />
              添加分类
            </Button>
          </div>

          {categories.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">名称</TableHead>
                  <TableHead>默认路径</TableHead>
                  <TableHead>关联后缀</TableHead>
                  <TableHead className="w-[120px]">完成后操作</TableHead>
                  <TableHead className="w-[100px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium text-slate-700 dark:text-slate-300">
                      {cat.name}
                    </TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400 text-xs truncate max-w-[180px]">
                      {cat.defaultPath}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {cat.fileExtensions.slice(0, 3).map((ext) => (
                          <span
                            key={ext}
                            className="inline-block px-1.5 py-0.5 text-xs rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          >
                            {ext}
                          </span>
                        ))}
                        {cat.fileExtensions.length > 3 && (
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            +{cat.fileExtensions.length - 3}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                      {getPostActionLabel(cat.postAction)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(cat)}
                          className="h-7 px-2 text-xs"
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          编辑
                        </Button>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(cat)}
                              disabled={isPreset(cat.id)}
                              className="h-7 px-2 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              删除
                            </Button>
                          </TooltipTrigger>
                          {isPreset(cat.id) && (
                            <TooltipContent>
                              <p>预设分类不可删除</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">
              暂无分类，点击上方"添加分类"创建
            </p>
          )}
        </section>

        {/* ================================================ */}
        {/* 新建/编辑分类弹窗 */}
        {/* ================================================ */}
        <CategoryDialog
          open={dialogOpen}
          initialData={editingCategory}
          onClose={() => setDialogOpen(false)}
        />
      </div>
    </TooltipProvider>
  );
}
