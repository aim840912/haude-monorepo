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

/**
 * What the store keeps (and persists to localStorage). Email and role are
 * dropped on purpose: localStorage is readable by any script on the page and
 * nothing reads them from the store — the role check uses `isAdmin`, and the
 * API re-checks the role on every request anyway.
 */
export type SessionUser = Pick<AdminUser, 'id' | 'name' | 'avatar'>

interface AuthState {
  user: SessionUser | null
  isAuthenticated: boolean
  isAdmin: boolean
  isHydrated: boolean
  setAuth: (user: AdminUser) => void
  logout: () => void
  setHydrated: (value: boolean) => void
}

const toSessionUser = (u: SessionUser): SessionUser => ({
  id: u.id,
  name: u.name,
  avatar: u.avatar,
})

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      isHydrated: false,

      setAuth: (user) =>
        set({
          user: toSessionUser(user),
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
      // v0 stored the whole user (email, role, createdAt); slim it on load.
      version: 1,
      migrate: (persisted) => {
        const state = persisted as { user?: SessionUser | null } | null
        if (state?.user) state.user = toSessionUser(state.user)
        return state as unknown as AuthState
      },
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    }
  )
)
