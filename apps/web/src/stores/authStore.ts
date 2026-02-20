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
    }
  )
)
