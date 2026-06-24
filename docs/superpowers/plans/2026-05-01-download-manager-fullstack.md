# 下载管理器 — 全栈实施计划

> **面向自动化执行说明：** 推荐使用 superpowers:subagent-driven-development 执行此计划。每步骤使用 `- [ ]` 追踪进度。

**目标：** 基于 Tauri v2 构建完整的多线程异步下载管理器桌面应用，React 前端（含模拟数据模式）+ Rust 后端。

**架构：** 三阶段顺序开发。阶段一：前端完整 UI + VITE_MOCK 模拟数据；阶段二：Rust 后端核心引擎 + Tauri commands；阶段三：前后端联调集成。

**技术栈：** React 18 + TypeScript, shadcn/ui, Tailwind CSS, Zustand, Tauri v2, Rust, tokio, reqwest, rusqlite

---

## 文件结构映射

### 前端新建

| 文件 | 职责 |
|------|------|
| `src/types/index.ts` | TypeScript 接口定义，与 Rust struct 同步 |
| `src/api/tasks.ts` | 任务 invoke 封装 + mock 分流 |
| `src/api/settings.ts` | 设置 invoke 封装 + mock 分流 |
| `src/api/site.ts` | 站点 invoke 封装 + mock 分流 |
| `src/api/queues.ts` | 队列 invoke 封装 + mock 分流 |
| `src/api/system.ts` | 系统 invoke 封装 + mock 分流 |
| `src/store/taskStore.ts` | Zustand — 任务列表、筛选、排序 |
| `src/store/downloadStore.ts` | Zustand — 速度、历史、磁盘 |
| `src/store/settingsStore.ts` | Zustand — 配置、分类 |
| `src/contexts/ThemeContext.tsx` | React Context — 深色/浅色模式 |
| `src/components/ui/*.tsx` | shadcn/ui 原语（button/input/dialog/select/tabs/table/progress/context-menu/toast/tooltip/label/switch/scroll-area） |
| `src/components/Sidebar.tsx` | 左侧边栏 |
| `src/components/Toolbar.tsx` | 顶部工具栏 |
| `src/components/TaskTable.tsx` | 任务列表表格 |
| `src/components/TaskRow.tsx` | 单行任务 |
| `src/components/DetailPanel.tsx` | 底部详情面板 |
| `src/components/GlobalStats.tsx` | 右下角全局统计 |
| `src/components/SpeedChart.tsx` | SVG 速度折线图 |
| `src/views/MainPage.tsx` | 主页面布局 |
| `src/views/NewDownloadDialog.tsx` | 新建下载弹窗 |
| `src/views/SettingsDialog.tsx` | 设置弹窗框架 |
| `src/views/settings/DownloadSettings.tsx` | 下载设置表单 |
| `src/views/settings/SpeedSettings.tsx` | 速度设置表单 |
| `src/views/settings/TaskManagementSettings.tsx` | 任务管理设置 |
| `src/views/settings/SiteManagementSettings.tsx` | 站点管理表单 |
| `src/views/settings/PlaceholderSettings.tsx` | TODO 占位设置 |
| `src/mocks/data/*.json` | 模拟数据（6 个 JSON 文件） |
| `src/mocks/handlers.ts` | 模拟 API 处理器 |
| `src/mocks/index.ts` | 统一导出 |

### 前端修改

| 文件 | 变更 |
|------|------|
| `src/App.tsx` | 替换模板，引入 ThemeProvider + MainPage |
| `src/main.tsx` | 引入全局 CSS |
| `src/App.css` | 替换为 Tailwind + CSS 变量 |
| `index.html` | 标题改为"下载管理器" |
| `package.json` | 添加依赖 |
| `vite.config.ts` | 路径别名 `@/` + Tailwind 插件 |
| `tsconfig.json` | 路径映射 |
| `.env` | `VITE_MOCK=true` |

### 后端新建

| 文件 | 职责 |
|------|------|
| `models/task.rs`, `settings.rs`, `site.rs`, `queue.rs` | Rust 数据结构 |
| `db/mod.rs` | 数据库连接池、迁移 |
| `db/tasks.rs`, `checkpoints.rs`, `queues.rs`, `categories.rs`, `site_auth.rs`, `speed_policy.rs` | 各表 CRUD |
| `config/mod.rs` | JSON 配置读写 |
| `core/engine.rs` | 下载引擎调度 |
| `core/chunker.rs` | HEAD 探测 + 分块 |
| `core/worker.rs` | 分块异步下载 |
| `core/merger.rs` | 文件合并 |
| `core/limiter.rs` | 令牌桶限速器 |
| `core/verifier.rs` | 哈希校验 |
| `commands/tasks.rs`, `settings.rs`, `site.rs`, `queues.rs`, `system.rs` | Tauri commands |

---

## 阶段一：前端开发（模拟数据驱动）

### Task 1: 基础设施配置

**文件：** 修改 `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/App.css`；新建 `.env`

- [ ] **步骤 1：安装依赖**

```bash
cd d:/Code/Github/download-manager
npm install zustand @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-context-menu @radix-ui/react-tooltip lucide-react class-variance-authority clsx tailwind-merge
npm install -D tailwindcss @tailwindcss/vite
```

- [ ] **步骤 2：更新 vite.config.ts**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(async () => ({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  clearScreen: false,
  server: { port: 1420, strictPort: true, host: host || false, hmr: host ? { protocol: "ws", host, port: 1421 } : undefined, watch: { ignored: ["**/src-tauri/**"] } },
}));
```

- [ ] **步骤 3：更新 tsconfig.json — 添加** `"baseUrl": ".", "paths": { "@/*": ["./src/*"] }`
- [ ] **步骤 4：更新 index.html title** 为 `<title>下载管理器</title>`
- [ ] **步骤 5：更新 src/App.css** 替换为 Tailwind 指令 + CSS 变量（深色/浅色主题，参考设计文档 Section 3 中的完整 CSS）
- [ ] **步骤 6：新建 .env** 内容 `VITE_MOCK=true`
- [ ] **步骤 7：提交**

```bash
git add package.json vite.config.ts tsconfig.json index.html src/App.css .env
git commit -m "chore: 配置 Tailwind CSS、路径别名及项目基础设施"
```

---

### Task 2: TypeScript 类型定义

**文件：** 新建 `src/types/index.ts`

- [ ] **步骤 1：写入完整类型定义**

```typescript
// 任务状态枚举
export type TaskStatus = "Pending" | "Downloading" | "Paused" | "Completed" | "Error" | "Merging" | "Checking";

