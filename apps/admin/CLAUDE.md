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

| 技術 | 版本 | 用途 |
|------|------|------|
| Vite | 7.3 | 建置工具 |
| React | 19.2 | UI 框架 |
| TypeScript | 5.9 | 類型系統 |
| React Router | 7.11 | 路由管理 |
| Tailwind CSS | 4.1 | 樣式框架 |
| Axios | 1.13 | HTTP 客戶端 |
| lucide-react | 0.560 | 圖示庫 |

---

## 專案結構

```
src/
├── components/          # React 元件
│   ├── Layout.tsx      # 管理後台布局
│   ├── Sidebar.tsx     # 側邊欄導航
│   └── DataTable.tsx   # 資料表格
├── pages/               # 頁面元件
│   ├── Dashboard.tsx   # 儀表板
│   ├── ProductsPage.tsx    # 產品管理
│   ├── OrdersPage.tsx      # 訂單管理
│   └── UsersPage.tsx       # 使用者管理
├── services/            # API 服務層
│   └── api.ts          # Axios 實例
├── hooks/               # 自訂 Hooks
│   ├── useProducts.ts  # 產品資料 Hook
│   └── useOrders.ts    # 訂單資料 Hook
├── types/               # TypeScript 類型
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

使用 React Router 7：

```tsx
// App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { ProductsPage } from './pages/ProductsPage'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="users" element={<UsersPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
```

### 表格元件模式

管理後台大量使用資料表格：

```tsx
interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onRowClick?: (row: T) => void
  isLoading?: boolean
}

export function DataTable<T>({
  data,
  columns,
  onRowClick,
  isLoading
}: DataTableProps<T>) {
  if (isLoading) {
    return <TableSkeleton columns={columns.length} />
  }

  return (
    <table className="w-full">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr
            key={idx}
            onClick={() => onRowClick?.(row)}
            className="hover:bg-gray-50 cursor-pointer"
          >
            {columns.map((col) => (
              <td key={col.key}>{col.render(row)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

---

## API 整合

### 環境變數

Vite 使用 `import.meta.env.VITE_*`：

```typescript
// ✅ 正確：Vite 環境變數
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// ❌ 錯誤：Next.js 語法
const API_URL = process.env.NEXT_PUBLIC_API_URL  // 不支援
```

### .env 檔案

```env
# .env.development
VITE_API_URL=http://localhost:3001
```

### API 服務

```typescript
// services/api.ts
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
})

// 請求攔截器：自動附加 Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 回應攔截器：處理錯誤
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

### 自訂 Hooks

```typescript
// hooks/useProducts.ts
import { useState, useEffect } from 'react'
import api from '../services/api'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      const { data } = await api.get('/admin/products')
      setProducts(data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }

  const createProduct = async (product: CreateProductDto) => {
    const { data } = await api.post('/admin/products', product)
    setProducts((prev) => [...prev, data])
    return data
  }

  const updateProduct = async (id: string, product: UpdateProductDto) => {
    const { data } = await api.put(`/admin/products/${id}`, product)
    setProducts((prev) => prev.map((p) => (p.id === id ? data : p)))
    return data
  }

  const deleteProduct = async (id: string) => {
    await api.delete(`/admin/products/${id}`)
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  return {
    products,
    isLoading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  }
}
```

---

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


<claude-mem-context>
# Recent Activity

<!-- This section is auto-generated by claude-mem. Edit content outside the tags. -->

*No recent activity*
</claude-mem-context>