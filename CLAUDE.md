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

# 資料庫：開發前必先啟動本機 DB（Docker Desktop 需執行中）
docker compose -f docker-compose.dev.yml up -d    # 啟動（port 5433）
docker compose -f docker-compose.dev.yml down     # 停止，資料保留
docker compose -f docker-compose.dev.yml down -v  # 停止並清空資料

# 資料庫操作（在 apps/api 目錄下）
cd apps/api
npx prisma generate          # 生成 Prisma Client
npx prisma migrate deploy    # 套用遷移（非互動環境不可用 migrate dev）
npx prisma db seed           # 灌測試資料
npx prisma studio            # 開啟資料庫管理 UI
```

> ⚠️ **開發資料庫是本機 Docker，不是 Supabase**。詳見下方「資料庫環境」。

---

## 專案架構

### Monorepo 結構

```
haude-monorepo/               # Monorepo 根目錄
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

| 層級 | 技術 | 部署 | 說明 |
|------|------|------|------|
| **Monorepo** | pnpm + Turborepo | — | 工作區管理、智慧建置 |
| **用戶端** | Next.js 15 + React 19 + Tailwind | Vercel | 電商前端 (App Router) |
| **管理後台** | React 19 + Vite + Tailwind | Vercel | 後台管理介面 |
| **後端** | NestJS 11 + Prisma 7 | Render（Docker） | REST API |
| **資料庫** | PostgreSQL 15 | Supabase | 關聯式資料庫 |
| **共用型別** | TypeScript + tsup | — | 型別同步 |

---

## 核心原則

### 3 條核心原則

1. **使用繁體中文** - 所有溝通均使用繁體中文
2. **複雜任務分階段** - 在回應中條列追蹤進度
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
> - **Claude 行為準則** - 執行原則、Git 提交流程
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
5. **提交** - 使用清晰的 commit message

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
GET    /health          # liveness，不查 DB
GET    /health/ready    # readiness，DB 斷線回 503
```

> 本機免密碼登入：`GET /api/v1/auth/dev-login?role=USER&target=web`（需要 `ENABLE_DEV_LOGIN=true` 且不是 production；`role=ADMIN` 可以直接拿到管理員身分）

### Port 管理規範

**固定 Port 分配（不可變更）**：

| 服務 | Port | 說明 |
|------|------|------|
| **web** | 5173 | Next.js 用戶端（`next dev -p 5173`） |
| **api** | 3001 | NestJS 後端 API |
| **admin** | 5174 | Vite 管理後台 |

啟動前若 port 被佔用，先 `pnpm kill:servers`（跨平台，清 5173 / 3001 / 5174）再啟動。
不要改用其他 port：前後端 URL 是寫死的，換 port 就對不上。

### 生產環境網址

| 服務 | 網址 | 平台 |
|------|------|------|
| Web 用戶端 | https://haude-web.vercel.app | Vercel |
| Admin 後台 | https://haude-admin.vercel.app | Vercel |
| API | https://haude-api.onrender.com | Render（Project: haude-tea-shop） |

### Web 登入 Cookie 必須是第一方（改動前必讀）

- **症狀**：無痕模式 / Safari 用 Google 登入，callback 頁顯示「登入失敗 Request failed with status code 401」，右上角卻已出現使用者名稱。
- **原因**：`vercel.app` 與 `onrender.com` 都在 Public Suffix List，是不同網站；API 直接設的 cookie 對 web 是第三方 cookie，會被丟掉。一般模式的 Chrome 不擋，所以平常測不出來。
- **做法**：瀏覽器一律打同網域 `/api/v1`（`BROWSER_API_URL`），由 `apps/web/next.config.ts` 的 rewrites 轉給 Render；Server Component 才用絕對的 `API_URL`。⛔ 不要讓瀏覽器端改回直接打 `API_URL`。
- **Google OAuth 另需兩處設定**（在程式碼外）：Render 的 `GOOGLE_WEB_CALLBACK_URL=https://haude-web.vercel.app/api/v1/auth/google/callback`，以及 Google Cloud Console 的「已授權的重新導向 URI」加入同一個網址。未設定時 web 沿用 `GOOGLE_CALLBACK_URL`（onrender.com），Google 登入仍會在無痕模式壞掉。
- **OAuth 用戶端在哪**：Google Cloud Console 的「Gemini API」專案 →「Haude Tea Web Client」（沒有叫 haude 的專案）
- **Render 改環境變數**：「Save only」不會重新部署，下次 push 或手動 Deploy 才生效；「Save and deploy」會立刻重新部署
- **線上驗收**：`curl -sI https://haude-api.onrender.com/api/v1/auth/google | grep -i location` 的 `redirect_uri` 要指向 haude-web；`curl -s -o /dev/null -w '%{http_code}' https://haude-web.vercel.app/api/v1/products` 回 200 代表代理正常；最後用無痕視窗實際用 Google 登入一次（2026-11-11 通過）。cookie 這一段可改跑 `apps/web` 的 `pnpm test:smoke`（Playwright WebKit，擋第三方 cookie 的行為和 Safari 一樣；用測試帳號帳密登入），Google 登入只在改 OAuth 設定時人工確認
- **Admin 同一套做法**（2026-11-12 起）：正式環境打同網域 `/api/v1`（`apps/admin/src/services/api/api-url.ts`），由 `apps/admin/vercel.json` 的 rewrite 轉給 Render（**Render 網址寫死在 vercel.json**，API 換主機要一起改）；開發環境照舊直連 `localhost:3001`。Google 登入另需 Render 的 `GOOGLE_ADMIN_CALLBACK_URL=https://haude-admin.vercel.app/api/v1/auth/google/callback`，並在 Google Console 加入同一個網址；**未設定時 admin 的 Google 登入會壞掉**（cookie 設在 onrender.com，admin 網域的請求帶不到）。線上驗收：`curl -sI 'https://haude-api.onrender.com/api/v1/auth/google?redirect=admin' | grep -i location` 的 `redirect_uri` 要指向 haude-admin。

