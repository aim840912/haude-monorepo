import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AdminUser {
  id: string
  email: string
  name: string
  role: 'USER' | 'ADMIN'
  avatar?: string
  createdAt: string
}

interface AuthState {
  user: AdminUser | null
  token: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  isHydrated: boolean
  setAuth: (user: AdminUser, token: string) => void
  logout: () => void
  setHydrated: (value: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isAdmin: false,
      isHydrated: false,

      setAuth: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
          isAdmin: user.role === 'ADMIN',
        }),

      logout: () => {
        // 清除 localStorage
        localStorage.removeItem('admin-token')
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isAdmin: false,
        })
      },

      setHydrated: (value) => set({ isHydrated: value }),
    }),
    {
      name: 'admin-auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    }
  )
)
