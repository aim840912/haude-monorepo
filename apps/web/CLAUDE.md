# 前端開發指南

## 📑 目錄

- [快速開始](#-快速開始)
- [專案結構](#-專案結構)
- [元件開發規範](#-元件開發規範)
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
npm run dev    # 啟動開發伺服器 (Vite HMR)
npm run lint   # ESLint 檢查
```

### 常用指令

```bash
npm run dev      # 啟動開發伺服器 http://localhost:5173
npm run build    # TypeScript 檢查 + 生產建置
npm run lint     # ESLint 程式碼檢查
npm run preview  # 預覽生產版本
```

### 技術棧

| 技術 | 版本 | 用途 |
|------|------|------|
| React | 19.2 | UI 框架 |
| Vite | 7.2 | 建置工具 |
| TypeScript | 5.9 | 類型系統 |
| Zustand | 5.0 | 狀態管理 |
| Tailwind CSS | 4.1 | 樣式框架 |
| React Router | 7.10 | 路由管理 |
| Axios | 1.13 | HTTP 客戶端 |
| lucide-react | 0.560 | 圖示庫 |

---

## 專案結構

```
src/
├── components/           # React 元件
│   ├── Layout.tsx       # 全局布局
│   └── ProtectedRoute.tsx  # 路由保護
├── pages/               # 頁面元件
│   ├── HomePage.tsx
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   └── DashboardPage.tsx
├── stores/              # Zustand 狀態管理
│   └── authStore.ts     # 認證狀態
├── services/            # API 服務層
│   ├── api.ts          # Axios 實例
│   └── supabase.ts     # Supabase 客戶端（可選）
├── hooks/               # 自訂 Hooks
│   └── useAuth.ts      # 認證邏輯
├── types/               # TypeScript 類型
├── utils/               # 工具函數
├── assets/              # 靜態資源
├── App.tsx              # 主應用元件
└── main.tsx             # 入口點
```

---

## 元件開發規範

### 元件結構

```typescript
// ✅ 正確：清晰的元件結構
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import type { User } from '@/types'

interface Props {
  user: User
  onUpdate: (data: User) => void
}

export function UserCard({ user, onUpdate }: Props) {
  const [isEditing, setIsEditing] = useState(false)

  const handleSave = () => {
    onUpdate(user)
    setIsEditing(false)
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      {/* 元件內容 */}
    </div>
  )
}
```

### 圖示使用

使用 `lucide-react` 作為圖示庫：

```tsx
import { User, Settings, LogOut } from 'lucide-react'

<User className="w-5 h-5 text-gray-600" />
<Settings className="w-5 h-5" />
<LogOut className="w-5 h-5 text-red-500" />
```

### 路由保護

使用 `ProtectedRoute` 元件保護需要認證的頁面：

```tsx
// App.tsx
import { ProtectedRoute } from '@/components/ProtectedRoute'

<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  }
/>
```

---

## 狀態管理

### Zustand Store 模式

```typescript
// stores/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) =>
        set({ user, token, isAuthenticated: true }),

      logout: () =>
        set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
```

### Store 使用

```tsx
// 在元件中使用
import { useAuthStore } from '@/stores/authStore'

function Header() {
  const { user, logout, isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <LoginButton />
  }

  return (
    <div>
      <span>{user?.name}</span>
      <button onClick={logout}>登出</button>
    </div>
  )
}
```

---

## API 整合

### Axios 實例

```typescript
// services/api.ts
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request 攔截器：自動添加 Token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response 攔截器：處理 401 錯誤
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

### API 呼叫範例

```typescript
// ✅ 正確：使用 api 實例
import api from '@/services/api'

async function fetchUserProfile() {
  const { data } = await api.get('/auth/me')
  return data
}

async function updateUser(id: string, userData: UpdateUserDto) {
  const { data } = await api.patch(`/users/${id}`, userData)
  return data
}
```

### 認證流程

```typescript
// hooks/useAuth.ts
import { useAuthStore } from '@/stores/authStore'
import api from '@/services/api'

export function useAuth() {
  const { setAuth, logout, isAuthenticated } = useAuthStore()

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password })
    setAuth(data.user, data.access_token)
  }

  const register = async (email: string, password: string, name: string) => {
    const { data } = await api.post('/auth/register', { email, password, name })
    setAuth(data.user, data.access_token)
  }

  return { login, register, logout, isAuthenticated }
}
```

---

## 品質標準

### TypeScript 規範

```typescript
// ✅ 正確：明確的類型定義
interface User {
  id: string
  email: string
  name: string
  role: 'USER' | 'ADMIN'
}

// ❌ 錯誤：使用 any
const user: any = { ... }
```

### 元件大小限制

- 元件建議 **< 200 行**
- 函數建議 **< 30 行**
- Props 建議 **< 7 個**

### 開發前檢查

使用專案指令執行開發檢查：

```bash
/frontend-check
```

### 完成定義

- [ ] TypeScript 類型檢查通過（`npm run build`）
- [ ] ESLint 無錯誤（`npm run lint`）
- [ ] 元件遵循專案慣例
- [ ] 狀態管理使用 Zustand
- [ ] API 使用統一的 api 實例

---

## 相關文件

- **專案總覽**：`../haude-v2/CLAUDE.md`
- **後端規範**：`../haude-v2-backend/CLAUDE.md`
- **全域規範**：`~/.claude/CLAUDE.md`
