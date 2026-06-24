# Download Manager — Fullstack Implementation Design

**Date:** 2026-05-01
**Status:** Approved
**Scope:** Frontend (React + TypeScript + shadcn/ui) + Backend (Rust + Tauri v2)

---

## 1. Scope

### In Scope (full implementation)

- **Main Page:** Sidebar (status stats, queue list, tool links, theme toggle), Toolbar (new/pause/delete/refresh/search), TaskTable (file name, size, progress bar, speed, ETA, status, thread count), DetailPanel (详情/线程信息/文件列表/日志 tabs), GlobalStats (speed chart + disk gauge)
- **New Download Dialog:** URL mode, smart clipboard detection, save path, thread count (1–32), queue selector, advanced options (resume, auto-start, integrity check)
- **Settings Center (non-modal):**
  - **Download Settings:** default path, max concurrent tasks (1–10), max threads (1–128), resume toggle, post-download actions (notify/open dir/shutdown), file conflict policy, subdirectory creation
  - **Speed Settings:** bidirectional limits, three modes (unlimited/custom/smart), allocation mode (global/even), smart acceleration toggle with threshold, whitelist
  - **Task Management:** category CRUD, file extension matching, post-download automation (none/open/unzip)
  - **Site Management:** site auth list (domain pattern, cookies, UA, referer), quota display, login status, wildcard matching
- **Download Engine:** HEAD probe → range split → concurrent chunk download → checkpoint persistence → merge → hash verification
- **Task State Machine:** Pending → Downloading → Paused/Completed/Error/Merging/Checking
- **Bandwidth Control:** token bucket rate limiter, smart idle acceleration
- **Data Layer:** SQLite (tasks, checkpoints, queues, categories, site_auth, speed_policy), JSON config file
- **Dark Mode:** CSS variable-based theme switching

### Deferred (UI shell only — placeholder content)

- Connection Settings (proxy settings)
- UI Settings (font size, toolbar button visibility, theme colors)
- Notification Settings
- BT Settings (tracker servers, UPnP)
- Advanced Settings (memory cache, connection timeout)
- Other Settings (update check, privacy)
- BT download type tab in New Download Dialog (URL mode only for now)
- Browser extension integration
- BT/magnet protocol engine

---

## 2. File Organization

### Frontend (`/src`)

```
src/
├── api/              # Tauri invoke wrappers (never call invoke directly)
│   ├── tasks.ts
│   ├── settings.ts
│   ├── site.ts
│   ├── queues.ts
│   └── system.ts
├── components/       # Reusable UI
│   ├── ui/           # shadcn/ui primitives
│   ├── Sidebar.tsx
│   ├── Toolbar.tsx
│   ├── TaskTable.tsx
│   ├── TaskRow.tsx
│   ├── DetailPanel.tsx
│   ├── GlobalStats.tsx
│   └── SpeedChart.tsx
├── views/            # Page-level / dialog components
│   ├── MainPage.tsx
│   ├── NewDownloadDialog.tsx
│   └── SettingsDialog.tsx
├── store/            # Zustand stores
│   ├── taskStore.ts
│   ├── downloadStore.ts
│   └── settingsStore.ts
├── hooks/            # Custom hooks
│   ├── useDownloadProgress.ts
│   └── useClipboardMonitor.ts
├── types/            # TypeScript interfaces (mirror Rust structs)
│   └── index.ts
├── mocks/            # Mock data (persistent, git-tracked)
│   ├── data/
│   │   ├── tasks.json
│   │   ├── categories.json
│   │   ├── queues.json
│   │   ├── sites.json
│   │   ├── settings.json
│   │   └── speedHistory.json
│   ├── handlers.ts
│   └── index.ts
├── contexts/         # React Context providers
│   └── ThemeContext.tsx
├── App.tsx
└── main.tsx
```

### Backend (`/src-tauri/src`)

