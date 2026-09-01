'use client'

// 模組層級的 singleton（axios 實例 / Zustand store）：在 Server Component
// 匯入會變成同一個 Node 實例上所有並行請求共用，造成跨使用者資料外洩。
// 'use client' 讓它只能在瀏覽器端運行。
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useCartStore } from './cartStore'

// Storage key constant
const AUTH_STORAGE_KEY = 'auth-storage'

export interface User {
  id: string
  email: string
  name: string
  role?: 'USER' | 'VIP' | 'STAFF' | 'ADMIN'
  avatar?: string // Google OAuth avatar
  // Membership-related
  memberLevel?: 'NORMAL' | 'BRONZE' | 'SILVER' | 'GOLD'
  totalSpent?: number
  currentPoints?: number
  birthday?: string
  createdAt: string
}

interface AuthState {
  user: User | null
  csrfToken: string | null
  isAuthenticated: boolean
  setAuth: (user: User, csrfToken?: string) => void
  setCsrfToken: (csrfToken: string) => void
  logout: () => void
}

/**
 * Clear all auth-related storage (called on logout)
 */
export function clearAllAuthStorage(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY)
  sessionStorage.removeItem(AUTH_STORAGE_KEY)
}

/**
 * Unified auth check function (used by other modules like cartStore)
 * With httpOnly cookies, we check if user exists in store
 */
export function isAuthenticated(): boolean {
  try {
    const authStorage =
      localStorage.getItem(AUTH_STORAGE_KEY) ||
      sessionStorage.getItem(AUTH_STORAGE_KEY)
    if (authStorage) {
      const parsed = JSON.parse(authStorage)
      return !!parsed?.state?.user
    }
  } catch {
    // ignore parsing errors
  }
  return false
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      csrfToken: null,
      isAuthenticated: false,

      setAuth: (user, csrfToken) =>
        set({
          user,
          csrfToken: csrfToken ?? null,
          isAuthenticated: true,
        }),

      setCsrfToken: (csrfToken) =>
        set({ csrfToken }),

      logout: () => {
        // Clear local cart (avoid stale guest cart after logout)
        localStorage.removeItem('cart-storage')
        useCartStore.setState({ items: [] }) // Reset cart in-memory state for immediate UI update
        set({
          user: null,
          csrfToken: null,
          isAuthenticated: false,
        })
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      version: 1,
      // v0 的 OAuth callback 把 /auth/me 的 { user } 信封整包存成 user，
      // 讓 user.role / user.name 變成 undefined。這裡把多包的那層拆回來，
      // 已受影響的使用者下次載入即自動修復，不需要重新登入。
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as { user?: unknown } | null
        if (
          version === 0 &&
          state?.user &&
          typeof state.user === 'object' &&
          'user' in state.user
        ) {
          return { ...state, user: (state.user as { user: User }).user }
        }
        return state
      },
    }
  )
)