// 下载任务
export interface DownloadTask {
  id: string; url: string; filename: string; status: TaskStatus;
  savePath: string; queueId: string; categoryId?: string;
  threadCount: number; totalSize: number; downloadedSize: number;
  supportsRanges?: boolean; expectedHash?: string; errorCode?: string;
  createdAt: number; startedAt?: number; completedAt?: number;
}

// 线程信息（前端展示用）
export interface ThreadInfo {
  chunkIndex: number; startByte: number; endByte: number;
  downloadedOffset: number; speed: number;
  status: "idle" | "downloading" | "completed";
}

// 日志条目
export interface TaskLog {
  timestamp: number; level: "info" | "warn" | "error"; message: string;
}

// 任务详情
export interface TaskDetail extends DownloadTask {
  threads: ThreadInfo[]; logs: TaskLog[];
}

// 创建任务请求
export interface CreateTaskPayload {
  url: string; filename?: string; savePath: string; queueId: string;
  threadCount?: number; enableResume?: boolean; autoStart?: boolean;
  enableIntegrityCheck?: boolean;
}

// 队列
export interface Queue { id: string; name: string; sortWeight: number; icon?: string; }

// 分类
export interface Category {
  id: string; name: string; icon?: string; defaultPath: string;
  postAction: "none" | "openFile" | "openFolder" | "extract";
  fileExtensions: string[]; labels: string[];
}

// 站点认证
export interface SiteAuth {
  id: string; siteName: string; domainPattern: string;
  cookies?: string; customUa?: string; referer?: string;
  quotaTotal?: number; quotaUsed: number;
  loginStatus: "unknown" | "logged_in" | "expired" | "error";
}

// 速度策略
export interface SpeedPolicy {
  id: string; name: string; downloadLimit?: number; uploadLimit?: number;
  mode: "global" | "even" | "unlimited"; schedule?: string; isActive: boolean;
}

// 应用配置
export interface AppConfig {
  download: DownloadSettings; speed: SpeedSettings; theme: "dark" | "light";
}

export interface DownloadSettings {
  defaultPath: string; maxConcurrentTasks: number; maxThreadsPerTask: number;
  enableResume: boolean; postDownloadAction: "notify" | "openFolder" | "shutdown";
  fileConflictPolicy: "ask" | "overwrite" | "rename";
  autoCreateSubdir: boolean; monitorClipboard: boolean;
}

export interface SpeedSettings {
  downloadLimit?: number; uploadLimit?: number;
  speedMode: "unlimited" | "custom" | "smart";
  allocationMode: "global" | "even";
  smartAcceleration: boolean; accelerationThreshold: number;
  applyLimitOnStartup: boolean; whitelistTaskIds: string[];
}

export interface DiskInfo { total: number; free: number; used: number; }
export interface SpeedDataPoint { time: number; downSpeed: number; upSpeed: number; }
export type TaskFilter = TaskStatus | "all";

export interface NewDownloadForm {
  url: string; filename: string; savePath: string; queueId: string;
  threadCount: number; enableResume: boolean; autoStart: boolean;
  enableIntegrityCheck: boolean;
}
```

- [ ] **步骤 2：验证 `npx tsc --noEmit`**
- [ ] **步骤 3：提交**

```bash
git add src/types/index.ts
git commit -m "feat: 添加 TypeScript 类型定义，与 Rust 数据结构保持一致"
```

---

### Task 3: shadcn/ui 原语组件

**文件：** 新建 `src/lib/utils.ts` + `src/components/ui/` 下的 13 个组件文件

- [ ] **步骤 1：创建 `src/lib/utils.ts`**

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
```

- [ ] **步骤 2-14：逐个创建以下 UI 组件**（均使用 `"use client"`，基于 Radix 原语 + `cn()`）

每个组件需要创建对应的 `.tsx` 文件：
- `button.tsx` — 使用 `cva` 定义 variants（default/destructive/outline/ghost/link + 4 sizes）
- `input.tsx` — 标准 input 封装
- `dialog.tsx` — 基于 `@radix-ui/react-dialog`（Overlay/Content/Header/Title/Description）
- `select.tsx` — 基于 `@radix-ui/react-select`（Trigger/Content/Item）
- `tabs.tsx` — 基于 `@radix-ui/react-tabs`（List/Trigger/Content）
- `table.tsx` — 标准 table 封装（Table/Header/Body/Row/Head/Cell）
- `progress.tsx` — 进度条（value/max 百分比渲染）
- `context-menu.tsx` — 基于 `@radix-ui/react-context-menu`（Content/Item/Separator）
- `toast.tsx` + `toaster.tsx` — 全局 toast 通知系统（addToast/removeToast + useToast hook）
- `tooltip.tsx` — 基于 `@radix-ui/react-tooltip`
- `label.tsx` — 标准 label 封装
- `switch.tsx` — 自定义 switch（无 Radix 依赖，纯 CSS transition）
- `scroll-area.tsx` — overflow-auto 容器

具体代码参考设计文档中 Section 3 的完整组件实现。

- [ ] **步骤 15：验证 `npx tsc --noEmit`**
- [ ] **步骤 16：提交**

```bash
git add src/lib/ src/components/ui/
git commit -m "feat: 添加 shadcn/ui 原语组件及工具函数"
```

---

### Task 4: 模拟数据层

**文件：** 新建 `src/mocks/data/` 下 6 个 JSON + `src/mocks/handlers.ts` + `src/mocks/index.ts`