```
src-tauri/src/
├── commands/
│   ├── tasks.rs
│   ├── settings.rs
│   ├── site.rs
│   ├── queues.rs
│   └── system.rs
├── core/
│   ├── engine.rs      # Task pool orchestrator
│   ├── chunker.rs     # HEAD probe + range splitting
│   ├── worker.rs      # Per-chunk async download
│   ├── merger.rs      # File merge
│   ├── limiter.rs     # Token bucket rate limiter
│   └── verifier.rs    # MD5/SHA256 hash verification
├── db/
│   ├── mod.rs         # Connection pool, migrations
│   ├── tasks.rs
│   ├── checkpoints.rs
│   ├── queues.rs
│   ├── categories.rs
│   ├── site_auth.rs
│   └── speed_policy.rs
├── config/
│   └── mod.rs         # JSON config read/write
├── models/
│   ├── task.rs
│   ├── settings.rs
│   ├── site.rs
│   └── queue.rs
├── main.rs
└── lib.rs
```

---

## 3. Technology Choices

| Layer | Choice | Rationale |
|-------|--------|-----------|
| UI framework | React 18 + TypeScript | Already scaffolded, matches CLAUDE.md |
| Component library | shadcn/ui | Accessible, Tailwind-native, customizable |
| Styling | Tailwind CSS + CSS variables | Dark mode via CSS vars, utility-first |
| State management | Zustand (global) + Context (theme/dialog) | Lightweight, hooks-native |
| HTTP client (Rust) | reqwest | De facto async HTTP for Rust |
| Async runtime | tokio | Tauri standard, full-featured |
| Database | SQLite via rusqlite | Matches CLAUDE.md, embedded, no server |
| Serialization | serde + serde_json | Rust standard |
| Mock toggle | `VITE_MOCK` env var | Simple compile-time branch |

---

## 4. Database Schema (SQLite)

```sql
CREATE TABLE tasks (
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

CREATE TABLE checkpoints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  start_byte INTEGER NOT NULL,
  end_byte INTEGER NOT NULL,
  downloaded_offset INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE queues (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  sort_weight INTEGER DEFAULT 0,
  icon TEXT
);

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  icon TEXT,
  default_path TEXT NOT NULL,
  post_action TEXT DEFAULT 'none',
  file_extensions TEXT NOT NULL DEFAULT '[]',
  labels TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE site_auth (
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

CREATE TABLE speed_policy (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  download_limit INTEGER,
  upload_limit INTEGER,
  mode TEXT DEFAULT 'global',
  schedule TEXT,
  is_active BOOLEAN DEFAULT false
);
```

---

## 5. Tauri Command Interface

| Frontend Call (camelCase) | Backend Command (snake_case) | Returns |
|---|---|---|
| `createTask(payload)` | `create_task` | `Task` |
| `pauseTask(id)` | `pause_task` | `()` |
| `resumeTask(id)` | `resume_task` | `()` |
| `deleteTask(id, deleteFile)` | `delete_task` | `()` |
| `retryTask(id)` | `retry_task` | `Task` |
| `getTasks(filter, queue?)` | `get_tasks` | `Vec<Task>` |
| `getTaskDetail(id)` | `get_task_detail` | `TaskDetail` |
| `getSettings()` | `get_settings` | `AppConfig` |
| `updateSettings(section)` | `update_settings` | `AppConfig` |
| `getCategories()` | `get_categories` | `Vec<Category>` |
| `upsertCategory(cat)` | `upsert_category` | `Category` |
| `deleteCategory(id)` | `delete_category` | `()` |
| `getSites()` | `get_sites` | `Vec<SiteAuth>` |
| `addSite(payload)` | `add_site` | `SiteAuth` |
| `updateSite(payload)` | `update_site` | `SiteAuth` |
| `deleteSite(id)` | `delete_site` | `()` |
| `getQueues()` | `get_queues` | `Vec<Queue>` |
| `createQueue(name, icon)` | `create_queue` | `Queue` |
| `deleteQueue(id)` | `delete_queue` | `()` |
| `getDiskSpace(path)` | `get_disk_space` | `DiskInfo` |

### Backend → Frontend Events

| Event | Payload |
|---|---|
| `download:progress` | `{ task_id, chunk_index, offset, total }` |
| `download:speed` | `{ global_down_speed, global_up_speed }` |
| `download:status-change` | `{ task_id, old_status, new_status }` |
| `system:disk-warning` | `{ path, free_space }` |

