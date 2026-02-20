/**
 * Auth Store unit tests
 *
 * Test features:
 * - Login/logout
 * - Auth state management (tokens in httpOnly cookies, only user+csrfToken in store)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from '@testing-library/react'

// Mock cartStore before importing authStore
vi.mock('./cartStore', () => ({
  useCartStore: {
    setState: vi.fn(),
  },
}))

import {
  useAuthStore,
  isAuthenticated,
  clearAllAuthStorage,
  type User,
} from './authStore'
import { useCartStore } from './cartStore'

// Mock user
const createMockUser = (overrides = {}): User => ({
  id: 'user-1',
  email: 'test@example.com',
  name: '測試用戶',
  role: 'USER',
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides,
})

describe('authStore', () => {
  let localStorageMock: Record<string, string>
  let sessionStorageMock: Record<string, string>

  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      user: null,
      csrfToken: null,
      isAuthenticated: false,
    })

    // Reset mocks
    vi.clearAllMocks()

    // Mock localStorage and sessionStorage
    localStorageMock = {}
    sessionStorageMock = {}

    const createStorageMock = (store: Record<string, string>) => ({
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key]
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach((key) => delete store[key])
      }),
      get length() {
        return Object.keys(store).length
      },
      key: vi.fn((index: number) => Object.keys(store)[index] || null),
    })

    Object.defineProperty(window, 'localStorage', {
      value: createStorageMock(localStorageMock),
      writable: true,
    })

    Object.defineProperty(window, 'sessionStorage', {
      value: createStorageMock(sessionStorageMock),
      writable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ========================================
  // Basic auth functionality
  // ========================================

  describe('基本認證功能', () => {
    it('應該設定認證狀態', () => {
      const user = createMockUser()

      act(() => {
        useAuthStore.getState().setAuth(user)
      })

      const state = useAuthStore.getState()
      expect(state.user).toEqual(user)
      expect(state.isAuthenticated).toBe(true)
    })

    it('應該設定 CSRF Token', () => {
      const user = createMockUser()
      const csrfToken = 'csrf-token-456'

      act(() => {
        useAuthStore.getState().setAuth(user, csrfToken)
      })

      expect(useAuthStore.getState().csrfToken).toBe(csrfToken)
    })

    it('應該單獨更新 CSRF Token', () => {
      act(() => {
        useAuthStore.getState().setCsrfToken('new-csrf-token')
      })

      expect(useAuthStore.getState().csrfToken).toBe('new-csrf-token')
    })

    it('應該登出並清除狀態', () => {
      const user = createMockUser()
      act(() => {
        useAuthStore.getState().setAuth(user, 'csrf')
        useAuthStore.getState().logout()
      })

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.csrfToken).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })

    it('登出時應該清除購物車', () => {
      const user = createMockUser()
      act(() => {
        useAuthStore.getState().setAuth(user)
        useAuthStore.getState().logout()
      })

      expect(useCartStore.setState).toHaveBeenCalledWith({ items: [] })
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('cart-storage')
    })
  })

  // ========================================
  // isAuthenticated function
  // ========================================

  describe('isAuthenticated 函數', () => {
    it('localStorage 有 user 時應該返回 true', () => {
      localStorageMock['auth-storage'] = JSON.stringify({
        state: { user: { id: '1', name: 'Test' } },
      })

      expect(isAuthenticated()).toBe(true)
    })

    it('sessionStorage 有 user 時應該返回 true', () => {
      sessionStorageMock['auth-storage'] = JSON.stringify({
        state: { user: { id: '1', name: 'Test' } },
      })

      expect(isAuthenticated()).toBe(true)
    })

    it('沒有 user 時應該返回 false', () => {
      expect(isAuthenticated()).toBe(false)
    })

    it('user 為 null 時應該返回 false', () => {
      localStorageMock['auth-storage'] = JSON.stringify({
        state: { user: null },
      })

      expect(isAuthenticated()).toBe(false)
    })

    it('無效 JSON 時應該返回 false', () => {
      localStorageMock['auth-storage'] = 'invalid-json'

      expect(isAuthenticated()).toBe(false)
    })
  })

  // ========================================
  // clearAllAuthStorage function
  // ========================================

  describe('clearAllAuthStorage 函數', () => {
    it('應該清除所有認證相關 storage', () => {
      clearAllAuthStorage()

      expect(window.localStorage.removeItem).toHaveBeenCalledWith('auth-storage')
      expect(window.sessionStorage.removeItem).toHaveBeenCalledWith('auth-storage')
    })
  })

  // ========================================
  // User roles
  // ========================================

  describe('使用者角色', () => {
    it('應該儲存不同角色的用戶', () => {
      const adminUser = createMockUser({ role: 'ADMIN' })

      act(() => {
        useAuthStore.getState().setAuth(adminUser)
      })

      expect(useAuthStore.getState().user?.role).toBe('ADMIN')
    })

    it('應該儲存 VIP 會員資訊', () => {
      const vipUser = createMockUser({
        role: 'VIP',
        memberLevel: 'GOLD',
        totalSpent: 100000,
        currentPoints: 5000,
      })

      act(() => {
        useAuthStore.getState().setAuth(vipUser)
      })

      const user = useAuthStore.getState().user
      expect(user?.memberLevel).toBe('GOLD')
      expect(user?.totalSpent).toBe(100000)
      expect(user?.currentPoints).toBe(5000)
    })
  })
})