- [ ] **步骤 1-6：创建 JSON 数据文件**

按设计文档 Section 4 中定义的完整数据创建：
- `src/mocks/data/tasks.json` — 12 条任务（覆盖 Pending/Downloading/Paused/Completed/Error 所有状态）
- `src/mocks/data/categories.json` — 6 个预设分类
- `src/mocks/data/queues.json` — 4 个队列
- `src/mocks/data/sites.json` — 3 个站点
- `src/mocks/data/settings.json` — 默认应用配置
- `src/mocks/data/speedHistory.json` — 30 个速度数据点

- [ ] **步骤 7：创建 `src/mocks/handlers.ts`**

包含所有模拟 API 处理器函数（每个函数含 100-300ms 随机延迟）：
- 任务：`getTasksMock`, `getTaskDetailMock`, `createTaskMock`, `pauseTaskMock`, `resumeTaskMock`, `deleteTaskMock`, `retryTaskMock`
- 设置：`getSettingsMock`, `updateSettingsMock`, `getCategoriesMock`, `upsertCategoryMock`, `deleteCategoryMock`
- 站点：`getSitesMock`, `addSiteMock`, `updateSiteMock`, `deleteSiteMock`
- 队列：`getQueuesMock`, `createQueueMock`, `deleteQueueMock`
- 系统：`getDiskSpaceMock`, `getSpeedHistoryMock`

所有函数操作内存中的可变数据副本（`let tasks/categories/queues/sites/settings`），模拟真实 CRUD 行为。

具体实现参考设计文档 Section 4 中的完整 handlers.ts 代码。

- [ ] **步骤 8：创建 `src/mocks/index.ts`** — 统一 re-export 所有 handlers
- [ ] **步骤 9：验证 `npx tsc --noEmit`**
- [ ] **步骤 10：提交**

```bash
git add src/mocks/
git commit -m "feat: 添加模拟数据层，含 12 条示例任务及完整 CRUD 模拟处理器"
```

---

### Task 5: API 层（invoke 封装 + Mock 分流）

**文件：** 新建 `src/api/tasks.ts`, `settings.ts`, `site.ts`, `queues.ts`, `system.ts`

- [ ] **步骤 1-5：创建 5 个 API 文件**

每个 API 函数遵循同一模式：
```typescript
import { invoke } from "@tauri-apps/api/core";
import { xxxMock } from "@/mocks/handlers";
const USE_MOCK = import.meta.env.VITE_MOCK === "true";

export async function someApi(params): Promise<ReturnType> {
  if (USE_MOCK) return xxxMock(params);
  return invoke("backend_command", { params });
}
```

具体函数列表见设计文档 Section 5 的 Tauri Command Interface 表格（18 个前端函数）。

- [ ] **步骤 6：验证 `npx tsc --noEmit`**
- [ ] **步骤 7：提交**

```bash
git add src/api/
git commit -m "feat: 添加 API 层，统一封装 Tauri invoke 并支持 VITE_MOCK 分流"
```

---

### Task 6: 状态管理（Zustand + Context）

**文件：** 新建 `src/store/taskStore.ts`, `downloadStore.ts`, `settingsStore.ts`, `src/contexts/ThemeContext.tsx`

- [ ] **步骤 1：创建 taskStore** — 管理 tasks 数组、activeTask、filter、selectedQueue、sortField/Direction，含 `fetchTasks`/`addTask`/`pauseTask`/`resumeTask`/`deleteTask`/`retryTask` 等 action
- [ ] **步骤 2：创建 downloadStore** — 管理 globalDownSpeed/UpSpeed、speedHistory[60]、diskInfo，含 `initSpeedHistory`/`fetchDiskSpace` action
- [ ] **步骤 3：创建 settingsStore** — 管理 config（AppConfig）、categories，含 `fetchSettings`/`updateSettings`/`upsertCategory`/`deleteCategory` action
- [ ] **步骤 4：创建 ThemeContext** — `ThemeProvider` 包裹组件，读写 `document.documentElement.classList.toggle("dark")` 和 `localStorage`
- [ ] **步骤 5：验证 `npx tsc --noEmit`**
- [ ] **步骤 6：提交**

```bash
git add src/store/ src/contexts/
git commit -m "feat: 添加 Zustand 状态管理及 Theme Context"
```

---

### Task 7: 应用外壳（App.tsx + MainPage 骨架）

**文件：** 修改 `src/App.tsx`, `src/main.tsx`；新建 `src/views/MainPage.tsx`（骨架）

- [ ] **步骤 1：修改 `src/App.tsx`**

```typescript
import { ThemeProvider } from "@/contexts/ThemeContext";
import { MainPage } from "@/views/MainPage";
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <ThemeProvider>
      <MainPage />
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
```

- [ ] **步骤 2：修改 `src/main.tsx`** — 替换模板内容，导入 `./App.css` 和 `App`
- [ ] **步骤 3：创建 `src/views/MainPage.tsx`** 骨架（带占位文字）
- [ ] **步骤 4：运行 `npm run tauri dev`** 验证窗口打开
- [ ] **步骤 5：提交**

```bash
git add src/App.tsx src/main.tsx src/views/MainPage.tsx
git commit -m "feat: 配置应用外壳，集成 ThemeProvider 和主页面骨架"
```

---

### Task 8: 侧边栏组件 (Sidebar)

**文件：** 新建 `src/components/Sidebar.tsx`, 修改 `src/views/MainPage.tsx`

- [ ] **步骤 1：创建 Sidebar** — 包含：
  - 状态统计区：5 个过滤按钮（全部/下载中/已暂停/已完成/错误），使用 `lucide-react` 图标，点击调用 `setFilter` + `fetchTasks`
  - 队列管理区：从 API 获取队列列表，选中高亮，支持取消选中
  - 工具区：计划任务/速度限制/站点管理/下载设置，点击打开设置弹窗并定位到对应 tab
  - 底部主题切换按钮

完整代码参考设计文档 Section 2 中的 Sidebar 实现。

