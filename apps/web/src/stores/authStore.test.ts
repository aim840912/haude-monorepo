/**
 * 認證 Store 單元測試
 *
 * 測試功能：
 * - 登入/登出
 * - 「記住我」功能
 * - Storage 策略（localStorage vs sessionStorage）
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
  getRememberMe,
  setRememberMe,
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
      token: null,
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
  // 基本認證功能
  // ========================================

  describe('基本認證功能', () => {
    it('應該設定認證狀態', () => {
      const user = createMockUser()
      const token = 'jwt-token-123'

      act(() => {
        useAuthStore.getState().setAuth(user, token)
      })

      const state = useAuthStore.getState()
      expect(state.user).toEqual(user)
      expect(state.token).toBe(token)
      expect(state.isAuthenticated).toBe(true)
    })

    it('應該設定 CSRF Token', () => {
      const user = createMockUser()
      const token = 'jwt-token-123'
      const csrfToken = 'csrf-token-456'

      act(() => {
        useAuthStore.getState().setAuth(user, token, csrfToken)
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
        useAuthStore.getState().setAuth(user, 'token', 'csrf')
        useAuthStore.getState().logout()
      })

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.csrfToken).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })

    it('登出時應該清除購物車', () => {
      const user = createMockUser()
      act(() => {
        useAuthStore.getState().setAuth(user, 'token')
        useAuthStore.getState().logout()
      })

      expect(useCartStore.setState).toHaveBeenCalledWith({ items: [] })
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('cart-storage')
    })
  })

  // ========================================
  // 「記住我」功能
  // ========================================

  describe('「記住我」功能', () => {
    it('應該設定「記住我」為 true', () => {
      setRememberMe(true)

      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'auth-remember-me',
        'true'
      )
    })

    it('應該設定「記住我」為 false', () => {
      setRememberMe(false)

      expect(window.localStorage.removeItem).toHaveBeenCalledWith(
        'auth-remember-me'
      )
    })

    it('應該讀取「記住我」狀態', () => {
      localStorageMock['auth-remember-me'] = 'true'

      expect(getRememberMe()).toBe(true)
    })

    it('沒有設定時應該返回 false', () => {
      expect(getRememberMe()).toBe(false)
    })
  })

  // ========================================
  // isAuthenticated 函數
  // ========================================

  describe('isAuthenticated 函數', () => {
    it('localStorage 有 token 時應該返回 true', () => {
      localStorageMock['auth-storage'] = JSON.stringify({
        state: { token: 'jwt-token' },
      })

      expect(isAuthenticated()).toBe(true)
    })

    it('sessionStorage 有 token 時應該返回 true', () => {
      sessionStorageMock['auth-storage'] = JSON.stringify({
        state: { token: 'jwt-token' },
      })

      expect(isAuthenticated()).toBe(true)
    })

    it('沒有 token 時應該返回 false', () => {
      expect(isAuthenticated()).toBe(false)
    })

    it('token 為空時應該返回 false', () => {
      localStorageMock['auth-storage'] = JSON.stringify({
        state: { token: null },
      })

      expect(isAuthenticated()).toBe(false)
    })

    it('無效 JSON 時應該返回 false', () => {
      localStorageMock['auth-storage'] = 'invalid-json'

      expect(isAuthenticated()).toBe(false)
    })
  })

  // ========================================
  // clearAllAuthStorage 函數
  // ========================================

  describe('clearAllAuthStorage 函數', () => {
    it('應該清除所有認證相關 storage', () => {
      clearAllAuthStorage()

      expect(window.localStorage.removeItem).toHaveBeenCalledWith('auth-storage')
      expect(window.sessionStorage.removeItem).toHaveBeenCalledWith('auth-storage')
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('auth-remember-me')
    })
  })

  // ========================================
  // 使用者角色
  // ========================================

  describe('使用者角色', () => {
    it('應該儲存不同角色的用戶', () => {
      const adminUser = createMockUser({ role: 'ADMIN' })

      act(() => {
        useAuthStore.getState().setAuth(adminUser, 'token')
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
        useAuthStore.getState().setAuth(vipUser, 'token')
      })

      const user = useAuthStore.getState().user
      expect(user?.memberLevel).toBe('GOLD')
      expect(user?.totalSpent).toBe(100000)
      expect(user?.currentPoints).toBe(5000)
    })
  })
})
