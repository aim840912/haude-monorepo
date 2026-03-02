# 完整前端移植計畫：haude → haude-v2-frontend

## 概述

將 Next.js 專案 `haude` 的前端內容完整移植到 React + Vite 專案 `haude-v2-frontend`。

**來源**：haude (Next.js 15 + App Router) - 1,200+ 檔案
**目標**：haude-v2-frontend (React 19 + Vite 7) - 基礎架構已建立

---

## 移植範圍

### ✅ 要複製的前端內容

| 類別 | 來源路徑 | 目標路徑 | 檔案數 |
|------|----------|----------|--------|
| UI 元件 | `src/components/ui/` | `src/components/ui/` | ~30+ |
| 功能元件 | `src/components/features/` | `src/components/features/` | ~80+ |
| 佈局元件 | `src/components/layouts/` | `src/components/layouts/` | ~10 |
| 管理元件 | `src/components/admin/` | `src/components/admin/` | ~15 |
| 認證元件 | `src/components/auth/` | `src/components/auth/` | ~5 |
| 自訂 Hooks | `src/hooks/` | `src/hooks/` | ~60+ |
| 類型定義 | `src/types/` | `src/types/` | ~25 |
| Context | `src/contexts/` | `src/contexts/` | ~5 |
| 配置 | `src/config/` | `src/config/` | ~5 |
| API 客戶端 | `src/lib/api/` | `src/lib/api/` | ~15 |
| 工具函數 | `src/lib/utils.ts` | `src/utils/` | 部分 |

### ❌ 不複製的後端內容

- `src/app/api/` - Next.js API Routes
- `src/app/actions/` - Server Actions
- `src/services/` - Server-side 服務層
- `src/middleware.ts` - Next.js 中間件
- `src/lib/database/` - 資料庫相關
- `src/lib/cache/` - 伺服器快取
- `src/lib/rate-limiter/` - 速率限制
- `src/lib/middleware/` - 伺服器中間件
- `src/lib/server/` - 伺服器工具

---

## 執行步驟

### 階段 1：準備工作

#### 1.1 檢查並安裝缺少的依賴

```bash
# 比對 package.json 並安裝缺少的前端依賴
npm install clsx class-variance-authority
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-popover
npm install @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-tooltip
npm install date-fns react-day-picker
npm install react-hook-form @hookform/resolvers zod
npm install framer-motion
npm install recharts  # 如需圖表功能
```

#### 1.2 設定路徑別名 (可選但建議)

更新 `vite.config.ts` 和 `tsconfig.app.json` 以支援 `@/` 路徑別名。

---

### 階段 2：複製基礎結構

#### 2.1 類型定義 (types/)

複製純前端類型，排除資料庫相關：
```
src/types/
├── product.ts
├── inquiry.ts
├── order.ts
├── location.ts
├── farmTour.ts
├── schedule.ts
├── siteSettings.ts
├── search.ts
├── auth.ts（調整，移除 Supabase 特定類型）
├── theme.ts
└── api.types.ts（調整，保留前端 API 類型）
```

#### 2.2 工具函數 (utils/)

從 `src/lib/utils.ts` 複製通用工具函數到 `src/utils/`。

---

### 階段 3：複製 UI 元件

#### 3.1 基礎 UI 元件 (components/ui/)

```
src/components/ui/
├── button/
├── calendar/
├── form/
├── icons/
├── image/
├── loading/
├── navigation/
├── search/
├── feedback/
├── error/
└── theme/
```

**注意事項**：
- 移除 `'use client'` 指令（React 不需要）
- 移除 `next/image` → 使用標準 `<img>` 或自訂 Image 元件
- 移除 `next/link` → 使用 `react-router-dom` 的 `<Link>`

---

### 階段 4：複製功能元件

#### 4.1 功能模組 (components/features/)

按業務功能複製：
```
src/components/features/
├── home/           # 首頁區塊
├── products/       # 產品相關（核心）
├── inquiry/        # 詢價系統
├── calendar/       # 日曆系統
├── farm-tour/      # 農場體驗
├── location/       # 地點管理
├── payment/        # 支付表單
├── search/         # 搜尋功能
├── admin/          # 管理面板
├── analytics/      # 分析追蹤（調整）
└── seo/            # SEO（React 需調整）
```

#### 4.2 佈局元件 (components/layouts/)

```
src/components/layouts/
├── RootLayoutContent.tsx（調整）
└── common/
    ├── Header.tsx
    ├── Footer.tsx
    └── header/
```

---

### 階段 5：複製 Hooks

#### 5.1 可直接複製的 Hooks

```
src/hooks/
├── useDebounce.ts
├── useForm.ts
├── useFormValidation.ts
├── useLoadingState.ts
├── useModalAnimation.ts
├── useProductModal.ts
├── useProductFilter.ts
├── useImageUpload.ts
├── useImageBlob.ts
├── useRetryManager.ts
└── useSearchSuggestions.ts
```

#### 5.2 需要調整的 Hooks

這些 hooks 需要調整以使用 API 呼叫而非 Server Actions：
```
├── useInquiries.ts
├── useProductsData.ts
├── useLocations.ts
├── useSchedule.ts
├── useFarmTourCalendar.ts
├── useSiteSettings.ts
└── useCartAccess.ts
```