- [ ] **步骤 2：更新 MainPage** — 集成 Sidebar，添加 Toolbar/TaskTable/DetailPanel/GlobalStats/NewDownloadDialog/SettingsDialog 的占位引用和状态管理
- [ ] **步骤 3：验证编译后提交**

```bash
git add src/components/Sidebar.tsx src/views/MainPage.tsx
git commit -m "feat: 实现侧边栏组件，含状态过滤、队列选择、工具链接和主题切换"
```

---

### Task 9: 顶部工具栏 (Toolbar)

**文件：** 新建 `src/components/Toolbar.tsx`，修改 `src/views/MainPage.tsx`

- [ ] **步骤 1：创建 Toolbar** — 包含：
  - 操作按钮组：新建下载（蓝色主按钮）、开始、暂停、删除、刷新
  - 搜索输入框（带防抖 300ms）
  - 设置按钮（齿轮图标）
  - 所有按钮使用 shadcn Button 组件 + lucide-react 图标

```typescript
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Play, Pause, Trash2, RefreshCw, Search, Settings } from "lucide-react";

interface ToolbarProps {
  onNewDownload: () => void;
  onOpenSettings: () => void;
}

export function Toolbar({ onNewDownload, onOpenSettings }: ToolbarProps) {
  // 搜索框本地状态 + 防抖
  // 操作按钮调用 taskStore actions
  // 全部使用 Tooltip 包裹以显示提示文字
}
```

- [ ] **步骤 2：MainPage 中集成 Toolbar** — 传递 `onNewDownload` 和 `onOpenSettings` 回调
- [ ] **步骤 3：验证编译后提交**

```bash
git add src/components/Toolbar.tsx src/views/MainPage.tsx
git commit -m "feat: 实现顶部工具栏，含操作按钮、搜索和设置入口"
```

---

### Task 10: 任务列表表格 (TaskTable + TaskRow)

**文件：** 新建 `src/components/TaskTable.tsx`, `src/components/TaskRow.tsx`

- [ ] **步骤 1：创建 TaskTable**

使用 shadcn Table 组件，列定义：
- 文件名（可排序）、大小（格式化）、进度条、实时速度（格式化）、剩余时间、状态（彩色标签）、线程数
- 表头支持点击排序（调用 `setSortField` + `toggleSortDirection`）
- 行点击调用 `setActiveTask` + `fetchTaskDetail`
- 使用 `useEffect` 在组件挂载时调用 `fetchTasks()`
- 使用 `useTaskStore` 获取 tasks, isLoading, filter, selectedQueueId

- [ ] **步骤 2：创建 TaskRow**

单行渲染逻辑：
- 文件图标根据扩展名动态切换（`lucide-react` 图标）
- 进度条使用 shadcn Progress 组件，显示百分比文字
- 速度格式化：`< 1MB/s` 显示 KB/s，`>= 1MB/s` 显示 MB/s
- 剩余时间计算：`(totalSize - downloadedSize) / currentSpeed`
- 状态标签：Pending=灰色, Downloading=蓝色, Paused=黄色, Completed=绿色, Error=红色
- 使用 shadcn ContextMenu 包裹整行实现右键菜单

- [ ] **步骤 3：右键菜单项** — 打开文件夹、复制链接、重新校验、更改分类、删除任务
- [ ] **步骤 4：验证编译后提交**

```bash
git add src/components/TaskTable.tsx src/components/TaskRow.tsx
git commit -m "feat: 实现任务列表表格及行组件，含排序、进度条和右键菜单"
```

---

### Task 11: 底部详情面板 (DetailPanel)

**文件：** 新建 `src/components/DetailPanel.tsx`

- [ ] **步骤 1：创建 DetailPanel**

当 `activeTaskId` 不为 null 时从底部滑入（`transition-all` + `max-h` 动画），默认高度约 200px，可拖拽调整。
包含 4 个 Tabs：

1. **任务详情** — URL、保存路径、创建时间、开始时间、MD5/SHA、错误码（如有）
2. **线程信息** — 可视化展示各线程：chunk 序号、下载区间、进度条、当前速度、状态标签
3. **文件列表** — 预留 BT 文件树位置，当前显示"仅支持 URL 下载模式"
4. **日志** — 时间线列表，info 灰色/warn 黄色/error 红色

顶部有关闭按钮（`X`），调用 `clearActiveTask()`。

- [ ] **步骤 2：验证编译后提交**

```bash
git add src/components/DetailPanel.tsx
git commit -m "feat: 实现底部任务详情面板，含四个选项卡和动画"
```

---

### Task 12: 全局统计区 (GlobalStats + SpeedChart)

**文件：** 新建 `src/components/GlobalStats.tsx`, `src/components/SpeedChart.tsx`

- [ ] **步骤 1：创建 SpeedChart**

SVG 折线图组件：
- 使用 `useDownloadStore` 的 `speedHistory` 数据
- SVG viewBox 绘制：背景网格线（虚线）、下载速度折线（蓝色）、上传速度折线（绿色）
- 底部 X 轴标签（秒）、左侧 Y 轴标签（自动格式化 MB/s）
- 组件挂载时调用 `initSpeedHistory()` 加载模拟历史数据
- 宽度自适应容器

- [ ] **步骤 2：创建 GlobalStats**

固定于主页面右下角，包含：
- 全局下载速率（大号数字 + "MB/s" 后缀，实时刷新）
- 全局上传速率
- SpeedChart 组件
- 磁盘空间指示条：D 盘图标 + 进度条（已用/剩余）+ 剩余空间文字
- 挂载时调用 `fetchDiskSpace("D:/")`

- [ ] **步骤 3：验证编译后提交**

```bash
git add src/components/GlobalStats.tsx src/components/SpeedChart.tsx
git commit -m "feat: 实现全局统计区，含实时速率图和磁盘空间指示"
```

---

### Task 13: 新建下载弹窗 (NewDownloadDialog)

**文件：** 新建 `src/views/NewDownloadDialog.tsx`

- [ ] **步骤 1：创建表单组件**

