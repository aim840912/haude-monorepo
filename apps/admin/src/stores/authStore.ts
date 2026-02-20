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
  isAuthenticated: boolean
  isAdmin: boolean
  isHydrated: boolean
  setAuth: (user: AdminUser) => void
  logout: () => void
  setHydrated: (value: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      isHydrated: false,

      setAuth: (user) =>
        set({
          user,
          isAuthenticated: true,
          isAdmin: user.role === 'ADMIN',
        }),

      logout: () => {
        set({
          user: null,
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
