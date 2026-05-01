
# 项目指南与开发规范

## 项目概览
本项目是一个基于 Tauri 框架的高性能多线程异步下载管理器。后端采用 Rust 实现核心下载引擎与并发控制，前端使用 React + TypeScript 构建现代化 UI。

## 核心技术栈
*   **框架:** Tauri (v2推荐)
*   **前端:** React (Functional Components), TypeScript, Tailwind CSS
*   **后端:** Rust (Tokio 异步运行时, Reqwest/Hyper)
*   **存储:** SQLite (任务与队列管理), JSON (本地设置持久化)
*   **通信:** Tauri `invoke` 命令模式（统一封装）

## 常用命令
*   **开发模式:** `npm run tauri dev`
*   **生产构建:** `npm run tauri build`
*   **前端 Lint:** `npm run lint`
*   **Rust 检查:** `cargo check` / `cargo clippy`

## 目录规划规范

### 前端 (`/src`)
*   `api/`: 统一封装的 Tauri Command 调用接口（使用 `invoke`）
*   `components/`: 通用 UI 组件（Button, Modal, Table）
*   `views/`: 页面级组件（主页面、设置弹窗内容）
*   `store/`: 状态管理（Zustand 或 Context API），管理深色模式、全局速度等
*   `hooks/`: 自定义 Hook（如 `useDownloadProgress`）
*   `types/`: TypeScript 类型定义（与 Rust Struct 保持同步）

### 后端 (`/src-tauri/src`)
*   `commands/`: 定义所有暴露给前端的 `#[tauri::command]` 处理函数
*   `core/`: 下载引擎核心逻辑（多线程分块、异步 IO）
*   `db/`: SQLite 数据库操作、Schema 定义及迁移
*   `config/`: JSON 配置文件读写逻辑
*   `models/`: Rust 数据结构定义（实现 `Serialize`, `Deserialize`）

## 通信接口管理规范
1.  **统一封装:** 前端不允许在组件内直接调用 `invoke`。必须在 `src/api/` 中定义对应的 TypeScript 函数。
2.  **错误处理:** 后端 Command 统一返回 `Result<T, E>`，并在前端进行全局错误拦截。
3.  **命名约定:** Rust 函数使用 `snake_case`，前端调用接口使用 `camelCase`。

## 代码样式规范

### Rust
*   **命名:** 变量与函数用 `snake_case`；Struct/Enum 用 `PascalCase`。
*   **异步:** 优先使用 `tokio` 异步处理，避免阻塞主线程。
*   **文档:** 公有函数需添加文档注释。

### TypeScript/React
*   **组件:** 使用函数式组件和 Hooks。
*   **类型:** 严禁使用 `any`，所有接口返回数据必须有对应的 `interface` 定义。
*   **UI:** 严格遵循设计稿的间距与配色，支持深色模式切换。



## 核心功能逻辑约定
### 1. 下载核心与线程调度 (Download Core)
*   **握手协议 (The Handshake):** 所有任务开始前必须执行 `HEAD` 请求或范围为 `0-0` 的 `GET` 请求，以确认服务器是否支持 `Accept-Ranges`。若不支持，强制回退至单线程模式。
*   **分块策略 (Chunking Strategy):** 
    *   默认采用等分分块，计算公式如下：
        $$\text{ChunkSize} = \lceil \frac{\text{TotalSize}}{\text{ThreadCount}} \rceil$$
    *   对于超大文件（> 10GB），应动态增加分块粒度，防止过多的句柄操作。
*   **线程反馈 (Thread-level Feedback):** 后端必须以固定频率（如 **200ms**）向前端推送各线程的当前 `offset` 和 `downloaded` 字节数，以驱动线程进度可视化组件。
*   **合并逻辑 (Merging):** 下载完成后，由后端执行文件合并。合并过程中任务状态设为 `Merging`，禁止用户进行暂停操作。

### 2. 任务状态机 (Task State Machine)
任务状态必须严格遵循以下转换路径，且状态变更需实时同步至 SQLite：
*   **Pending (等待):** 任务已创建但未进入下载队列。
*   **Downloading (下载中):** 正在建立连接并写入磁盘。
*   **Paused (已暂停):** 用户主动暂停，必须保留当前的 `Checkpoints` 数据。
*   **Completed (已完成):** 文件合并成功并通过校验。
*   **Error (错误):** 记录错误码（如 `403 Forbidden`, `No Space`），支持“一键重试”。
*   **Checking (校验中):** 正在计算 MD5/SHA 散列值。

### 3. 自动化与归类逻辑 (Automation)
*   **后缀名优先规则:** 任务创建时，系统根据文件名后缀（如 `.mp4`, `.zip`）匹配 `Categories` 表。若匹配成功，自动重定向保存路径并关联对应的标签（Label）。
*   **任务完成后处理 (Post-Actions):** 
    *   **归档类:** 若任务属于“压缩文件”分类，完成后触发解压引擎至预设目录。
    *   **安装类:** 若属于“软件安装包”，完成后静默弹出安装界面或通知。
    *   **清理逻辑:** 任务删除时需询问用户“是否同步删除本地文件”。

### 4. 带宽调控逻辑 (Bandwidth Control)
*   **令牌桶算法 (Token Bucket):** 后端使用令牌桶或漏桶算法实现限速。限速值 $V$ 对所有并发线程生效，各线程根据权重分配令牌。
*   **智能空闲加速 (Smart Acceleration):** 
    *   监测系统全局流量。当 $\text{SystemUsage} < \text{Threshold}$ (默认 **10%**) 且处于“空闲加速模式”时，自动临时突破任务限速限制。
*   **优先级权重:** 在“均分限速”模式下，权重计算应考虑用户手动设定的“任务优先级”。

### 5. 站点管理与身份注入 (Site & Auth)
*   **Credential Injection:** 下载引擎在发起请求前，必须检查 `SiteAuth` 表。若 URL 匹配规则（如 `*.baidu.com`），自动将对应的 Cookie 或自定义 User-Agent 注入 HTTP Header。
*   **重定向追踪:** 针对网盘类链接，必须支持最多 **10次** 自动重定向追踪，并保持鉴权信息不丢失。
*   **配额感知:** 针对 GitHub 等有 API 限制的站点，后端需记录剩余配额，并在 UI 上实时显示“站点状态”。

### 6. 数据一致性与完整性 (Data Integrity)
*   **断点存盘 (Checkpoints):** 采用“双缓冲写入”策略，每下载 $N$ 字节（或每隔 $T$ 秒）更新一次 SQLite 中的 `Range` 完成情况，防止异常掉电导致进度大规模丢失。
*   **磁盘预留:** 任务启动前必须通过 Rust `sysinfo` 库检查目标分区可用空间。若 $\text{FreeSpace} < \text{FileSize}$，拒绝启动并弹出警告。
*   **哈希校验:** 下载完成后，根据服务器提供的 `Content-MD5` 或用户手动输入的哈希值进行强制或可选校验。



## 提交流程
*   **规范:** 遵循 `feat:`, `fix:`, `docs:`, `refactor:`, `chore:` 的 Commit 信息规范。
*   **同步:** 修改后端 Struct 后，务必同步更新前端 `types/` 下的定义。</T,>
- **必须**使用中文回复所有消息
- 所有代码注释、文档说明必须使用中文