使用 shadcn Dialog 组件：
- **下载类型 Tab：** URL 下载（当前激活）、BT 种子（灰色不可点击，TODO）、磁力链接（灰色不可点击，TODO）
- **URL 输入框：** 自动填入剪贴板内容（如果是合法 URL）
- **文件名：** 可选，自动从 URL 解析
- **保存路径：** 输入框 + "浏览"按钮（当前显示 settings.defaultPath）
- **队列选择：** 下拉框，从 API 获取队列列表
- **高级选项（折叠区域）：**
  - 线程数：数字输入 1-32
  - 断点续传：Switch 开关
  - 自动开始：Switch 开关
  - 完整性校验：Switch 开关
- **底部按钮：** "取消" (ghost) + "立即下载" (primary)

表单状态使用本地 `useState<NewDownloadForm>`，提交时调用 `taskStore.addTask()` + `toast("任务已创建")`。

- [ ] **步骤 2：验证编译后提交**

```bash
git add src/views/NewDownloadDialog.tsx
git commit -m "feat: 实现新建下载弹窗，含 URL 模式、剪贴板识别和高级选项"
```

---

### Task 14: 设置弹窗框架 + 下载设置

**文件：** 新建 `src/views/SettingsDialog.tsx`, `src/views/settings/DownloadSettings.tsx`, `src/views/settings/PlaceholderSettings.tsx`

- [ ] **步骤 1：创建 SettingsDialog 框架**

非模态 Dialog（可拖拽），左侧导航列表 + 右侧表单区：
```
左侧导航项（含图标）：
- 下载设置 (Download) → 核心实现
- 连接设置 (Wifi) → TODO 占位
- 速度设置 (Zap) → 核心实现
- 任务管理 (FolderKanban) → 核心实现
- 界面设置 (Layout) → TODO 占位
- 通知设置 (Bell) → TODO 占位
- BT 设置 (Network) → TODO 占位
- 高级设置 (Cpu) → TODO 占位
- 其他设置 (Ellipsis) → TODO 占位
- 站点管理 (Globe) → 核心实现
```

使用 Tabs 组件实现导航，`initialTab` prop 控制默认选中。

- [ ] **步骤 2：创建 PlaceholderSettings**

```typescript
export function PlaceholderSettings({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
      <p className="text-lg">该功能正在开发中</p>
      <p className="text-sm mt-2">"{title}"设置项将在后续版本中完善</p>
    </div>
  );
}
```

- [ ] **步骤 3：创建 DownloadSettings 表单**

包含以下表单组（使用 shadcn Label + Input + Select + Switch）：
- 默认下载路径（Input + 浏览按钮）
- 同时下载任务数上限（Select: 1-10）
- 单任务最大线程数（Select: 1-128）
- 断点续传（Switch）
- 下载完成后操作（Select: 通知/打开文件夹/自动关机）
- 文件冲突处理（Select: 询问/覆盖/重命名）
- 按任务名创建子文件夹（Switch）
- 剪贴板监控（Switch）
- 浏览器扩展区域（显示安装状态 + 安装按钮，点击无效——TODO）
- 文件关联区域（Checkbox 列表：.zip/.rar/.iso/.mp4 等）

保存按钮调用 `settingsStore.updateSettings()`。

- [ ] **步骤 4：验证编译后提交**

```bash
git add src/views/SettingsDialog.tsx src/views/settings/
git commit -m "feat: 实现设置弹窗框架和下载设置表单"
```

---

### Task 15: 速度设置 + 任务管理设置 + 站点管理设置

**文件：** 新建 `src/views/settings/SpeedSettings.tsx`, `TaskManagementSettings.tsx`, `SiteManagementSettings.tsx`

- [ ] **步骤 1：创建 SpeedSettings**

表单内容：
- 上传/下载速度独立输入（数字 + 单位 Select: KB/s / MB/s / 不限）
- 三档模式 Radio：不限速 / 自定义限制 / 智能限速
- 限速分配模式 Radio：全局限速 / 均分限速
- 智能加速 Switch + 阈值滑块（默认 10%）
- 启动时应用限速 Switch
- 白名单管理：当前活跃任务列表（Checkbox），选中任务不受限速

- [ ] **步骤 2：创建 TaskManagementSettings**

表单内容：
- 分类列表（Table 展示）：名称、图标、默认路径、关联后缀（标签）、操作按钮（编辑/删除）
- 新建/编辑分类弹窗：名称 Input、图标 Select、默认路径 Input + 浏览、完成后动作 Select（不操作/打开文件/打开文件夹/解压）、关联后缀 TagInput（支持多个后缀，X 删除标签）
- "添加分类"按钮 + 新弹窗
- 编辑时内联展开或弹窗
- 预设分类不可删除（视频、压缩、软件、镜像、文档、其他）

- [ ] **步骤 3：创建 SiteManagementSettings**

表单内容：
- 站点列表（Table）：站点名称、匹配规则、登录状态（绿色/灰色/红色标签）、已用配额/总配额、操作（编辑/删除）
- 顶部"添加站点"按钮 → 弹窗
- 添加/编辑站点弹窗：站点名称 Input、匹配规则 Input（placeholder: `*.baidu.com`）、Cookie 输入框（密码遮蔽）、自定义 User-Agent Input、Referer Input
- 全局下载规则区域：默认 Referer Input、默认 User-Agent Input、辅助功能（自动识别直链 Switch、自动带入 Cookie Switch、启用重定向追踪 Switch）

- [ ] **步骤 4：验证编译后提交**

```bash
git add src/views/settings/
git commit -m "feat: 实现速度设置、任务管理设置和站点管理设置表单"
```

---

### Task 16: 前端收尾—集成测试 + UI 打磨