---

### 階段 6：複製 Context

#### 6.1 保留現有認證

**保留** `src/stores/authStore.ts`（Zustand）作為主要認證狀態管理。

#### 6.2 複製其他 Context

```
src/contexts/
├── CartContext.tsx
├── ThemeContext.tsx
├── AdminSidebarContext.tsx
└── InquiryStatsContext.tsx
```

---

### 階段 7：複製 API 客戶端

#### 7.1 API 客戶端工具

```
src/lib/api/（調整目標路徑可為 src/services/api/）
├── products-api.ts
├── inquiries-api.ts
├── orders-api.ts
├── locations-api.ts
├── farm-tour-api.ts
├── site-settings-api.ts
├── user-interests-api.ts
├── search-api.ts
└── common/
```

**調整**：更新 base URL 指向 haude-v2-backend。

---

### 階段 8：建立頁面路由

#### 8.1 轉換 Next.js Pages 為 React Router

| Next.js 路徑 | React Router 路徑 | 頁面元件 |
|-------------|------------------|---------|
| `/` | `/` | HomePage |
| `/login` | `/login` | LoginPage |
| `/register` | `/register` | RegisterPage |
| `/products` | `/products` | ProductsPage |
| `/products/[id]` | `/products/:id` | ProductDetailPage |
| `/farm-tour` | `/farm-tour` | FarmTourPage |
| `/locations` | `/locations` | LocationsPage |
| `/schedule` | `/schedule` | SchedulePage |
| `/inquiries` | `/inquiries` | InquiriesPage |
| `/inquiries/create` | `/inquiries/create` | CreateInquiryPage |
| `/inquiries/[id]` | `/inquiries/:id` | InquiryDetailPage |
| `/cart` | `/cart` | CartPage |
| `/checkout` | `/checkout` | CheckoutPage |
| `/profile` | `/profile` | ProfilePage |
| `/admin/*` | `/admin/*` | AdminLayout + 子路由 |

---

### 階段 9：調整與修復

#### 9.1 必要的程式碼調整

1. **移除 Next.js 特定程式碼**：
   - `'use client'` 指令
   - `next/image` → `<img>` 或自訂元件
   - `next/link` → `react-router-dom` Link
   - `next/navigation` → `react-router-dom` hooks
   - `next/font` → 標準字體載入

2. **Server Actions → API 呼叫**：
   - 所有 Server Actions 改為呼叫後端 API

3. **環境變數**：
   - `NEXT_PUBLIC_*` → `VITE_*`

---

## 檔案結構預覽（完成後）

```
haude-v2-frontend/src/
├── components/
│   ├── ui/                    # 基礎 UI 元件
│   ├── features/              # 功能模組元件
│   ├── layouts/               # 佈局元件
│   ├── admin/                 # 管理員元件
│   ├── auth/                  # 認證 UI 元件
│   ├── Layout.tsx             # 現有（保留）
│   └── ProtectedRoute.tsx     # 現有（保留）
├── pages/                     # 頁面元件
│   ├── HomePage.tsx
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── DashboardPage.tsx
│   ├── ProductsPage.tsx       # 新增
│   ├── FarmTourPage.tsx       # 新增
│   └── ...                    # 更多頁面
├── hooks/                     # 自訂 Hooks
├── stores/                    # Zustand Stores
│   └── authStore.ts           # 現有（保留）
├── contexts/                  # React Context
├── services/                  # API 服務
│   ├── api.ts                 # 現有（保留）
│   ├── supabase.ts            # 現有（保留）
│   └── api/                   # 新增 API 模組
├── types/                     # TypeScript 類型
├── utils/                     # 工具函數
├── config/                    # 配置
├── lib/                       # 程式庫工具
├── assets/                    # 靜態資源
├── App.tsx                    # 路由配置
├── main.tsx                   # 入口點
└── index.css                  # 樣式
```

---

## 預估工作量

| 階段 | 內容 | 預估檔案數 |
|------|------|-----------|
| 階段 1 | 準備工作 | 2 |
| 階段 2 | 類型定義 | ~20 |
| 階段 3 | UI 元件 | ~30 |
| 階段 4 | 功能元件 | ~100 |
| 階段 5 | Hooks | ~60 |
| 階段 6 | Context | ~5 |
| 階段 7 | API 客戶端 | ~15 |
| 階段 8 | 頁面路由 | ~20 |
| 階段 9 | 調整修復 | 持續 |
| **總計** | | **~250+ 檔案** |

---

## 風險與注意事項

1. **依賴衝突**：確保 React 19 與所有 UI 庫相容
2. **樣式調整**：Tailwind 配置可能需要同步
3. **圖片處理**：Next.js Image 優化功能需自行實現
4. **SEO**：React SPA 的 SEO 需要額外處理（如 react-helmet）
5. **Server Actions**：全部需改為 API 呼叫

---

## 執行建議

1. **分階段執行**：按階段逐步複製，每階段驗證後再進行下一階段
2. **先複製後調整**：先複製檔案，再統一調整 Next.js 特定程式碼
3. **持續測試**：每個階段完成後執行 `npm run build` 確認無錯誤
