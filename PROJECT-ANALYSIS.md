# 豪德製茶所 - 專案技術分析報告

> 分析日期：2026-01-21（更新）
> 分析工具：Claude Code (Opus 4.5)

---

## 目錄

1. [專案概覽](#1-專案概覽)
2. [技術棧詳情](#2-技術棧詳情)
3. [功能清單](#3-功能清單)
4. [資料庫架構](#4-資料庫架構)
5. [安全防護](#5-安全防護)
6. [測試基礎設施](#6-測試基礎設施)
7. [部署架構](#7-部署架構)
8. [優點分析](#8-優點分析)
9. [改進空間](#9-改進空間)
10. [整體評分](#10-整體評分)
11. [附錄：技術棧版本明細](#附錄技術棧版本明細)

---

## 1. 專案概覽

### 1.1 專案簡介

**豪德製茶所**是一個全端電商平台，結合線上茶葉銷售與農村旅遊體驗預訂功能。採用現代化 Monorepo 架構，包含用戶端網站、管理後台及 REST API 三大應用。

**核心亮點**：
- 🛒 完整電商系統（購物車、結帳、訂單追蹤）
- 🌿 農村旅遊體驗預訂（日期選擇、參加人數管理）
- 👥 四級會員制度（積點、生日獎勵、自動升級）
- 💳 台灣本地化金流整合（ECPay）
- 🔒 企業級安全防護（6 層安全架構）
- 🧪 完整測試覆蓋（單元測試 + E2E + 負載測試）

### 1.2 專案規模統計

| 指標 | 數量 |
|------|------|
| TypeScript 檔案總數 | 435 個 |
| React 元件數量 | 90+ 個 |
| NestJS 模組數量 | 18 個 |
| **Prisma 資料模型** | **29 個** |
| 資料庫 Schema 行數 | 800+ 行 |
| Service 層程式碼 | 6,439 行 |
| 用戶端頁面數量 | 24+ 頁 |
| 管理後台頁面數量 | 10+ 頁 |
| **E2E 測試案例** | **22 個** |
| 單元測試案例 | 195 個 |
| **負載測試階段** | **k6 5 階段** |
| TODO/FIXME 標記 | 僅 4 個 |

---

## 2. 技術棧詳情

### 2.1 Monorepo 基礎設施

| 工具 | 版本 | 用途 |
|------|------|------|
| pnpm | 9.15.0 | 依賴管理、工作區管理 |
| Turborepo | 2.x | 智慧建置快取、平行執行 |
| TypeScript | 5.7-5.9 | 跨專案型別安全 |

### 2.2 前端技術

#### 用戶端 (apps/web)

| 技術 | 版本 | 用途 |
|------|------|------|
| Next.js | **15.3.4** | App Router、SSR/SSG/ISR |
| React | **19.2** | UI 框架 |
| Tailwind CSS | 4.x | 樣式系統 |
| Zustand | 5.x | 狀態管理（購物車、認證） |
| next-intl | 4.x | 國際化 (i18n) |
| Framer Motion | 11.x | 動畫效果 |

#### 管理後台 (apps/admin)

| 技術 | 版本 | 用途 |
|------|------|------|
| React | **19.2** | UI 框架 |
| Vite | **7.2.4** | 建置工具（快速 HMR） |
| Tailwind CSS | 4.x | 樣式系統 |
| React Router | 7.x | 路由管理 |
| TanStack Query | 5.x | 資料獲取與快取 |

### 2.3 後端技術 (apps/api)

| 技術 | 版本 | 用途 |
|------|------|------|
| NestJS | **11.0.1** | REST API 框架 |
| Prisma | **7.1.0** | ORM（含 Accelerate） |
| PostgreSQL | 15.x | 關聯式資料庫 |
| Joi | 17.x | 環境變數驗證 |
| Passport | 0.7.x | 認證策略（JWT、Google OAuth） |
| Helmet | 8.x | HTTP 安全標頭 |
| @nestjs/throttler | 6.x | 速率限制 |

### 2.4 共用層 (packages/types)

| 技術 | 用途 |
|------|------|
| tsup | 套件建置（ESM/CJS） |
| TypeScript | 型別定義共享 |

### 2.5 外部服務整合

| 服務 | 用途 |
|------|------|
| **Supabase** | 檔案儲存（產品圖片等） |
| **ECPay** | 台灣金流支付整合 |
| **Google OAuth** | 第三方登入 |
| **Resend** | 電子郵件發送（訂單通知、密碼重設） |

---

## 3. 功能清單

### 3.1 用戶端功能 (apps/web)

```
apps/web/src/app/[locale]/
├── (auth)/                      # 認證相關頁面
│   ├── login/                   # 登入
│   ├── register/                # 註冊
│   ├── forgot-password/         # 忘記密碼
│   └── reset-password/          # 重設密碼
├── products/                    # 產品相關
│   ├── page.tsx                 # 產品列表
│   └── [id]/                    # 產品詳情
├── cart/                        # 購物車
├── checkout/                    # 結帳流程
│   └── success/                 # 結帳成功
├── orders/                      # 訂單管理
│   └── [id]/                    # 訂單詳情
├── farm-tours/                  # 農村旅遊
│   ├── page.tsx                 # 體驗列表
│   └── [id]/                    # 體驗詳情
├── about/                       # 關於我們
├── news/                        # 最新消息
├── member/                      # 會員中心
│   ├── profile/                 # 個人資料
│   ├── orders/                  # 訂單記錄
│   └── points/                  # 積點明細
├── faq/                         # 常見問答
├── contact/                     # 聯絡我們
├── privacy/                     # 隱私政策
└── terms/                       # 服務條款
```

**特色功能**：
- 國際化支援（locale-based routing）
- 響應式設計（Mobile-First）
- 購物車持久化（Zustand + localStorage）
- 即時庫存檢查
- 會員等級顯示與優惠

### 3.2 管理後台功能 (apps/admin)

| 頁面 | 功能 |
|------|------|
| Dashboard | 銷售總覽、訂單統計、熱銷商品 |
| Products | 產品 CRUD、圖片上傳、草稿機制 |
| Orders | 訂單列表、狀態更新、出貨管理 |
| Farm Tours | 體驗活動管理、日期設定 |
| Members | 會員列表、等級調整、積點管理 |
| Reports | 銷售報表、匯出功能 |
| Reviews | 評論審核、回覆管理 |
| Settings | 系統設定、通知配置 |

### 3.3 API 模組 (apps/api)

| 模組 | 端點前綴 | 功能說明 |
|------|---------|---------|
| auth | `/api/v1/auth` | 註冊、登入、Google OAuth、JWT 刷新 |
| products | `/api/v1/products` | 產品 CRUD、搜尋、分類篩選 |
| orders | `/api/v1/orders` | 訂單建立、狀態更新、取消 |
| cart | `/api/v1/cart` | 購物車 CRUD、數量調整 |
| payments | `/api/v1/payments` | ECPay 整合、回調處理 |
| farm-tours | `/api/v1/farm-tours` | 體驗活動 CRUD、預訂管理 |
| members | `/api/v1/members` | 會員等級、積點、獎勵 |
| notifications | `/api/v1/notifications` | 站內通知、已讀標記 |
| reports | `/api/v1/admin/reports` | 銷售統計、匯出 |
| reviews | `/api/v1/reviews` | 評論 CRUD、審核 |
| locations | `/api/v1/locations` | 地區資料 |
| schedules | `/api/v1/schedules` | 排程管理 |
| discounts | `/api/v1/discounts` | 折扣碼管理 |
| email | `/api/v1/email` | 郵件發送（Resend） |
| search | `/api/v1/search` | 全文搜尋 |
| health | `/health` | 健康檢查 |
| social-posts | `/api/v1/social-posts` | 社群動態 |

---

## 4. 資料庫架構

### 4.1 模型清單（29 個）

**會員系統**：
| 模型 | 說明 |
|------|------|
| User | 用戶基本資料 |
| UserProfile | 用戶擴展資料（地址、偏好） |
| MemberTier | 會員等級定義 |
| MemberReward | 會員獎勵（生日、升級） |
| PointTransaction | 積點交易記錄 |

**產品系統**：
| 模型 | 說明 |
|------|------|
| Product | 產品基本資料 |
| ProductImage | 產品圖片 |
| ProductCategory | 產品分類 |
| ProductTag | 產品標籤 |
| ProductVariant | 產品變體（規格） |

**訂單系統**：
| 模型 | 說明 |
|------|------|
| Order | 訂單主表 |
| OrderItem | 訂單項目 |
| OrderStatusHistory | 訂單狀態歷史 |
| Payment | 支付記錄 |
| ShippingInfo | 配送資訊 |

**購物車**：
| 模型 | 說明 |
|------|------|
| Cart | 購物車主表 |
| CartItem | 購物車項目 |

**農村旅遊**：
| 模型 | 說明 |
|------|------|
| FarmTour | 體驗活動 |
| FarmTourDate | 活動日期 |
| FarmTourBooking | 預訂記錄 |
| FarmTourImage | 活動圖片 |

**其他**：
| 模型 | 說明 |
|------|------|
| Review | 產品評論 |
| Notification | 站內通知 |
| DiscountCode | 折扣碼 |
| Location | 地區資料 |
| SocialPost | 社群動態 |
| AuditLog | 審計日誌 |
| RefreshToken | JWT 刷新令牌 |

### 4.2 關鍵索引優化

已建立 **6 個複合索引** 優化常見查詢：
- `Order(userId, status, createdAt)` - 用戶訂單查詢
- `Product(categoryId, status, createdAt)` - 產品列表篩選
- `PointTransaction(userId, type, createdAt)` - 積點記錄查詢
- 其他高頻查詢索引

---

## 5. 安全防護

### 5.1 六層安全架構

```
┌─────────────────────────────────────────────────┐
│ Layer 1: 環境變數驗證（Joi Schema）               │
│   - 啟動時驗證必要變數存在                        │
│   - JWT_SECRET 強制配置（無預設值）               │
├─────────────────────────────────────────────────┤
│ Layer 2: HTTP 安全標頭（Helmet）                 │
│   - X-Content-Type-Options: nosniff              │
│   - X-Frame-Options: DENY                        │
│   - Strict-Transport-Security (HSTS)             │
│   - 移除 X-Powered-By                            │
├─────────────────────────────────────────────────┤
│ Layer 3: Content Security Policy (CSP)          │
│   - API 層 CSP 配置                              │
│   - Next.js 層 CSP 配置                          │
├─────────────────────────────────────────────────┤
│ Layer 4: 速率限制（@nestjs/throttler）          │
│   - 全域限制：60 req/min                         │
│   - 登入端點：5 req/min                          │
│   - 註冊端點：3 req/min                          │
├─────────────────────────────────────────────────┤
│ Layer 5: CSRF 防護                              │
│   - Double Submit Cookie 模式                   │
│   - @SkipCsrf 豁免裝飾器                        │
├─────────────────────────────────────────────────┤
│ Layer 6: 認證與授權                             │
│   - JWT 認證（RS256）                           │
│   - Google OAuth 整合                           │
│   - 角色權限控制（RBAC）                        │
└─────────────────────────────────────────────────┘
```

### 5.2 環境變數驗證

使用 **Joi** 在應用啟動時驗證：

```typescript
// apps/api/src/config/env.validation.ts
export const envValidationSchema = Joi.object({
  // 資料庫
  DATABASE_URL: Joi.string().uri().required(),

  // JWT（強制配置，無預設值）
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),

  // 服務
  PORT: Joi.number().default(3001),
  NODE_ENV: Joi.string().valid('development', 'production', 'test'),

  // 外部服務
  SUPABASE_URL: Joi.string().uri(),
  ECPAY_MERCHANT_ID: Joi.string(),
  // ...
});
```

### 5.3 密碼安全要求

- 最少 8 個字元
- 至少一個大寫字母
- 至少一個小寫字母
- 至少一個數字

---

## 6. 測試基礎設施

### 6.1 單元測試（Jest/Vitest）

| 模組 | 測試檔案 | 測試案例 |
|------|---------|---------|
| Orders | `orders.service.spec.ts` | 50+ |
| Auth | `auth.service.spec.ts` | 30+ |
| Products | `products.service.spec.ts` | 40+ |
| Payments | `payments.service.spec.ts` | 25+ |
| 其他 | 各模組 spec 檔案 | 50+ |
| **總計** | **10 個檔案** | **195 個** |

**執行指令**：
```bash
cd apps/api && pnpm test          # 執行所有測試
cd apps/api && pnpm test:cov      # 含覆蓋率報告
```

### 6.2 E2E 測試（Playwright）

| 測試套件 | 測試案例數 | 涵蓋範圍 |
|---------|----------|---------|
| auth.spec.ts | 8 | 登入、註冊、登出、錯誤處理 |
| shopping.spec.ts | 8 | 產品瀏覽、購物車、數量調整 |
| checkout.spec.ts | 6 | 結帳流程、表單驗證、訂單建立 |
| **總計** | **22 個** | 核心用戶旅程 |

**執行指令**：
```bash
cd apps/web && pnpm e2e           # 執行 E2E 測試
cd apps/web && pnpm e2e:ui        # 互動式 UI 模式
```

**Playwright 配置亮點**：
- 多瀏覽器支援（Chromium、Firefox、WebKit）
- 自動等待機制
- 截圖與錄影（失敗時）
- 平行執行

### 6.3 負載測試（k6）

**5 階段測試情境**：

| 階段 | 持續時間 | 虛擬用戶 | 目的 |
|------|---------|---------|------|
| Ramp-up | 2m | 0→50 | 漸進加壓 |
| Plateau | 5m | 50 | 穩定負載 |
| Spike | 1m | 50→100 | 壓力測試 |
| Recovery | 2m | 100→50 | 恢復測試 |
| Ramp-down | 2m | 50→0 | 漸進減壓 |

**效能閾值**：
```javascript
thresholds: {
  http_req_duration: ['p(95)<500'],  // 95% 請求 < 500ms
  http_req_failed: ['rate<0.01'],    // 錯誤率 < 1%
}
```

**測試端點**：
- `GET /health` - 健康檢查
- `GET /api/v1/products` - 產品列表
- `POST /api/v1/auth/login` - 登入（含思考時間）

**執行指令**：
```bash
k6 run load-tests/api-load.js
```

---

## 7. 部署架構

### 7.1 Docker 配置

**多階段建置**（apps/api/Dockerfile）：
```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
# 安裝 pnpm、複製 lockfile、安裝依賴

# Stage 2: Builder
FROM node:20-alpine AS builder
# 複製原始碼、生成 Prisma Client、建置應用

# Stage 3: Runner
FROM node:20-alpine AS runner
# 最小化映像、僅複製必要檔案
# 執行使用者設為非 root
```

### 7.2 環境變數清單

**必要變數**（生產環境）：

| 變數 | 說明 | 範例 |
|------|------|------|
| `DATABASE_URL` | PostgreSQL 連線字串 | `postgresql://...` |
| `JWT_SECRET` | JWT 簽章金鑰（≥32字元） | `your-super-secret-key` |
| `FRONTEND_URL` | 前端 URL（CORS） | `https://haude.com` |
| `SUPABASE_URL` | Supabase 專案 URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase 匿名金鑰 | `eyJhbGc...` |

**可選變數**：

| 變數 | 說明 | 預設值 |
|------|------|-------|
| `PORT` | API 服務埠 | `3001` |
| `NODE_ENV` | 執行環境 | `development` |
| `JWT_EXPIRES_IN` | Token 過期時間 | `7d` |

### 7.3 Port 管理

| 服務 | Port | 說明 |
|------|------|------|
| web | 5173 | Next.js 用戶端 |
| api | 3001 | NestJS 後端 API |
| admin | 5174 | Vite 管理後台 |

### 7.4 健康檢查

**API 健康檢查端點**：
```
GET /health
```

**回應範例**：
```json
{
  "status": "ok",
  "timestamp": "2026-01-21T03:00:00.000Z",
  "database": "connected"
}
```

---

## 8. 優點分析

### 8.1 企業級架構設計

- **Monorepo 最佳實踐**：pnpm + Turborepo 實現高效依賴管理和智慧建置快取
- **清晰專案分離**：web、admin、api 各自獨立，透過共用 types 套件確保型別一致性
- **模組化後端架構**：18 個 NestJS 模組各司其職，職責清晰

### 8.2 現代化技術選型

- **最新框架版本**：Next.js 15.3.4、React 19.2、NestJS 11.0.1、Prisma 7.1.0
- **App Router 架構**：善用 Server Components、ISR、Streaming
- **TypeScript 全端覆蓋**：從前端到後端完整型別安全

### 8.3 完善業務功能

- **會員等級系統**：四級會員制度，含積點、生日獎勵、自動升級機制
- **多元收入模式**：產品銷售 + 農村旅遊體驗預訂
- **本地化支付**：ECPay 整合符合台灣市場需求

### 8.4 優秀程式碼品質

- **極低技術債**：435 個檔案僅 4 個 TODO/FIXME 標記（0.9% 標記率）
- **完善測試覆蓋**：195 單元測試 + 22 E2E 測試 + k6 負載測試
- **Swagger API 文件**：自動生成，含完整回應型別

### 8.5 完善安全防護

- **6 層安全架構**：環境驗證 → Helmet → CSP → 速率限制 → CSRF → JWT
- **啟動時驗證**：Joi Schema 確保必要環境變數存在
- **無不安全預設值**：JWT_SECRET 必須明確配置

### 8.6 效能監控基礎設施

- **Web Vitals 追蹤**：CLS、FCP、INP、LCP、TTFB 即時監控
- **慢查詢監控**：Prisma 100ms 閾值警告
- **API 效能追蹤**：全域 Interceptor 監控，500ms 閾值警告
- **Bundle 分析**：@next/bundle-analyzer 視覺化套件大小

### 8.7 快取策略優化

- **Next.js ISR/SSG**：首頁 30 分鐘、列表頁 1 小時增量靜態再生
- **HTTP Cache-Control**：API GET 請求 5 分鐘快取，支援 CDN
- **stale-while-revalidate**：背景更新時仍返回舊內容

### 8.8 開發者體驗

- **統一指令**：`pnpm dev` 一鍵啟動所有服務
- **固定 Port 管理**：避免端口衝突問題
- **完善文件**：README、CLAUDE.md、TESTING.md 提供清晰指引
- **CI/CD 自動化**：GitHub Actions 自動執行 lint、type-check、測試與建置

---

## 9. 改進空間

### 9.1 監控與日誌

**現況**：基礎效能監控已建立（Web Vitals、慢查詢監控、API 請求追蹤）

**建議**：
- 整合結構化日誌（如 Pino、Winston）
- 加入 APM 監控（如 Sentry、New Relic）
- 建立集中式日誌管理

### 9.2 快取策略

**已完成**：
- ✅ Next.js ISR/SSG 優化
- ✅ HTTP 快取標頭

**建議**：
- 實作 Redis 快取層（適用於高流量場景）

### 9.3 文件完善

**已完成**：
- ✅ README 完整
- ✅ Swagger API 文件
- ✅ TESTING.md 測試指南

**建議**：
- 補充 API 使用範例（含 curl/SDK 示範）
- 新增貢獻指南（CONTRIBUTING.md）

---

## 10. 整體評分

| 評估面向 | 分數 (1-10) | 說明 |
|---------|-------------|------|
| **架構設計** | 9 | Monorepo 結構清晰，模組化程度高 |
| **程式碼品質** | 8.5 | 技術債極低，命名規範一致 |
| **功能完整性** | 8.5 | 電商核心功能完備，會員系統完善 |
| **技術選型** | 9 | 現代化技術棧，版本更新及時 |
| **測試覆蓋** | **8.5** | 195 單元 + 22 E2E + k6 負載測試 |
| **文件品質** | 8 | README 完整，TESTING.md 新增 |
| **安全性** | **9** | 6 層安全架構，環境變數驗證完善 |
| **生產就緒度** | 8.5 | CI/CD、Docker、測試基礎設施完備 |
| **可維護性** | 8.5 | 結構清晰，易於擴展 |
| **開發者體驗** | 8 | 工具鏈完善，指令統一 |

### 總體評分：8.55 / 10

**評語**：這是一個架構優秀、程式碼品質高的專業級電商專案。經過多輪改進後，專案已具備：

**已完成改進**：
1. ✅ 完整 CI/CD 流程（GitHub Actions）
2. ✅ 195 個單元測試 + 22 個 E2E 測試
3. ✅ k6 負載測試（5 階段情境）
4. ✅ 多層級速率限制 + 敏感端點加強保護
5. ✅ API 版本控制（`/api/v1` 前綴）
6. ✅ 資料庫索引優化（6 個複合索引）
7. ✅ Bundle 優化 + 動態導入
8. ✅ API 文件完善（Swagger 回應型別）
9. ✅ ADR 架構決策記錄
10. ✅ 安全性強化（Helmet、CSP、安全標頭、安全掃描）
11. ✅ 效能監控（Web Vitals、慢查詢監控、API 效能追蹤）
12. ✅ 統一錯誤處理（全域異常過濾器）
13. ✅ CSRF 防護（Double Submit Cookie）
14. ✅ **環境變數驗證（Joi Schema）**
15. ✅ **密碼強度要求（8+ 字元、混合大小寫、數字）**

**剩餘改進空間**：APM 監控整合、Redis 快取層（高流量場景）

對於展示作品集或團隊協作來說，這是一個**生產就緒**的優秀專案。

---

## 附錄：技術棧版本明細

```json
{
  "monorepo": {
    "pnpm": "9.15.0",
    "turborepo": "2.x"
  },
  "apps/web": {
    "next": "15.3.4",
    "react": "19.2",
    "tailwindcss": "4.x",
    "zustand": "5.x",
    "next-intl": "4.x",
    "typescript": "5.9"
  },
  "apps/admin": {
    "react": "19.2",
    "vite": "7.2.4",
    "tailwindcss": "4.x",
    "react-router-dom": "7.x",
    "typescript": "5.7"
  },
  "apps/api": {
    "nestjs": "11.0.1",
    "prisma": "7.1.0",
    "postgresql": "15.x",
    "joi": "17.x",
    "helmet": "8.x",
    "typescript": "5.7"
  },
  "testing": {
    "jest": "29.x",
    "vitest": "3.x",
    "playwright": "1.50.x",
    "k6": "latest"
  }
}
```

---

*本報告由 Claude Code 自動生成，基於程式碼庫深度分析。最後更新：2026-01-21*
