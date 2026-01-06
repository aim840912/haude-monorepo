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

### Monorepo 規範

- **共用型別**：使用 `import { Product } from '@haude/types'`
- **內部依賴**：在 package.json 使用 `"@haude/types": "workspace:*"`
- **啟動指令**：使用 `pnpm dev` 統一啟動，或用 `--filter` 指定專案

### 全域規範

> **詳見全域規範：`~/.claude/CLAUDE.md`**
>
> 以下規範已在全域文件中定義：
> - **Claude 行為準則** - 執行原則、Git 提交流程、TodoWrite 使用規範
> - **開發理念** - 核心信念、永不與始終、決策框架
> - **程式碼品質標準** - 架構原則、品質標準、測試指南
> - **UI/UX 設計規範** - 禁止漸層、禁止 Emoji、使用 SVG 圖示

---

## 開發工作流

### 新增功能流程

1. **確認需求** - 確保理解需求範圍
2. **判斷位置**
   - 共用型別 → `packages/types`
   - 用戶端功能 → `apps/web`
   - 管理後台功能 → `apps/admin`
   - API 端點 → `apps/api`
3. **開發** - 使用 `pnpm dev` 開發
4. **測試** - 使用 `pnpm build` 確認無錯誤
5. **提交** - 使用清晰的 commit message

### API 端點（現有）

```
# 認證
POST   /auth/register
POST   /auth/login
GET    /auth/me

# 產品
GET    /products
GET    /products/:id
POST   /admin/products
PUT    /admin/products/:id
DELETE /admin/products/:id

# 訂單
GET    /orders
GET    /orders/:id
POST   /orders
PATCH  /orders/:id/cancel

# 購物車
GET    /cart
POST   /cart/items
PUT    /cart/items/:productId
DELETE /cart/items/:productId
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
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**apps/admin** (`.env.development`)：
```env
VITE_API_URL=http://localhost:3001
```

---

## 相關文件

- **全域規範**：`~/.claude/CLAUDE.md`
- **用戶端規範**：`apps/web/CLAUDE.md`