---

## 6. Mock Data System

- **Toggle:** `VITE_MOCK=true` in `.env` (git-tracked, default true during frontend dev)
- **Location:** `src/mocks/data/*.json` (permanent, never deleted)
- **Pattern:** Each function in `src/api/` checks `import.meta.env.VITE_MOCK` and calls the corresponding mock handler when true
- **Mock handlers:** simulate 100–300ms delay, return data with realistic timestamps
- **Switch to real backend:** set `VITE_MOCK=false`

---

## 7. Development Sequence

### Phase 1: Frontend (with mocks)
1. shadcn/ui + Tailwind setup, theme (dark/light), CSS variables
2. Type definitions (`src/types/index.ts`)
3. Zustand stores (taskStore, downloadStore, settingsStore) + ThemeContext
4. Mock data files + API layer with env toggle
5. App shell: Sidebar + Toolbar + layout structure
6. TaskTable with mock data + right-click context menu
7. DetailPanel (tabs: 详情/线程信息/文件列表/日志)
8. GlobalStats: real-time speed chart + disk space gauge
9. NewDownloadDialog (URL mode + smart clipboard detection)
10. SettingsDialog with all tabs (core: full implementation, TODO: placeholder)
11. Polish: transitions, toast notifications, responsive behavior

### Phase 2: Backend (Rust)
1. Rust models (`models/`) + DB schema creation + migrations
2. DB CRUD layer (`db/`)
3. JSON config read/write (`config/`)
4. Tauri commands for tasks, settings, sites (CRUD endpoints)
5. Core engine: chunker (HEAD probe + range split)
6. Core engine: worker (per-chunk async download + progress emit)
7. Token bucket limiter + bandwidth control
8. Checkpoint persistence (dual-buffer write strategy)
9. File merger + hash verification
10. Site auth injection (cookie/UA/Referer by domain matching)
11. Automation engine (category matching + post-download actions)
12. System monitoring (disk space check via sysinfo)

### Phase 3: Integration
1. Set `VITE_MOCK=false`, smoke-test every flow
2. Fix type mismatches between TS and Rust
3. Error handling polish, edge cases
4. Final `npm run tauri build`

---

## 8. Task State Machine

```
Pending ──→ Downloading ──→ Merging ──→ Checking ──→ Completed
  │            │    │                       │
  │            │    └──→ Paused             └──→ Error
  │            │         (can resume)            (can retry)
  │            └──→ Error
  │
  └──→ (user deletes → removed)
```

- Paused tasks retain checkpoint data for resume
- Merging state: user cannot pause
- Error state: records error_code, supports one-click retry

---

## 9. Download Engine Flow

1. **HEAD probe:** Send HEAD request → get `Content-Length`, verify `Accept-Ranges: bytes`
2. **Fallback:** If server doesn't support ranges → single-threaded download
3. **Chunk split:** `ChunkSize = ceil(TotalSize / ThreadCount)`, min chunk 1MiB for files >10GB
4. **Concurrent download:** Spawn N tokio tasks, each downloads its `Range: bytes=start-end`
5. **Progress emit:** Every 200ms, emit `download:progress` with current offset
6. **Checkpoint save:** Every N bytes or T seconds, write checkpoint to SQLite (dual-buffer)
7. **Merge:** All chunks done → `Merging` state → sequential write of chunks to final file
8. **Verify:** If `expected_hash` is set, compute SHA256/MD5
9. **Complete:** Set status to `Completed`, trigger post-action

## 10. Bandwidth Control

- **Token Bucket:** Shared rate limiter with configurable `tokens_per_second` and `burst_size`
- Each worker calls `limiter.acquire(bytes_read)` — if tokens depleted, worker sleeps
- **Global mode:** All tasks share one bucket
- **Even mode:** Each task gets `total_limit / active_tasks` tokens
- **Smart acceleration:** Periodically check system network usage; if `< threshold` (default 10%), temporarily bypass limiter
- **Priority:** Tasks with higher priority (set by user) get larger token weight