- [ ] **步骤 1：运行 `npm run tauri dev`** 启动完整应用
- [ ] **步骤 2：手动验证以下流程：**
  - 侧边栏过滤切换 → 表格数据正确筛选
  - 新建下载 → 弹窗打开 → 填写 → 提交 → toast 提示 → 任务出现在列表
  - 任务行点击 → 底部详情面板滑出 → 切换 4 个 tab
  - 右键任务行 → 菜单弹出 → 点击删除 → 任务消失
  - 设置弹窗 → 切换左侧导航 → 核心设置页显示表单，TODO 页显示占位
  - 深色/浅色模式切换 → 全局主题正确变化
  - 全局统计区显示速度图表和磁盘空间
- [ ] **步骤 3：修复发现的问题**
- [ ] **步骤 4：提交**

```bash
git add -A
git commit -m "feat: 前端开发完成，含完整 UI 和模拟数据模式"
```

---

## 阶段二：后端开发（Rust）

### Task 17: Rust 依赖与模型定义

**文件：** 修改 `src-tauri/Cargo.toml`, `src-tauri/src/lib.rs`；新建 `src-tauri/src/models/task.rs`, `settings.rs`, `site.rs`, `queue.rs`

- [ ] **步骤 1：更新 Cargo.toml 添加依赖**

```toml
[dependencies]
tauri = { version = "2", features = [] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["full"] }
reqwest = { version = "0.12", features = ["stream", "rustls-tls"] }
rusqlite = { version = "0.31", features = ["bundled"] }
uuid = { version = "1", features = ["v4"] }
sysinfo = "0.31"
sha2 = "0.10"
md-5 = "0.10"
chrono = { version = "0.4", features = ["serde"] }
```

- [ ] **步骤 2：创建 `src-tauri/src/models/task.rs`**

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TaskStatus {
    Pending,
    Downloading,
    Paused,
    Completed,
    Error,
    Merging,
    Checking,
}

impl std::fmt::Display for TaskStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TaskStatus::Pending => write!(f, "Pending"),
            TaskStatus::Downloading => write!(f, "Downloading"),
            TaskStatus::Paused => write!(f, "Paused"),
            TaskStatus::Completed => write!(f, "Completed"),
            TaskStatus::Error => write!(f, "Error"),
            TaskStatus::Merging => write!(f, "Merging"),
            TaskStatus::Checking => write!(f, "Checking"),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadTask {
    pub id: String,
    pub url: String,
    pub filename: String,
    pub status: TaskStatus,
    pub save_path: String,
    pub queue_id: String,
    pub category_id: Option<String>,
    pub thread_count: u32,
    pub total_size: u64,
    pub downloaded_size: u64,
    pub supports_ranges: Option<bool>,
    pub expected_hash: Option<String>,
    pub error_code: Option<String>,
    pub created_at: i64,
    pub started_at: Option<i64>,
    pub completed_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTaskPayload {
    pub url: String,
    pub filename: Option<String>,
    pub save_path: String,
    pub queue_id: String,
    pub thread_count: Option<u32>,
    pub enable_resume: Option<bool>,
    pub auto_start: Option<bool>,
    pub enable_integrity_check: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Checkpoint {
    pub id: i64,
    pub task_id: String,
    pub chunk_index: u32,
    pub start_byte: u64,
    pub end_byte: u64,
    pub downloaded_offset: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThreadInfo {
    pub chunk_index: u32,
    pub start_byte: u64,
    pub end_byte: u64,
    pub downloaded_offset: u64,
    pub speed: u64,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskLog {
    pub timestamp: i64,
    pub level: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskDetail {
    #[serde(flatten)]
    pub task: DownloadTask,
    pub threads: Vec<ThreadInfo>,
    pub logs: Vec<TaskLog>,
}
```

- [ ] **步骤 3：创建 `src-tauri/src/models/` 下其他模型文件**（settings.rs, site.rs, queue.rs），与服务端 spec 中的结构体一一对应
- [ ] **步骤 4：在 `src-tauri/src/lib.rs` 中声明** `pub mod models;`
- [ ] **步骤 5：运行 `cargo check`** 确认编译通过
- [ ] **步骤 6：提交**

```bash
git add src-tauri/Cargo.toml src-tauri/src/models/ src-tauri/src/lib.rs
git commit -m "feat: 添加 Rust 依赖和核心数据模型定义"
```

---

### Task 18: 数据库层 — Schema 与连接池

**文件：** 新建 `src-tauri/src/db/mod.rs`；修改 `src-tauri/src/lib.rs`

- [ ] **步骤 1：创建 `db/mod.rs`**

```rust
use rusqlite::Connection;
use std::sync::Mutex;

pub mod tasks;
pub mod checkpoints;
pub mod queues;
pub mod categories;
pub mod site_auth;
pub mod speed_policy;

pub struct DbState {
    pub conn: Mutex<Connection>,
}

pub fn init_db(db_path: &str) -> Result<Connection, rusqlite::Error> {
    let conn = Connection::open(db_path)?;
    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;
    run_migrations(&conn)?;
    Ok(conn)
}

fn run_migrations(conn: &Connection) -> Result<(), rusqlite::Error> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS queues (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            sort_weight INTEGER DEFAULT 0,
            icon TEXT
        );
        CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            icon TEXT,
            default_path TEXT NOT NULL,
            post_action TEXT DEFAULT 'none',
            file_extensions TEXT NOT NULL DEFAULT '[]',
            labels TEXT NOT NULL DEFAULT '[]'
        );
        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            url TEXT NOT NULL,
            filename TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Pending',
            save_path TEXT NOT NULL,
            queue_id TEXT REFERENCES queues(id),
            category_id TEXT REFERENCES categories(id),
            thread_count INTEGER NOT NULL DEFAULT 4,
            total_size INTEGER DEFAULT 0,
            downloaded_size INTEGER DEFAULT 0,
            supports_ranges BOOLEAN DEFAULT NULL,
            expected_hash TEXT,
            error_code TEXT,
            created_at INTEGER NOT NULL,
            started_at INTEGER,
            completed_at INTEGER
        );
        CREATE TABLE IF NOT EXISTS checkpoints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
            chunk_index INTEGER NOT NULL,
            start_byte INTEGER NOT NULL,
            end_byte INTEGER NOT NULL,
            downloaded_offset INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS site_auth (
            id TEXT PRIMARY KEY,
            site_name TEXT NOT NULL,
            domain_pattern TEXT NOT NULL,
            cookies TEXT,
            custom_ua TEXT,
            referer TEXT,
            quota_total INTEGER,
            quota_used INTEGER DEFAULT 0,
            login_status TEXT DEFAULT 'unknown'
        );
        CREATE TABLE IF NOT EXISTS speed_policy (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            download_limit INTEGER,
            upload_limit INTEGER,
            mode TEXT DEFAULT 'global',
            schedule TEXT,
            is_active BOOLEAN DEFAULT false
        );"
    )?;

    // 插入默认队列
    conn.execute(
        "INSERT OR IGNORE INTO queues (id, name, sort_weight, icon) VALUES ('queue-default', '默认队列', 0, 'list')",
        [],
    )?;

    // 插入预设分类
    let preset_categories = vec![
        ("cat-video", "视频/音频", "video", "D:/Downloads/Videos/", ".mp4,.avi,.mkv,.mov,.mp3,.flac,.wav"),
        ("cat-archive", "压缩文件", "archive", "D:/Downloads/Archives/", ".zip,.rar,.7z,.tar,.gz,.xz"),
        ("cat-software", "软件安装包", "package", "D:/Downloads/Software/", ".exe,.msi,.dmg,.deb,.rpm,.apk"),
        ("cat-os", "系统镜像", "disc", "D:/Downloads/OS/", ".iso,.img,.vhd,.vhdx"),
        ("cat-doc", "文档", "file", "D:/Downloads/Documents/", ".pdf,.doc,.docx,.xls,.xlsx,.epub,.mobi"),
        ("cat-other", "其他", "folder", "D:/Downloads/", ""),
    ];
    for (id, name, icon, path, exts) in preset_categories {
        conn.execute(
            "INSERT OR IGNORE INTO categories (id, name, icon, default_path, file_extensions, labels) VALUES (?1, ?2, ?3, ?4, ?5, '[]')",
            rusqlite::params![id, name, icon, path, format!("[{}]", exts.split(',').map(|e| format!("\"{}\"", e)).collect::<Vec<_>>().join(","))],
        )?;
    }

    Ok(())
}
```

- [ ] **步骤 2：更新 `lib.rs`** 添加 `pub mod db;`，创建 `DbState` 并在 Tauri setup 中初始化

```rust
use db::DbState;
use std::sync::Mutex;

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let app_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&app_dir)?;
            let db_path = app_dir.join("download_manager.db");
            let conn = db::init_db(db_path.to_str().unwrap())
                .expect("数据库初始化失败");
            app.manage(DbState { conn: Mutex::new(conn) });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("启动应用失败");
}
```

- [ ] **步骤 3：运行 `cargo check`** 确认编译通过
- [ ] **步骤 4：提交**

```bash
git add src-tauri/src/db/mod.rs src-tauri/src/lib.rs
git commit -m "feat: 实现数据库 Schema 迁移、连接池初始化和默认数据插入"
```

---

### Task 19: 数据库层 — CRUD 实现

**文件：** 新建 `src-tauri/src/db/tasks.rs`, `checkpoints.rs`, `queues.rs`, `categories.rs`, `site_auth.rs`, `speed_policy.rs`

- [ ] **步骤 1-6：逐个实现各表 CRUD**

每个 DB 模块包含标准 CRUD 函数，使用 `rusqlite::Connection` 参数。核心示例 `db/tasks.rs`：

```rust
use rusqlite::{Connection, params};
use crate::models::task::{DownloadTask, TaskStatus};

