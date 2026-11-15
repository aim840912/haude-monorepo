import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore, type AdminUser } from './authStore'

const admin: AdminUser = {
  id: 'u-1',
  email: 'owner@example.com',
  name: '店長',
  role: 'ADMIN',
  avatar: 'https://example.com/a.png',
  createdAt: '2026-01-01T00:00:00.000Z',
}

describe('admin authStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.getState().logout()
  })

  it('derives isAdmin from the role', () => {
    useAuthStore.getState().setAuth(admin)
    expect(useAuthStore.getState().isAdmin).toBe(true)

    useAuthStore.getState().setAuth({ ...admin, role: 'USER' })
    expect(useAuthStore.getState().isAdmin).toBe(false)
  })

  it('does not persist email or role to localStorage', () => {
    useAuthStore.getState().setAuth(admin)

    const raw = localStorage.getItem('admin-auth-storage') ?? ''
    expect(raw).not.toContain('owner@example.com')
    expect(raw).not.toContain('"role"')
    expect(raw).toContain('店長')
  })
})
