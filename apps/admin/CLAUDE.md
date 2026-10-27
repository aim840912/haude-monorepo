# 管理後台開發指南（Vite + React）

## 📑 目錄

- [快速開始](#-快速開始)
- [專案結構](#-專案結構)
- [開發規範](#-開發規範)
- [API 整合](#-api-整合)
- [品質標準](#-品質標準)

---

## 快速開始

### 5 秒速查

```bash
# 開發前必做
pnpm build  # TypeScript 檢查 + 建置

# 常用指令
pnpm dev    # 啟動開發伺服器 (Vite)
pnpm lint   # ESLint 檢查
```

### 常用指令

```bash
pnpm dev       # 啟動開發伺服器 http://localhost:5174
pnpm build     # TypeScript 檢查 + 生產建置
pnpm lint      # ESLint 程式碼檢查
pnpm preview   # 預覽生產版本
```

### 技術棧

版本以 `package.json` 為準。

| 技術 | 用途 |
|------|------|
| Vite | 建置工具 |
| React | UI 框架 |
| TypeScript | 類型系統 |
| React Router | 路由管理 |
| Tailwind CSS | 樣式框架 |
| Axios | HTTP 客戶端 |
| lucide-react | 圖示庫 |

---

## 專案結構

```
src/
├── components/          # React 元件
│   └── Layout.tsx      # 管理後台布局
├── pages/               # 頁面元件（*Page.tsx）
│   ├── DashboardPage.tsx   # 儀表板
│   ├── ProductsPage.tsx    # 產品管理
│   └── OrdersPage.tsx      # 訂單管理
├── services/            # API 服務層
│   └── api/client.ts   # Axios 實例（Base URL + API 版本集中在此）
├── hooks/               # 自訂 Hooks
│   ├── useProducts.ts  # 產品資料 Hook
│   └── useOrders.ts    # 訂單資料 Hook
├── utils/               # 工具函數
├── App.tsx              # 應用根元件
├── main.tsx             # 應用入口
└── index.css            # 全域樣式
```

---

## 開發規範

### 元件結構

所有元件都是 Client Component（Vite 不區分 Server/Client）：

```tsx
import { useState, useEffect } from 'react'
import { useProducts } from '../hooks/useProducts'

export function ProductsPage() {
  const { products, isLoading, error } = useProducts()
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">產品管理</h1>
      <ProductTable
        products={products}
        onSelect={setSelectedProduct}
      />
    </div>
  )
}
```

### 路由配置

路由定義在 `src/App.tsx`：React Router 7（`BrowserRouter` + `Routes`），頁面以 `lazy()` 載入 `pages/*Page.tsx`，
需登入的頁面包在 `ProtectedRoute` 裡。新增頁面照既有的 `lazy()` 寫法加一行。

---

## API 整合

### 環境變數

Vite 使用 `import.meta.env.VITE_*`：

```typescript
// ✅ 正確：Vite 環境變數
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

// ❌ 錯誤：Next.js 語法
const API_URL = process.env.NEXT_PUBLIC_API_URL  // 不支援
```

### .env 檔案

```env
# .env.development
VITE_API_BASE_URL=http://localhost:3001
```

### API 服務

共用 Axios 實例在 `services/api/client.ts`（`services/api.ts` 只是向後相容的 re-export）：

- Base URL 讀 `VITE_API_BASE_URL`，API 版本（`/api/v1`）集中在這個檔案
- 認證走 **httpOnly cookie**（`withCredentials: true`）；非安全方法自動附 `X-CSRF-Token`
- 401 時自動呼叫 `/auth/refresh`，並重送排隊中的請求
- ⛔ 不要在 admin 用 `localStorage` 存 token 或手動加 `Authorization` header —— 會繞過 cookie + CSRF 機制

### 自訂 Hooks

照 `hooks/useProducts.ts` 的寫法：呼叫 `services/api` 匯出的模組 API（如 `productsApi`），
型別從 `@haude/types` 匯入，錯誤記錄用 `lib/logger`。

## 品質標準

### 與 Web 專案的差異

| 項目 | Web (Next.js) | Admin (Vite) |
|------|---------------|--------------|
| 環境變數 | `process.env.NEXT_PUBLIC_*` | `import.meta.env.VITE_*` |
| 路由 | App Router | React Router |
| SSR | 支援 | 不支援（純 SPA） |
| Port | 5173 | 5174 |

### 完成定義

- [ ] TypeScript 類型檢查通過（`pnpm build`）
- [ ] ESLint 無錯誤（`pnpm lint`）
- [ ] API 整合使用 Axios 攔截器
- [ ] 表格元件有 Loading 狀態
- [ ] 錯誤處理有使用者友善的提示

---

## 相關文件

- **專案總覽**：`../../CLAUDE.md`
- **全域規範**：`~/.claude/CLAUDE.md`
- **Web 規範**：`../web/CLAUDE.md`
- **API 規範**：`../api/CLAUDE.md`
