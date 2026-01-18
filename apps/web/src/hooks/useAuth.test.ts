/**
 * 認證 Hook 單元測試
 *
 * 測試功能：
 * - 登入
 * - 註冊
 * - 登出
 * - Token 驗證
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

// Mock stores
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: null,
    token: null,
    isAuthenticated: false,
    setAuth: vi.fn(),
    logout: vi.fn(),
  })),
  setRememberMe: vi.fn(),
  clearAllAuthStorage: vi.fn(),
}))

vi.mock('@/stores/cartStore', () => ({
  useCartStore: {
    getState: vi.fn(() => ({
      mergeLocalToBackend: vi.fn().mockResolvedValue(undefined),
      items: [],
      isLoaded: false,
      isLoading: false,
      totalItems: 0,
      totalPrice: 0,
    })),
    setState: vi.fn(),
  },
}))

// Mock auth service
vi.mock('@/services/auth', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    getMe: vi.fn(),
  },
}))

import { useAuth } from './useAuth'
import { useAuthStore, setRememberMe, clearAllAuthStorage } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import { authService } from '@/services/auth'

// Mock user
const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: '測試用戶',
  createdAt: '2024-01-01T00:00:00Z',
}

// Mock CartState factory
const createMockCartState = (overrides: Partial<ReturnType<typeof useCartStore.getState>> = {}) => ({
  items: [],
  isLoaded: false,
  isLoading: false,
  addItem: vi.fn(),
  removeItem: vi.fn(),
  updateQuantity: vi.fn(),
  clearCart: vi.fn(),
  getItemQuantity: vi.fn(() => 0),
  syncWithBackend: vi.fn(),
  mergeLocalToBackend: vi.fn().mockResolvedValue(undefined),
  totalItems: 0,
  totalPrice: 0,
  ...overrides,
})

describe('useAuth', () => {
  let mockSetAuth: ReturnType<typeof vi.fn>
  let mockStoreLogout: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()

    mockSetAuth = vi.fn()
    mockStoreLogout = vi.fn()

    vi.mocked(useAuthStore).mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: mockSetAuth,
      logout: mockStoreLogout,
    })

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    }
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ========================================
  // 初始狀態
  // ========================================

  describe('初始狀態', () => {
    it('應該返回初始狀態', async () => {
      const { result } = renderHook(() => useAuth())

      // 等待初始化完成
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('有 token 時應該驗證用戶', async () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: null,
        token: 'existing-token',
        isAuthenticated: false,
        setAuth: mockSetAuth,
        logout: mockStoreLogout,
      })

      vi.mocked(authService.getMe).mockResolvedValue({ user: mockUser })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(authService.getMe).toHaveBeenCalled()
      expect(mockSetAuth).toHaveBeenCalledWith(mockUser, 'existing-token')
    })

    it('token 無效時應該登出', async () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: null,
        token: 'invalid-token',
        isAuthenticated: false,
        setAuth: mockSetAuth,
        logout: mockStoreLogout,
      })

      vi.mocked(authService.getMe).mockRejectedValue(new Error('Unauthorized'))

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockStoreLogout).toHaveBeenCalled()
    })
  })

  // ========================================
  // 登入
  // ========================================

  describe('登入', () => {
    it('應該成功登入', async () => {
      vi.mocked(authService.login).mockResolvedValue({
        user: mockUser,
        accessToken: 'new-token',
      })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.login('test@example.com', 'password123')
      })

      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123')
      expect(mockSetAuth).toHaveBeenCalledWith(mockUser, 'new-token')
    })

    it('應該設定「記住我」', async () => {
      vi.mocked(authService.login).mockResolvedValue({
        user: mockUser,
        accessToken: 'new-token',
      })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.login('test@example.com', 'password123', true)
      })

      expect(setRememberMe).toHaveBeenCalledWith(true)
    })

    it('登入後應該合併購物車', async () => {
      const mockMerge = vi.fn().mockResolvedValue(undefined)
      vi.mocked(useCartStore.getState).mockReturnValue(
        createMockCartState({ mergeLocalToBackend: mockMerge })
      )

      vi.mocked(authService.login).mockResolvedValue({
        user: mockUser,
        accessToken: 'new-token',
      })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.login('test@example.com', 'password123')
      })

      expect(mockMerge).toHaveBeenCalled()
    })

    it('登入失敗應該設定錯誤', async () => {
      vi.mocked(authService.login).mockRejectedValue(new Error('帳號或密碼錯誤'))

      const { result } = renderHook(() => useAuth())

      // 使用 try-catch 捕獲錯誤，然後等待狀態更新
      await act(async () => {
        try {
          await result.current.login('test@example.com', 'wrong-password')
        } catch {
          // 預期會拋出錯誤
        }
      })

      await waitFor(() => {
        expect(result.current.error).toBe('帳號或密碼錯誤')
      })
    })
  })

  // ========================================
  // 註冊
  // ========================================

  describe('註冊', () => {
    it('應該成功註冊', async () => {
      vi.mocked(authService.register).mockResolvedValue({
        user: mockUser,
        accessToken: 'new-token',
      })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.register('new@example.com', 'password123', '新用戶')
      })

      expect(authService.register).toHaveBeenCalledWith('new@example.com', 'password123', '新用戶')
      expect(mockSetAuth).toHaveBeenCalledWith(mockUser, 'new-token')
    })

    it('註冊後應該合併購物車', async () => {
      const mockMerge = vi.fn().mockResolvedValue(undefined)
      vi.mocked(useCartStore.getState).mockReturnValue(
        createMockCartState({ mergeLocalToBackend: mockMerge })
      )

      vi.mocked(authService.register).mockResolvedValue({
        user: mockUser,
        accessToken: 'new-token',
      })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.register('new@example.com', 'password123', '新用戶')
      })

      expect(mockMerge).toHaveBeenCalled()
    })

    it('註冊失敗應該設定錯誤', async () => {
      vi.mocked(authService.register).mockRejectedValue(new Error('該 Email 已被使用'))

      const { result } = renderHook(() => useAuth())

      // 使用 try-catch 捕獲錯誤，然後等待狀態更新
      await act(async () => {
        try {
          await result.current.register('existing@example.com', 'password123', '用戶')
        } catch {
          // 預期會拋出錯誤
        }
      })

      await waitFor(() => {
        expect(result.current.error).toBe('該 Email 已被使用')
      })
    })
  })

  // ========================================
  // 登出
  // ========================================

  describe('登出', () => {
    it('應該清除所有狀態', async () => {
      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.logout()
      })

      expect(clearAllAuthStorage).toHaveBeenCalled()
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('cart-storage')
      expect(useCartStore.setState).toHaveBeenCalledWith({ items: [] })
      expect(mockStoreLogout).toHaveBeenCalled()
    })
  })
})
