# 豪德製茶所 - Monorepo 開發指南

## 📑 目錄

- [快速開始](#-快速開始)
- [專案架構](#-專案架構)
- [核心原則](#-核心原則)
- [開發工作流](#-開發工作流)

---

## 快速開始

### 5 秒速查

```bash
# 安裝依賴
pnpm install

# 啟動所有服務（推薦）
pnpm dev

# 啟動特定服務
pnpm dev:web      # 用戶端 → http://localhost:5173 (Next.js)
pnpm dev:admin    # 管理後台 → http://localhost:5174 (Vite)
pnpm dev:api      # 後端 API → http://localhost:3001 (NestJS)
```

### 常用指令

```bash
# 開發
pnpm dev                     # 啟動所有服務
pnpm dev --filter=@haude/web # 只啟動用戶端

# 建置
pnpm build                   # 建置所有專案
pnpm build --filter=@haude/admin  # 只建置管理後台

# 型別檢查
pnpm type-check

# 清理
pnpm clean

# 資料庫（在 apps/api 目錄下）
cd apps/api
npx prisma generate          # 生成 Prisma Client
npx prisma migrate dev       # 執行遷移
npx prisma studio            # 開啟資料庫管理 UI
```

---

## 專案架構

### Monorepo 結構

```
haude-v2/                     # Monorepo 根目錄
├── apps/
│   ├── web/                  # @haude/web - 用戶端前端 (Next.js)
│   │   ├── src/
│   │   │   ├── app/          # Next.js App Router
│   │   │   ├── components/   # React 元件
│   │   │   ├── stores/       # Zustand 狀態管理
│   │   │   ├── services/     # API 服務層
│   │   │   └── hooks/        # 自訂 Hooks
│   │   └── package.json
│   │
│   ├── admin/                # @haude/admin - 管理後台 (Vite)
│   │   ├── src/
│   │   │   ├── components/   # 後台元件
│   │   │   └── pages/        # 後台頁面
│   │   └── package.json
│   │
│   └── api/                  # @haude/api - 後端 API
│       ├── src/
│       │   ├── modules/      # NestJS 模組
│       │   └── prisma/       # Prisma 服務
│       ├── prisma/           # 資料庫 Schema
│       └── package.json
│
├── packages/
│   └── types/                # @haude/types - 共用型別
│       ├── src/
│       │   ├── product.ts    # 產品型別
│       │   ├── order.ts      # 訂單型別
│       │   └── user.ts       # 使用者型別
│       └── package.json
│
├── package.json              # Workspace 根設定
├── pnpm-workspace.yaml       # pnpm 工作區設定
├── turbo.json                # Turborepo 設定
└── CLAUDE.md                 # 本檔案
```

### 技術棧

| 層級 | 技術 | 說明 |
|------|------|------|
| **Monorepo** | pnpm + Turborepo | 工作區管理、智慧建置 |
| **用戶端** | Next.js 15 + React 19 + Tailwind | 電商前端 (App Router) |
| **管理後台** | React 19 + Vite + Tailwind | 後台管理介面 |
| **後端** | NestJS 11 + Prisma 7 | REST API |
| **資料庫** | PostgreSQL 15 | 關聯式資料庫 |
| **共用型別** | TypeScript + tsup | 型別同步 |

---

## 核心原則

### 3 條核心原則

1. **使用繁體中文** - 所有溝通均使用繁體中文
2. **使用 TodoWrite 追蹤複雜任務** - 完成後立即標記 completed
3. **遵循 Monorepo 規範** - 共用型別放 packages/types，專案特定放各自目錄

### Plan Mode 工作流程

> **詳見全域規範**：`~/.claude/CLAUDE.md`（Plan Mode 工作流程）

**本專案快速判斷**：
- **使用 Plan Mode**：新功能開發、複雜重構、跨多檔案變更
- **跳過**：簡單 Bug 修復、錯字修正、單檔案小修改

### 多代理並行工作

**本專案分配**：
- **Web 實例** → `apps/web`
- **Admin 實例** → `apps/admin`
- **API 實例** → `apps/api`

核心原則：不同實例不應同時編輯同一檔案

### Monorepo 規範

- **共用型別**：使用 `import { Product } from '@haude/types'`
- **內部依賴**：在 package.json 使用 `"@haude/types": "workspace:*"`
- **啟動指令**：使用 `pnpm dev` 統一啟動，或用 `--filter` 指定專案

### 跨專案協作指南

#### 依賴關係圖

```
packages/types (共用基礎)
       ↓
       ├─→ apps/web   (Next.js 用戶端)
       ├─→ apps/api   (NestJS 後端)
       └─→ apps/admin (Vite 管理後台)
```

#### 影響範圍判定

| 變更類型 | 影響專案 | 驗證順序 |
|---------|---------|---------|
| `packages/types` 變更 | **全部** | types → api → web → admin |
| `apps/api` schema 變更 | api, web, admin | api → `prisma generate` → web → admin |
| `apps/web` 元件變更 | web | 本地驗證即可 |
| `apps/admin` 元件變更 | admin | 本地驗證即可 |

#### 跨專案修改檢查清單

修改共用程式碼時，請確認：

- [ ] 確認修改的影響範圍（參考上表）
- [ ] 在基礎層（types）開始修改
- [ ] 按依賴順序在各專案驗證
- [ ] 執行全端建置：`pnpm build`
- [ ] 所有專案型別檢查通過

#### 常見跨專案操作

```bash
# 修改 types 後的完整驗證流程
pnpm --filter @haude/types build   # 1. 重建 types
pnpm type-check                     # 2. 全專案型別檢查
pnpm build                          # 3. 全專案建置

# 修改 API schema 後
cd apps/api
npx prisma generate                 # 1. 重新生成 Prisma Client
cd ../..
pnpm type-check                     # 2. 檢查前端型別
```

### 全域規範

> **詳見全域規範：`~/.claude/CLAUDE.md`**
>
> 以下規範已在全域文件中定義：
> - **Claude 行為準則** - 執行原則、Git 提交流程、TodoWrite 使用規範
> - **開發理念** - 核心信念、永不與始終、決策框架
> - **程式碼品質標準** - 架構原則、品質標準、測試指南
> - **驗證原則** - 變更後驗證工作流程
> - **常見錯誤追蹤** - 通用錯誤表格
> - **UI/UX 設計規範** - 禁止漸層、禁止 Emoji、使用 SVG 圖示
> - **Next.js 規範** - Client/Server Components、Next.js 15+ 注意事項

---

## 開發工作流

### 開發工具

#### Agentation（UI 視覺標註）

已整合在 web 和 admin 兩個前端應用中，僅在開發環境啟用。

**使用方式**：
1. 啟動開發伺服器 `pnpm dev`
2. 在瀏覽器中開啟目標頁面
3. 使用 Agentation Overlay（右下角工具列）標註 UI 元素
4. Claude Code 透過 MCP 接收標註資訊，精確定位對應的程式碼

**整合位置**：
- Web：`apps/web/src/components/dev/AgentationOverlay.tsx` → `layout.tsx`
- Admin：`apps/admin/src/App.tsx`（`import.meta.env.DEV` 條件渲染）
- MCP：`.mcp.json`（Claude Code 啟動時自動連接）

### 新增功能流程

1. **確認需求** - 確保理解需求範圍
2. **判斷位置**
   - 共用型別 → `packages/types`
   - 用戶端功能 → `apps/web`
   - 管理後台功能 → `apps/admin`
   - API 端點 → `apps/api`
3. **開發** - 使用 `pnpm dev` 開發
4. **驗證** - ⚠️ **重要！每次變更後執行**（或使用 `/verify`）
   ```bash
   pnpm type-check   # 型別檢查（必做）
   pnpm build        # 完整建置（確認無錯誤）
   ```
5. **提交** - 使用 `/git-pr` 或清晰的 commit message

> 💡 Boris Cherny：「給 Claude 驗證方式會讓結果品質提升 2-3 倍」

### API 端點（現有）

> API v1 版本：所有端點前綴 `/api/v1`，健康檢查除外

```
# 認證
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/auth/me

# 產品
GET    /api/v1/products
GET    /api/v1/products/:id
POST   /api/v1/admin/products
PUT    /api/v1/admin/products/:id
DELETE /api/v1/admin/products/:id

# 訂單
GET    /api/v1/orders
GET    /api/v1/orders/:id
POST   /api/v1/orders
PATCH  /api/v1/orders/:id/cancel

# 購物車
GET    /api/v1/cart
POST   /api/v1/cart/items
PUT    /api/v1/cart/items/:productId
DELETE /api/v1/cart/items/:productId

# 健康檢查（無前綴）
GET    /health
```

### Port 管理規範

**固定 Port 分配（不可變更）**：

| 服務 | Port | 說明 |
|------|------|------|
| **web** | 5173 | Next.js 用戶端（`next dev -p 5173`） |
| **api** | 3001 | NestJS 後端 API |
| **admin** | 5174 | Vite 管理後台 |

**啟動服務前必須執行**：

```bash
# 檢查 port 是否被占用
lsof -i :5173 -i :3001 -i :5174

# 如果有殘留進程，強制終止後再啟動
# 終止特定 port 的進程
kill -9 $(lsof -t -i :5173)  # 終止佔用 5173 的進程
kill -9 $(lsof -t -i :3001)  # 終止佔用 3001 的進程
kill -9 $(lsof -t -i :5174)  # 終止佔用 5174 的進程
```

**規則**：
- **永不** 自動切換到其他 port - 如果指定 port 被占用，必須先終止占用進程
- **永不** 假設服務已停止 - 啟動前必須用 `lsof` 檢查
- **始終** 使用固定 port - 確保前後端 URL 設定一致

### 環境變數

**apps/api** (`.env`)：
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/haude_v2"
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
PORT=3001
FRONTEND_URL=http://localhost:5173
```

**apps/web** (`.env.local`)：
```env
# 只設定 Base URL（不含版本），版本在 lib/api-url.ts 中集中管理
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

**apps/admin** (`.env`)：
```env
# 只設定 Base URL（不含版本），版本在 client.ts 中集中管理
VITE_API_BASE_URL=http://localhost:3001
```

### API 版本管理

> ⚠️ **重要**：API 版本已集中管理，升級時只需修改 2 個檔案

**版本定義位置**：
- `apps/web/src/lib/api-url.ts` → `API_VERSION = 'v1'`（Server/Client 共用）
- `apps/admin/src/services/api/client.ts` → `API_VERSION = 'v1'`

**升級 API 版本**：
```typescript
// 只需修改這兩個檔案中的 API_VERSION 常數
const API_VERSION = 'v2'  // 從 'v1' 改為 'v2'
```

**注意**：升級 API 版本後，需同步更新 Google Cloud Console 的 OAuth 回調 URI

---

## 專案特定錯誤

> 通用錯誤請見：`~/.claude/CLAUDE.md`（常見錯誤追蹤區塊）
> Next.js 錯誤請見：`~/.claude/rules/nextjs-components.md`

### 型別與 API 回應（本專案特定）

| 錯誤 | 正確做法 |
|------|----------|
| 直接使用 `product.inventory` | 使用 fallback chain：`product.stock ?? product.inventory ?? 0` |
| 使用 `image.storage_url` (snake_case) | 使用 camelCase：`image.storageUrl` |
| 在 Server Component 從 `@/services/api` 匯入 API_URL | 使用 `import { API_URL } from '@/lib/api-url'`（零依賴，Server 安全） |

### Git 與部署（本專案特定）

| 錯誤 | 正確做法 |
|------|----------|
| 使用已刪除的舊 git email 提交 | 提交前確認 `git config user.email` 匹配 GitHub 帳號 email |

### Monorepo 架構（本專案特定）

| 錯誤 | 正確做法 |
|------|----------|
| 在 apps/ 建立共用型別 | 共用型別放 `packages/types/` |

### 開發伺服器（本專案特定）

| 錯誤 | 正確做法 |
|------|----------|
| `/preview` 用全域版（port 3000、只啟動 web） | 先讀專案版 `.claude/commands/preview.md`（port 5173+3001、雙 server、ulimit fix） |
| 直接 `pnpm dev` 不處理 EMFILE | 用 `[ -f ~/.zshrc ] && source ~/.zshrc` 條件式設定 `ulimit`（跨平台相容） |
| 只啟動 web 不啟動 API | 本專案前後端耦合，預覽必須同時啟動 web(:5173) + API(:3001) |

### E2E 測試（本專案特定）

| 錯誤 | 正確做法 |
|------|----------|
| `page.goto()` hard navigation 導致 ProtectedRoute 重導到 `/login` | Zustand persist hydration 競態：`useEffect` 在 localStorage hydration 前觸發。解法：先用 UI 表單登入（soft navigate），再點 navbar 連結導覽，保持 React tree 不卸載 |
| 以 `addCookies()` / `page.evaluate()` / `addInitScript()` 注入認證狀態 | 全部失效（Zustand 預設 state 覆蓋）。唯一可靠方案：透過登入表單 → client-side navigation |
| Playwright 懶載入圖片截圖空白 | 先 `scrollTo(0, document.body.scrollHeight)` 觸發載入，再回頂部截圖 |

### Next.js 設定（本專案特定）

| 錯誤 | 正確做法 |
|------|----------|
| Google OAuth 頭像觸發 Error Boundary（非圖片破碎） | `next.config.ts` 的 `remotePatterns` 必須加入 `lh3.googleusercontent.com`（commit `e30014c`） |

---

## 相關文件

- **全域規範**：`~/.claude/CLAUDE.md`
- **全域規則**：`~/.claude/rules/`（Next.js、UI/UX、API、多代理工作流等）
- **用戶端規範**：`apps/web/CLAUDE.md`
