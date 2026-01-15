import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import { useCartStore } from './cartStore'

// Storage key 常數
const AUTH_STORAGE_KEY = 'auth-storage'
const REMEMBER_ME_KEY = 'auth-remember-me'

export interface User {
  id: string
  email: string
  name: string
  role?: 'USER' | 'VIP' | 'STAFF' | 'ADMIN'
  avatar?: string // Google OAuth 頭像
  // 會員等級相關
  memberLevel?: 'NORMAL' | 'BRONZE' | 'SILVER' | 'GOLD'
  totalSpent?: number
  currentPoints?: number
  birthday?: string
  createdAt: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
}

// ==================== 「記住我」功能函數 ====================

/**
 * 取得「記住我」偏好設定
 * @returns 如果之前有勾選「記住我」則返回 true
 */
export function getRememberMe(): boolean {
  return localStorage.getItem(REMEMBER_ME_KEY) === 'true'
}

/**
 * 設定「記住我」偏好
 * @param value 是否記住登入狀態
 */
export function setRememberMe(value: boolean): void {
  if (value) {
    localStorage.setItem(REMEMBER_ME_KEY, 'true')
  } else {
    localStorage.removeItem(REMEMBER_ME_KEY)
  }
}

/**
 * 清除所有認證相關的 storage（登出時呼叫）
 */
export function clearAllAuthStorage(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY)
  sessionStorage.removeItem(AUTH_STORAGE_KEY)
  localStorage.removeItem(REMEMBER_ME_KEY)
}

/**
 * 統一的認證檢查函數（供其他模組使用，如 cartStore）
 * 同時檢查 localStorage 和 sessionStorage，配合 dynamicStorage 的存儲策略
 */
export function isAuthenticated(): boolean {
  try {
    const authStorage =
      localStorage.getItem(AUTH_STORAGE_KEY) ||
      sessionStorage.getItem(AUTH_STORAGE_KEY)
    if (authStorage) {
      const parsed = JSON.parse(authStorage)
      return !!parsed?.state?.token
    }
  } catch {
    // ignore parsing errors
  }
  return false
}

/**
 * 自定義 Storage Adapter
 * 根據「記住我」偏好動態選擇 localStorage 或 sessionStorage
 */
const dynamicStorage: StateStorage = {
  getItem: (name: string): string | null => {
    // 優先從 localStorage 讀取（如果有 remember-me 設定）
    // 否則從 sessionStorage 讀取
    const rememberMe = getRememberMe()
    if (rememberMe) {
      return localStorage.getItem(name)
    }
    // 沒有 remember-me 時，優先檢查 sessionStorage
    const sessionData = sessionStorage.getItem(name)
    if (sessionData) return sessionData
    // 如果 sessionStorage 也沒有，檢查 localStorage（向後兼容）
    return localStorage.getItem(name)
  },
  setItem: (name: string, value: string): void => {
    const rememberMe = getRememberMe()
    if (rememberMe) {
      localStorage.setItem(name, value)
      sessionStorage.removeItem(name) // 清除另一邊
    } else {
      sessionStorage.setItem(name, value)
      localStorage.removeItem(name) // 清除另一邊
    }
  },
  removeItem: (name: string): void => {
    localStorage.removeItem(name)
    sessionStorage.removeItem(name)
  },
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
        }),

      logout: () => {
        // 清除本地購物車（避免登出後還顯示之前的訪客購物車）
        localStorage.removeItem('cart-storage')
        useCartStore.setState({ items: [] }) // 重置購物車記憶體狀態，讓 UI 立即更新
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => dynamicStorage),
    }
  )
)