pub fn get_all(conn: &Connection, filter: &str, queue_id: Option<&str>) -> Vec<DownloadTask> {
    let mut sql = String::from("SELECT id, url, filename, status, save_path, queue_id, category_id, thread_count, total_size, downloaded_size, supports_ranges, expected_hash, error_code, created_at, started_at, completed_at FROM tasks WHERE 1=1");
    if filter != "all" { sql.push_str(&format!(" AND status = '{}'", filter)); }
    if let Some(qid) = queue_id { sql.push_str(&format!(" AND queue_id = '{}'", qid)); }
    sql.push_str(" ORDER BY created_at DESC");

    let mut stmt = conn.prepare(&sql).unwrap();
    stmt.query_map([], |row| { /* 逐列映射到 DownloadTask */ }).unwrap().filter_map(|r| r.ok()).collect()
}

pub fn get_by_id(conn: &Connection, id: &str) -> Option<DownloadTask> { /* 单行查询 */ }
pub fn insert(conn: &Connection, task: &DownloadTask) -> Result<(), rusqlite::Error> { /* INSERT */ }
pub fn update_status(conn: &Connection, id: &str, status: &TaskStatus) -> Result<(), rusqlite::Error> { /* UPDATE status */ }
pub fn update_progress(conn: &Connection, id: &str, downloaded: u64) -> Result<(), rusqlite::Error> { /* UPDATE downloaded_size */ }
pub fn delete(conn: &Connection, id: &str) -> Result<(), rusqlite::Error> { /* DELETE */ }
```

其他模块类似实现（queues/categories/site_auth/speed_policy/checkpoints），每个提供对应的 CRUD 函数。

- [ ] **步骤 2：运行 `cargo check`** 确认编译通过
- [ ] **步骤 3：提交**

```bash
git add src-tauri/src/db/
git commit -m "feat: 实现所有数据库表 CRUD 操作"
```

---

### Task 20: JSON 配置读写

**文件：** 新建 `src-tauri/src/config/mod.rs`

- [ ] **步骤 1：实现配置读写**

```rust
use crate::models::settings::AppConfig;
use std::path::PathBuf;

const CONFIG_FILE: &str = "config.json";

pub fn load_config(app_dir: &PathBuf) -> AppConfig {
    let path = app_dir.join(CONFIG_FILE);
    if path.exists() {
        let content = std::fs::read_to_string(&path).unwrap_or_default();
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        let config = AppConfig::default();
        save_config(app_dir, &config).ok();
        config
    }
}

