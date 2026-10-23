# 前端開發指南（Next.js App Router）

## 📑 目錄

- [快速開始](#-快速開始)
- [專案結構](#-專案結構)
- [App Router 規範](#-app-router-規範)
- [狀態管理](#-狀態管理)
- [API 整合](#-api-整合)
- [品質標準](#-品質標準)

---

## 快速開始

### 5 秒速查

```bash
# 開發前必做
npm run build  # TypeScript 檢查 + 建置

# 常用指令
npm run dev    # 啟動開發伺服器 (Next.js)
npm run lint   # ESLint 檢查
```

### 常用指令

```bash
npm run dev      # 啟動開發伺服器 http://localhost:3000
npm run build    # TypeScript 檢查 + 生產建置
npm run lint     # ESLint 程式碼檢查
npm run start    # 啟動生產版本
```

### 技術棧

| 技術         | 版本  | 用途                  |
| ------------ | ----- | --------------------- |
| Next.js      | 15.5  | 全端框架 (App Router) |
| React        | 19.2  | UI 框架               |
| TypeScript   | 5.9   | 類型系統              |
| Zustand      | 5.0   | 狀態管理              |
| Tailwind CSS | 4.1   | 樣式框架              |
| Axios        | 1.13  | HTTP 客戶端           |
| lucide-react | 0.560 | 圖示庫                |

---

## 專案結構

```
src/
├── app/                  # Next.js App Router
│   ├── layout.tsx       # 根 Layout
│   ├── page.tsx         # 首頁
│   ├── login/page.tsx   # 登入頁
│   ├── products/
│   │   ├── page.tsx     # 產品列表
│   │   └── [id]/page.tsx # 產品詳情（動態路由）
│   └── admin/           # 管理後台路由
├── components/          # React 元件
│   ├── Layout.tsx       # 全局布局
│   └── ProtectedRoute.tsx  # 路由保護
├── stores/              # Zustand 狀態管理
│   └── authStore.ts     # 認證狀態
├── services/            # API 服務層
│   └── api.ts           # Axios 實例
├── hooks/               # 自訂 Hooks
├── types/               # TypeScript 類型
├── utils/               # 工具函數
└── lib/                 # 共用函式庫
```

---

## App Router 規範

> **詳見全域規則**：`~/.claude/rules/nextjs-components.md`
> 包含：Client/Server Components 判斷、動態路由參數、useSearchParams + Suspense 等完整說明

### 本專案關鍵提醒

- **動態路由**：Next.js 15+ 的 `params` 是 Promise，用 `use(params)` 解開
- **useSearchParams**：必須包在 `<Suspense>` 中
- **預設 Server Component**：只在需要 hooks/事件處理時加 `'use client'`

### 路由保護

使用 `ProtectedRoute` 元件：

```tsx
// app/dashboard/page.tsx
'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { DashboardContent } from './DashboardContent'

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
```

---

## 狀態管理

### Zustand Store（與之前相同）

```typescript
// stores/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    { name: 'auth-storage' }
  )
)
```

---

## API 整合

### 環境變數

Next.js 使用 `process.env.NEXT_PUBLIC_*`：

```typescript
// ✅ 正確：Next.js 環境變數
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// ❌ 錯誤：Vite 語法
const API_URL = import.meta.env.VITE_API_URL // 不支援
```

### .env 檔案

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_USE_MOCK=false
```

---

## 安全注意事項

### JSON-LD 一律用 `safeJsonLd()`

輸出 JSON-LD 結構化資料時，**必須**使用 `@/lib/json-ld` 的 `safeJsonLd()`，不可直接
`JSON.stringify()`。後者不跳脫 `<`，含使用者/管理員可編輯欄位（產品名稱、描述）時
可被 `</script><script>` 跳出標籤造成 stored XSS。

### CSP 不使用 nonce（刻意決定）

`next.config.ts` 的 `script-src` 保留 `'unsafe-inline'`。改用 nonce 會讓全站退出 SSG
（實測：幾乎所有路由都是 `●` 預渲染，會全部變成 `ƒ`），並使 `s-maxage` CDN 快取失效。
**因此 CSP 擋不住 inline 注入**——防線是輸出端跳脫，不是 CSP。詳見 `next.config.ts`
的 `buildCsp()` 註解。

---

### 個人化回應絕不進共享快取

`Cache-Control: public` 是在告訴 CDN「這份回應可以存起來發給其他人」。一旦某個
含使用者資料的頁面帶著它，第一個訪客的頁面就會被發給所有後續訪客 —— 症狀是
「多台不同電腦看到同一個陌生人的帳號」。

三條規則：

1. **新增任何個人化路由時，把路由前綴加進 `next.config.ts` 的 `PERSONALIZED_PATHS`**。
   該常數同時餵給 header 規則與 `src/lib/cache-headers.test.ts`，漏加會被測試抓到
   （前提是也把路徑補進測試的 `PERSONALIZED` 清單）。
2. **Server Component 讀 `cookies()` 的頁面，其路由必須在 `PERSONALIZED_PATHS` 內**。
   目前全站沒有任何 Server Component 讀 cookie，個資都在瀏覽器端渲染；這是現況，
   不是保證。
3. **模組層級的 singleton 一律標 `'use client'`**（`services/api.ts`、`stores/*.ts`）。
   在 Server Component 匯入這些檔案，共用的 axios 實例與 Zustand store 會變成同一個
   Node 實例上所有並行請求共用 —— 那是跨使用者身分外洩。

部署後用 `node scripts/check-cache-headers.mjs https://haude-web.vercel.app` 驗收。
這是唯一能抓到「平台 Dashboard 規則覆蓋了程式碼設定」的方法。

---

## 深色模式（2026-10-23 補完並加回切換按鈕）

- **只補 `dark:` 變體，不改淺色外觀**：例如 `bg-gray-50 dark:bg-background`、`text-gray-600 dark:text-text-secondary`。
  直接把 `bg-gray-50` 換成 token 會讓淺色模式也變色（冷灰 → 暖米）。
- **要不要補 `dark:` 文字色，看祖先的底色，不是看自己的 class**：同一串 `text-gray-600 leading-relaxed`
  在商品頁落在頁面底色上（要補），在果園頁包在 `bg-white` 卡片裡（深色模式仍是白底，補了反而變白底淺字）。
  不要用 grep 找同樣的 class 一起改，只改實際量到有問題的元素。
- `:root` 新增要當 utility 用的顏色變數，必須同時註冊進 `globals.css` 的 `@theme inline`，否則 class 編譯成空的且不報錯。
- 驗收方式：Playwright 設 `localStorage.haude-theme`，對每頁所有文字元素算與最近不透明祖先底色的對比，
  **每頁插一個已知不合格的對照元素**，並與淺色模式的結果相減（兩種模式都失敗的是淺色既有問題，不屬深色範圍）。
  已知誤報：半透明底（如 `bg-white/90` 的 hover 提示）會被跳過、改拿外層底色計算。

---

## 品質標準

### 完成定義

- [ ] TypeScript 類型檢查通過（`npm run build`）
- [ ] ESLint 無錯誤（`npm run lint`）
- [ ] Client/Server Components 正確分離
- [ ] 動態路由使用 `use(params)` 解開 Promise
- [ ] `useSearchParams()` 包在 Suspense 中

---

## 相關文件

- **專案總覽**：`../../CLAUDE.md`
- **全域規範**：`~/.claude/CLAUDE.md`

<claude-mem-context>
# Recent Activity

<!-- This section is auto-generated by claude-mem. Edit content outside the tags. -->

### Jan 17, 2026

| ID    | Time    | T   | Title                                            | Read |
| ----- | ------- | --- | ------------------------------------------------ | ---- |
| #1625 | 4:35 PM | 🔵  | Web Frontend Environment Configuration Structure | ~387 |

</claude-mem-context>
