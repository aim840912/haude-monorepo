import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'

// Storage key 常數
const AUTH_STORAGE_KEY = 'auth-storage'
const REMEMBER_ME_KEY = 'auth-remember-me'

export interface User {
  id: string
  email: string
  name: string
  role?: 'USER' | 'ADMIN'
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

      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => dynamicStorage),
    }
  )
)