### CSRF：Origin 白名單（改動前必讀）

- API 對 POST/PUT/PATCH/DELETE 檢查 `Origin`（`apps/api/src/common/middleware/origin-check.middleware.ts`，在 `main.ts` 掛載），白名單與 CORS 共用 Render 的 `FRONTEND_URL` / `ADMIN_URL`。前端不送 CSRF token。
- **症狀**：線上下單、後台改資料全部回 403 `Origin not allowed`。**判斷**：Render 的 `FRONTEND_URL` / `ADMIN_URL` 是否與瀏覽器網址列的來源**完全相同**（含 `https://`；結尾 `/` 會自動去掉）。Vercel preview 網址（`haude-web-git-…vercel.app`）、`127.0.0.1:5173`、區網 IP 都不在白名單，寫入請求一律 403，屬預期行為。
- 新增「第三方從自己的網域 POST 進來」的端點（金流、Webhook 的瀏覽器導回）→ 加進 `main.ts` 的排除前綴，否則會被擋。目前只排除 `/api/v1/payments/ecpay/`；這類端點必須靠簽章驗證，不能靠 cookie。

### 限流的訪客 IP（改動前必讀）

- **事實**（2026-11-12 從 Render log 實測）：Render 前面是 Cloudflare，**每個請求的 `req.ip` 都是 `127.0.0.1`**；設 `trust proxy` 也沒用，因為 `X-Forwarded-For` 最左邊可以被偽造。
- 唯一偽造不了的是 `cf-connecting-ip`：偽造它的請求在 Cloudflare 就被 403 擋掉。`x-vercel-forwarded-for` 直接打 onrender.com 可以偽造，⛔ 不可直接採用。
- 限流鍵（`UserThrottlerGuard`）：已登入 → 驗證過的 JWT `sub`；匿名 → `cf-connecting-ip`。web／admin 都經過 Vercel 代理，所以匿名請求分到的是 **Vercel 出口 IP**（同一區域的使用者共用）。要再細分得先驗證 `x-vercel-proxy-signature`。
- 重新實測：帶獨特的 User-Agent `curl` 一次（分別經 Vercel、直打 onrender.com），再到 Render Logs 找那一行的 headers。

### 訂單狀態（改動前必讀）

- 狀態只能照 `packages/types/src/order.ts` 的 `ORDER_STATUS_TRANSITIONS` 轉換：API 拒絕表外的轉換，後台只列表內選項。要新增轉換先改這張表。
- 副作用綁在「進入某狀態」：已取消 → 補庫存、已送達 → 發點數與累積消費、已退款 → 收回兩者。⛔ 不要加「往回走」的轉換，副作用會重複執行。
- 取消有三條路徑（顧客取消、付款逾期、後台改狀態），全部必須「狀態符合預期才寫入（`updateMany` + `count`），寫入成功才呼叫 `restoreOrderStock()`」。新增取消或退款路徑也照這個寫法；綠界退款（`payment-refund.service.ts`）目前還沒照做，開放金流前要補。