pub fn save_config(app_dir: &PathBuf, config: &AppConfig) -> Result<(), std::io::Error> {
    let path = app_dir.join(CONFIG_FILE);
    let content = serde_json::to_string_pretty(config)?;
    std::fs::write(path, content)
}
```

在 `lib.rs` 的 setup 中加载配置，将其作为 Tauri State 管理。

- [ ] **步骤 2：运行 `cargo check`**
- [ ] **步骤 3：提交**

```bash
git add src-tauri/src/config/
git commit -m "feat: 实现 JSON 配置文件读写"
```

---

### Task 21-24: 核心下载引擎

**文件：** 新建 `src-tauri/src/core/` 下 6 个文件

由于下载引擎是后端核心，分解为 4 个子任务实现：

- [ ] **Task 21: chunker.rs** — HEAD 请求探测（`reqwest::Client::head()`），解析 `Content-Length` 和 `Accept-Ranges`，实现 `split_chunks(total: u64, threads: u32) -> Vec<(u64, u64)>`，对大文件（>10GB）动态增大最小块粒度
- [ ] **Task 22: worker.rs** — 单分块异步下载函数，使用 `reqwest::get()` + `RANGE` header，流式写入临时文件（`.part{N}`），每 200ms 通过 `app_handle.emit("download:progress", payload)` 推送进度，支持令牌桶限速回调
- [ ] **Task 23: limiter.rs** — 令牌桶实现，`RateLimiter` struct 含 `tokens_per_sec: u64`、`burst_size: u64`、`available: AtomicU64`、`last_refill: AtomicU64`，`async fn acquire(&self, n: u64)` 方法，支持动态调整速率
- [ ] **Task 24: engine.rs + merger.rs + verifier.rs**
  - `engine.rs` — 任务池管理器，含 `start_task()`/`pause_task()`/`resume_task()`/`cancel_task()`，调度并发任务数不超过 `maxConcurrentTasks`，发布 `download:status-change` 事件
  - `merger.rs` — 按 chunk 顺序将 `.part{N}` 文件合并写入最终文件，状态设为 `Merging`
  - `verifier.rs` — 流式计算 SHA256/MD5 哈希值，与 `expected_hash` 比对

- [ ] **每步完成后运行 `cargo check`，最终提交**

```bash
git add src-tauri/src/core/
git commit -m "feat: 实现核心下载引擎（分块、异步下载、限速、合并、校验）"
```

---

### Task 25-27: Tauri Commands

**文件：** 新建 `src-tauri/src/commands/` 下 5 个文件

- [ ] **Task 25: commands/tasks.rs** — `create_task`, `pause_task`, `resume_task`, `delete_task`, `retry_task`, `get_tasks`, `get_task_detail`
- [ ] **Task 26: commands/settings.rs** — `get_settings`, `update_settings`, `get_categories`, `upsert_category`, `delete_category`
- [ ] **Task 27: commands/site.rs + queues.rs + system.rs** — 站点/队列/系统信息 commands

每个 command 函数使用 `#[tauri::command]` 宏，通过 `tauri::State<DbState>` 访问数据库，返回 `Result<T, String>`：

```rust
#[tauri::command]
pub fn get_tasks(
    db: tauri::State<'_, DbState>,
    filter: String,
    queue_id: Option<String>,
) -> Result<Vec<DownloadTask>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    Ok(db::tasks::get_all(&conn, &filter, queue_id.as_deref()))
}
```

在 `lib.rs` 中通过 `.invoke_handler(tauri::generate_handler![...])` 注册所有 commands。

- [ ] **每步提交，最终 `cargo check` 通过**

---

## 阶段三：集成与收尾

### Task 28: TypeScript 类型与 Rust 结构体同步检查

- [ ] **步骤 1：逐项比对 `src/types/index.ts` 与 `src-tauri/src/models/`**
  - 字段名 camelCase/snake_case 转换正确
  - 枚举值一一对应
  - 可选字段（`Option<T>` ↔ `T?`）一致
- [ ] **步骤 2：修复不一致项**
- [ ] **步骤 3：提交**

---

### Task 29: 关闭 Mock 模式联调

- [ ] **步骤 1：设置 `.env` 中 `VITE_MOCK=false`**
- [ ] **步骤 2：运行 `npm run tauri dev`**
- [ ] **步骤 3：逐流程验证：**
  - 应用启动 → 数据库初始化 → 默认分类/队列创建
  - 创建下载任务 → SQLite 写入 → 任务表刷新
  - 任务状态变更 → 前后端状态同步
  - 设置修改 → config.json 持久化 → 重启后生效
- [ ] **步骤 4：修复联调中发现的 bug**
- [ ] **步骤 5：提交**

---

### Task 30: 错误处理与边界情况打磨

- [ ] **步骤 1：前端全局错误拦截** — 在 API 层捕获所有 invoke 异常，toast 显示错误信息
- [ ] **步骤 2：后端错误码标准化** — `403 Forbidden`, `404 Not Found`, `No Space`, `Network Error`, `Timeout`
- [ ] **步骤 3：加载/空状态** — TaskTable 空列表显示"暂无下载任务"，加载中显示 spinner
- [ ] **步骤 4：粘贴非法 URL 提示**
- [ ] **步骤 5：提交**

---

### Task 31: 最终构建验证

- [ ] **步骤 1：运行 `npm run tauri build`**
- [ ] **步骤 2：安装生成的 MSI/EXE 验证功能**
- [ ] **步骤 3：提交最终调整**

```bash
git add -A
git commit -m "chore: 集成联调完成，错误处理打磨，构建通过"
```

---

## 自审清单

- [ ] 覆盖 spec 中所有 In Scope 功能
- [ ] 所有 TODO 项以 PlaceholderSettings 占位
- [ ] 任务状态机路径完整实现
- [ ] 下载引擎分块/限速/合并/校验流程完整
- [ ] 数据库 Schema 与实际模型一致
- [ ] API 层 mock/real 分流路径正确