### 庫存預警（改動前必讀）

- 預警不是資料庫觸發器：庫存變少後要由程式呼叫 `NotificationsService.checkAndCreateStockAlert()`，目前接在「建立訂單」與「後台手動改庫存」兩處（不等待、失敗只記 log），另外儲存預警設定時也會立即檢查一次。**新增會減少庫存的路徑時要一起呼叫**，沒呼叫不會報錯，只是預警靜默失效（2026-11-13 前就是完全沒接，設定了也不會通知）。
- 只檢查**設定過**的商品；沒設定的商品永遠不會提醒。後台「庫存預警」頁列出全部商品，第一次設定門檻時會一併啟用。
- **後台鈴鐺的每種通知都一樣**：`notifications.service.ts` 的 `create*Notification()` 寫好不等於會發送，要在業務流程裡呼叫才會出現（2026-11-13 前四種有三種沒人呼叫）。目前接法：新訂單 → 建立訂單；訂單取消 → 顧客取消、付款逾期（後台自己取消不通知）；付款成功 → **尚未接**，開放金流時接在綠界付款成功的 callback。新增通知類型時，同時寫「呼叫點有呼叫」的測試。

### 後台操作紀錄（改動前必讀）

- 後台「操作紀錄」頁（`/audit-logs`）只看得到有標 `@AuditLog(...)` 的端點。**新增後台寫入端點時要一起加**；沒加不會報錯，只是那個操作完全不留紀錄。
- 想在刪除後還看得到名稱，`audit-log.interceptor.ts` 的 `SNAPSHOT_LOADERS` 要有該資源的讀取方式；含個資的表（訂單、會員、退款）只抓白名單欄位，因為紀錄會保留 365 天。
- 新增資源類型時，`common/audit/audit-labels.ts` 的 `LABEL_RESOLVERS` 也要加一筆（依 ID 查名稱）：請求本身不帶名稱時（如庫存預警只送門檻值），「對象」欄只能靠它顯示名稱，沒加會靜默退回顯示 `#ID 前 8 碼`。查詢時補上的名稱是**目前名稱**，後台會標示，不等於當時的名稱。
- 紀錄裡的 IP 通常是 Vercel 的出口 IP（後台經 Vercel 代理），辨識是誰做的要看操作者，不是 IP。

### 健康檢查分工（改動前必讀）

| 檢查者 | 端點 | 用途 |
|------|------|------|
| Render Health Check Path | `/health` | 部署時等新版回 200 才切流量；失敗會重啟服務 |
| Docker `HEALTHCHECK`（`Dockerfile.api`） | `/health` | 容器層存活檢查 |
| cron-job.org「Haude API Keep Alive」（每 5 分鐘） | `/health/ready` | Render 不休眠 + Supabase 保持活躍；DB 斷線回 503 → 寄信告警 |

- `/health` = liveness，**不查 DB**；`/health/ready` = readiness，跑 `SELECT 1`，DB 斷線回 **503**。
- **會觸發重啟的檢查（Render / Docker）不可改成 `/health/ready`**：Supabase 暫停時重啟 API 救不了，只會讓 API 反覆重啟。
- 在 Render Dashboard 改 Health Check Path 會**立即觸發一次完整重新部署**；填的路徑回不了 200 部署就會卡住。

### 資料庫環境（重要）

**開發與生產使用不同資料庫，不可混用。**

| 環境 | 資料庫 | 連線 |
|------|--------|------|
| 本機開發 | Docker PostgreSQL 15 | `127.0.0.1:5433` / db `haude_dev` |
| 生產 | Supabase（Tokyo） | Session pooler，設定於 Render 環境變數 |

**為什麼分離**：兩者原本共用同一個 Supabase 專案，本機跑 `prisma db seed` 或測試刪除會直接砍掉線上真實訂單。茶行即將實際使用，此風險不可接受。

**踩雷提醒**：
- Port 是 **5433 不是 5432**——5432 已被另一專案的 `taskflow-postgres` 佔用
- 連線字串用 **`127.0.0.1` 不可用 `localhost`**——Windows 會優先解析成 IPv6 `::1`，而容器只綁 IPv4，會出現 `P1001 Can't reach database server`
- 生產連線字串備份在 `apps/api/.env.prod-backup.local`（已 gitignore）。要對生產庫操作時：
  `DATABASE_URL="$(grep '^DATABASE_URL=' .env.prod-backup.local | sed 's/^DATABASE_URL=//' | tr -d '\"')" npx prisma migrate status`

### 環境變數

**apps/api** (`.env`)：
```env
# 本機開發（Docker）— 生產值在 Render，勿把生產字串寫進此檔
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5433/haude_dev?schema=public"
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
PORT=3001
FRONTEND_URL=http://localhost:5173

# 個資保留期限（未設定則採程式內建預設 180 / 365）
PAYMENT_LOG_RETENTION_DAYS=180
AUDIT_LOG_RETENTION_DAYS=365
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
- `apps/web/src/lib/api-url.ts` → `API_PATH = '/api/v1'`（同時是 `next.config.ts` 代理規則的來源路徑）
- `apps/admin/src/services/api/api-url.ts` → `API_VERSION = 'v1'`（同時是 `apps/admin/vercel.json` 代理規則的來源路徑）

**注意**：升級 API 版本後，需同步更新：
- Google Cloud Console 的 OAuth 回調 URI，以及 Render 的 `GOOGLE_CALLBACK_URL` / `GOOGLE_WEB_CALLBACK_URL` / `GOOGLE_ADMIN_CALLBACK_URL`
- `auth.controller.ts` 寫死的 refresh cookie 路徑 `/api/v1/auth/refresh` —— 它必須和 web 代理的前綴一致，不一致時瀏覽器不會送出 refresh cookie，使用者每 15 分鐘被登出，且 build 不會報錯

---

## 專案特定錯誤

> 通用錯誤請見：`~/.claude/rules/error-tracking.md`
> Next.js 錯誤請見：`~/.claude/rules/frontend.md`

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
| 改動 `apps/api/prisma/schema.prisma` 後直接 push，以為型別檢查/build/測試都過就代表沒問題 | **正式環境沒有自動 migration 機制**：`haude-api`（Render 免費方案）的 Pre-Deploy Command 被鎖、Dockerfile 也沒有跑 `prisma migrate deploy`。push 後 Render 會自動重新部署新程式碼，但正式 Supabase 資料庫結構不會跟著變，新 Prisma Client 一查詢不存在的欄位就 500（曾實際造成商品頁全站中斷 ~20 分鐘）。**schema 變更 push 前後，必須手動對正式資料庫執行**：`DATABASE_URL="$(grep '^DATABASE_URL=' apps/api/.env.prod-backup.local \| sed 's/^DATABASE_URL=//' \| tr -d '\"')" npx prisma migrate deploy`（在 `apps/api` 目錄下）。`prisma generate`（產生型別）和 `prisma migrate deploy`（真的改資料庫）是兩件互不影響的事，不要混淆。 |
| Render 服務名稱找不到時，只看 Dashboard 首頁的「Ungrouped Services」表格就下結論 | Render 首頁的服務分兩區：「Projects」分組容器 + 「Ungrouped Services」未分組列表，`haude-api` 實際上被歸在一個叫「My project」的專案分組底下（已改名為 `haude-tea-shop`）。要點進 Project 卡片才看得到裡面的服務，不能只看 Ungrouped 那張表。 |
| API 部署位置認知：以為跟 web/admin 一樣在 Vercel | `haude-web`／`haude-admin` 在 Vercel，**`haude-api`（NestJS）在 Render**（`haude-api.onrender.com`），因為 NestJS 需要長駐容器，不適合 Vercel 的 serverless functions 模型。不確定時查 Vercel 專案的 `NEXT_PUBLIC_API_BASE_URL` 環境變數最準確。 |
| 部署 web 後，商品 / 果園 / 門市詳細頁回 404（API 直接打該 ID 卻是 200），以為程式改壞要回退 | build 時會預先產生詳細頁；若當下 Render 剛重啟或休眠（`/health` 的 `uptime` 很小），頁面的 `getX()` 把連線失敗當成「找不到」→ `notFound()` → 這個 404 被 ISR 快取。**判斷**：`curl -sI` 看到 `X-Vercel-Cache: HIT` 且回應很快、API 同 ID 回 200。**做法**：等 `revalidate`（300 秒）後會自動恢復（2026-10-23 實測 270 秒），不要回退程式。**根因**（2026-10-23 本機 build 重現）：build 平行預先產生 56 個詳細頁，超過 API 限流（每 IP 每秒 3 次、每分鐘 100 次，`app.module.ts` 的 `ThrottlerModule`）→ **429** → 舊程式把 429 當成找不到。`lib/fetch-detail.ts` 已改為只有 404 才 `notFound()`、其他錯誤 throw，**因此 build 遇到 429 會直接失敗**。**對策（2026-10-25）**：三個詳細頁的 `generateStaticParams` 回傳 `[]`，改為首次瀏覽時才產生並快取，build 不再打詳細頁 API（48 頁、0 個 429）。⛔ 不要改回由 API 列出全部 id，除非先讓 API 對 build 流量放行限流。 |
| 線上全站 500，但 `/health` 回 200，就以為 API 沒事 | `/health` 是 liveness，**刻意不查資料庫**；要看 `/health/ready`。回 **503** + `"database":"disconnected"` → 先查 Supabase 是否被暫停（免費方案閒置 7 天會暫停，Dashboard 顯示 paused；`prisma migrate status` 會報 `tenant/user ... not found`，`db.<ref>.supabase.co` DNS 查不到）。解法：Supabase Dashboard → **Resume project**，約 3 分鐘恢復，Render API 不需重新部署（Prisma 會自動重連）。 |
| 以為保活排程一直在跑 | cron-job.org 的排程「Haude API Keep Alive」（job `7140895`）每 5 分鐘打 `/health/ready`，同時讓 Render 不休眠、讓 Supabase 保持活躍。**連續失敗會被 cron-job.org 自動停用且不明顯**——2026-03 就是這樣停掉，之後 Supabase 被暫停（2026-09-14 修復）。資料庫故障修好後，**要回 cron-job.org 確認排程仍是啟用狀態**。2026-09-26 再發生一次：上游短暫 403/503 約 2 小時後就自己恢復了，排程卻已被停用，而且停用之後不會再寄失敗信。**判斷方法**：排程列表「下次執行」顯示「非使用中」；或 `/health` 冷啟動要 30 秒左右、回應的 `uptime` 只有幾十秒（代表 Render 已經休眠過）。`/health/ready` 只會回 200/503，出現 **403 表示是 Render 邊緣層擋的，不是我們的程式**。排程已開啟「在工作歷史中儲存回應」，失敗時可以到歷史細節看回應內容。 |

### Monorepo 架構（本專案特定）

| 錯誤 | 正確做法 |
|------|----------|
| 在 apps/ 建立共用型別 | 共用型別放 `packages/types/` |

### 開發伺服器（本專案特定）

| 錯誤 | 正確做法 |
|------|----------|
| 預覽時只啟動 web（port 3000） | 用 `/system:preview`：它會讀專案的 `.claude/preview.config.md`（web 5173 + API 3001、ulimit fix） |
| 直接 `pnpm dev` 不處理 EMFILE | 用 `[ -f ~/.zshrc ] && source ~/.zshrc` 條件式設定 `ulimit`（跨平台相容） |
| 只啟動 web 不啟動 API | 本專案前後端耦合，預覽必須同時啟動 web(:5173) + API(:3001) |

### E2E 測試（本專案特定）

| 錯誤 | 正確做法 |
|------|----------|
| `page.goto()` hard navigation 導致 ProtectedRoute 重導到 `/login` | Zustand persist hydration 競態：`useEffect` 在 localStorage hydration 前觸發。解法：先用 UI 表單登入（soft navigate），再點 navbar 連結導覽，保持 React tree 不卸載 |
| 以 `addCookies()` / `page.evaluate()` / `addInitScript()` 注入認證狀態 | 全部失效（Zustand 預設 state 覆蓋）。唯一可靠方案：透過登入表單 → client-side navigation |
| Playwright 懶載入圖片截圖空白 | 先 `scrollTo(0, document.body.scrollHeight)` 觸發載入，再回頂部截圖 |
| 登入表單填完送出卻停在 `/login`，失敗截圖裡 Email 是空的、密碼有值 | React hydration 前填的值會被重設成 `''`（受控輸入框）。等元素出現 `__reactProps$…` 屬性（代表已 hydrate）再填，送出前用 `toHaveValue` 確認兩欄都在；⛔ 不要用 `waitForLoadState('networkidle')`，`next dev` 的 HMR 連線讓它永遠等不到。寫法見 `e2e/smoke-prod/login-cookies.smoke.ts` |
| 正式站冒煙測試（`pnpm test:smoke`）要用哪個帳號 | 正式站已有**專用測試帳號**（2026-11-12 註冊，名稱「Smoke Test」，一般會員權限，只做登入／刷新／登出等唯讀操作）。帳密在 `apps/web/.env.smoke.local`（`*.local` 已 gitignore，由使用者手動維護，設定檔自動讀取）與使用者的密碼管理器；⛔ Claude 不讀、不寫這個檔，也不寫進 `.claude/test.config.md`（那裡只放本機 DB 帳號）。不可用真實顧客或管理員帳號。登入每分鐘限 5 次，測試已設 `workers: 1`，短時間連跑會 429 |

### Next.js 設定（本專案特定）

| 錯誤 | 正確做法 |
|------|----------|
| Google OAuth 頭像觸發 Error Boundary（非圖片破碎） | `next.config.ts` 的 `remotePatterns` 必須加入 `lh3.googleusercontent.com`（commit `e30014c`） |
| 右下角 AI 客服展開後顯示「這項內容已遭到封鎖」，以為是客服服務壞了 | 是**本站 CSP 擋掉跨網域 iframe**（widget 那邊是 `frame-ancestors *`）。`frame-src` 取自 Vercel 環境變數 `NEXT_PUBLIC_AI_SUPPORT_URL` 的 origin，**在 build 時寫進標頭**：改這個變數後要重新部署 web，CSP 才會跟著換。判斷：`curl -sI https://haude-web.vercel.app/ \| grep -i content-security-policy` 的 `frame-src` 要包含 widget 網域（2026-11-13 修復，commit `701f83e`） |

---

## 金流功能開發提醒（待實作，觸發時 Claude 主動提起）

> **狀態**：後端綠界串接程式碼已存在（`apps/api/src/modules/payments/`：`ecpay-crypto`、`create-payment`、`payment-callback`、`payment-refund`），但前端付款方式 `CREDIT`/`VACC`/`CVS` 全部 `enabled: false`（`apps/web/.../checkout/components/PaymentMethodSelector.tsx`），目前唯一可用的是 `STORE_CONTACT`（電話確認）。**線上金流實質尚未啟用**。
>
> **金流服務商**：綠界科技 ECPay。
>
> **觸發條件**：當使用者要「開放線上刷卡 / 啟用信用卡付款 / 做金流 / 測試付款流程 / 改 payments 模組」時，Claude 應主動提起以下測試要點，不要直接改 `enabled: true` 就當完成。

### 金流測試要點（開發此功能時務必覆蓋）

1. **兩套環境隔離**：綠界有測試環境（Stage）與正式環境，各自的 `MerchantID` / `HashKey` / `HashIV` 不同。先確認 `apps/api/src/config/env.validation.ts` 如何切換，測試一律連 Stage。
2. **CheckMacValue 驗簽**（純函式，最該先測）：`ecpay-crypto.spec.ts` 要驗「固定輸入 → 簽章等於綠界文件預期值」。驗簽沒做好 = 有人可偽造「已付款」通知。
3. **Callback / Webhook**：綠界主機要打得到後端 `/payment/callback`。本機開發需 `ngrok http 3001` 把 localhost 暴露到公網，再設為綠界 callback URL。
4. **冪等性（idempotency）**：綠界可能重送同一筆付款通知，`payment-callback.service` 必須確保同一筆只處理一次（否則庫存扣兩次、發兩封信）。
5. **情境全覆蓋**：成功 / 授權失敗 / 逾時未付（訂單是否自動取消、釋放庫存）/ 重複通知 / 退款（`payment-refund.service`）。付款成功要呼叫 `createPaymentSuccessNotification()`（目前沒有呼叫點），重複通知時只發一次。
6. **測試卡號**：綠界測試環境提供假卡號觸發不同結果——**具體卡號以綠界官方當前文件為準**（可用 context7 查 ECPay SDK 文件，勿憑記憶硬寫）。
7. **上線順序**：先把能 mock 的邏輯（簽章、狀態機）單元測試測滿 → 再接 Stage + ngrok 測完整 callback → 情境卡號全跑 → 最後才切正式金鑰 + `enabled: true`。

> ⚠️ **schema 若有變更**：記得依專案「Git 與部署」錯誤表，push 前後手動對正式 Supabase 跑 `prisma migrate deploy`（正式環境無自動 migration）。

---

## 相關文件

- **全域規範**：`~/.claude/CLAUDE.md`
- **全域規則**：`~/.claude/rules/`（Next.js、UI/UX、API、多代理工作流等）
- **用戶端規範**：`apps/web/CLAUDE.md`
