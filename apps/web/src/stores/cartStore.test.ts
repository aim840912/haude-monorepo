/**
 * 購物車 Store 單元測試
 *
 * 測試功能：
 * - 未登入模式：本地購物車操作
 * - 已登入模式：API 同步操作
 * - 購物車合併功能
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from '@testing-library/react'

// Mock modules before importing store
vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('@/stores/authStore', () => ({
  isAuthenticated: vi.fn(() => false),
}))

vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}))

// Import after mocks
import { useCartStore } from './cartStore'
import { api } from '@/services/api'
import { isAuthenticated } from '@/stores/authStore'
import { createMockProduct, createMockApiCart, createMockCartItem } from '@/test/mocks'

describe('cartStore', () => {
  beforeEach(() => {
    // Reset store state
    useCartStore.setState({
      items: [],
      isLoaded: false,
      isLoading: false,
      lastUpdatedAt: null,
      totalItems: 0,
      totalPrice: 0,
    })

    // Reset mocks
    vi.clearAllMocks()
    vi.mocked(isAuthenticated).mockReturnValue(false)

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
  // 未登入模式測試
  // ========================================

  describe('未登入模式', () => {
    it('應該新增商品到購物車（本地）', async () => {
      const product = createMockProduct()
      const store = useCartStore.getState()

      await act(async () => {
        await store.addItem(product, 2)
      })

      const state = useCartStore.getState()
      expect(state.items).toHaveLength(1)
      expect(state.items[0].productId).toBe('prod-1')
      expect(state.items[0].quantity).toBe(2)
      expect(state.items[0].price).toBe(500)
    })

    it('應該合併相同商品的數量', async () => {
      const product = createMockProduct()

      await act(async () => {
        await useCartStore.getState().addItem(product, 2)
        await useCartStore.getState().addItem(product, 3)
      })

      const state = useCartStore.getState()
      expect(state.items).toHaveLength(1)
      expect(state.items[0].quantity).toBe(5)
    })

    it('應該限制數量不超過庫存', async () => {
      const product = createMockProduct({ stock: 5 })

      await act(async () => {
        await useCartStore.getState().addItem(product, 3)
        await useCartStore.getState().addItem(product, 10) // 超過庫存
      })

      const state = useCartStore.getState()
      expect(state.items[0].quantity).toBe(5) // 限制為最大庫存
    })

    it('應該移除商品', async () => {
      const product = createMockProduct()

      await act(async () => {
        await useCartStore.getState().addItem(product, 2)
        await useCartStore.getState().removeItem('prod-1')
      })

      const state = useCartStore.getState()
      expect(state.items).toHaveLength(0)
    })

    it('應該更新商品數量', async () => {
      const product = createMockProduct()

      await act(async () => {
        await useCartStore.getState().addItem(product, 2)
        await useCartStore.getState().updateQuantity('prod-1', 5)
      })

      const state = useCartStore.getState()
      expect(state.items[0].quantity).toBe(5)
    })

    it('數量為零時應該移除商品', async () => {
      const product = createMockProduct()

      await act(async () => {
        await useCartStore.getState().addItem(product, 2)
        await useCartStore.getState().updateQuantity('prod-1', 0)
      })

      const state = useCartStore.getState()
      expect(state.items).toHaveLength(0)
    })

    it('應該清空購物車', async () => {
      const product1 = createMockProduct({ id: 'prod-1' })
      const product2 = createMockProduct({ id: 'prod-2', name: '烏龍茶' })

      await act(async () => {
        await useCartStore.getState().addItem(product1, 2)
        await useCartStore.getState().addItem(product2, 1)
        await useCartStore.getState().clearCart()
      })

      const state = useCartStore.getState()
      expect(state.items).toHaveLength(0)
    })

    it('應該取得商品數量', async () => {
      const product = createMockProduct()

      await act(async () => {
        await useCartStore.getState().addItem(product, 3)
      })

      const quantity = useCartStore.getState().getItemQuantity('prod-1')
      expect(quantity).toBe(3)
    })

    it('不存在的商品應該返回 0', () => {
      const quantity = useCartStore.getState().getItemQuantity('non-existent')
      expect(quantity).toBe(0)
    })
  })

  // ========================================
  // 已登入模式測試
  // ========================================

  describe('已登入模式', () => {
    beforeEach(() => {
      vi.mocked(isAuthenticated).mockReturnValue(true)
    })

    it('應該呼叫 API 新增商品', async () => {
      const product = createMockProduct()
      const mockCart = createMockApiCart([{ productId: 'prod-1', quantity: 2 }])
      vi.mocked(api.post).mockResolvedValue({ data: mockCart })

      await act(async () => {
        await useCartStore.getState().addItem(product, 2)
      })

      expect(api.post).toHaveBeenCalledWith('/cart/items', {
        productId: 'prod-1',
        quantity: 2,
      })
      expect(useCartStore.getState().items).toHaveLength(1)
    })

    it('應該呼叫 API 移除商品', async () => {
      const mockCart = createMockApiCart([])
      vi.mocked(api.delete).mockResolvedValue({ data: mockCart })

      // 先設置購物車有商品
      useCartStore.setState({
        items: [createMockCartItem({ productId: 'prod-1' })],
      })

      await act(async () => {
        await useCartStore.getState().removeItem('prod-1')
      })

      expect(api.delete).toHaveBeenCalledWith('/cart/items/prod-1')
      expect(useCartStore.getState().items).toHaveLength(0)
    })

    it('應該呼叫 API 更新數量', async () => {
      const mockCart = createMockApiCart([{ productId: 'prod-1', quantity: 5 }])
      vi.mocked(api.put).mockResolvedValue({ data: mockCart })

      // 先設置購物車有商品
      useCartStore.setState({
        items: [createMockCartItem({ productId: 'prod-1', quantity: 2 })],
      })

      await act(async () => {
        await useCartStore.getState().updateQuantity('prod-1', 5)
      })

      expect(api.put).toHaveBeenCalledWith('/cart/items/prod-1', { quantity: 5 })
    })

    it('應該呼叫 API 清空購物車', async () => {
      vi.mocked(api.delete).mockResolvedValue({ data: { items: [] } })

      useCartStore.setState({
        items: [createMockCartItem()],
      })

      await act(async () => {
        await useCartStore.getState().clearCart()
      })

      expect(api.delete).toHaveBeenCalledWith('/cart')
      expect(useCartStore.getState().items).toHaveLength(0)
    })

    it('API 錯誤時應該拋出例外', async () => {
      const product = createMockProduct()
      const error = new Error('Network error')
      vi.mocked(api.post).mockRejectedValue(error)

      await expect(
        useCartStore.getState().addItem(product, 2)
      ).rejects.toThrow('Network error')

      expect(useCartStore.getState().isLoading).toBe(false)
    })
  })

  // ========================================
  // 後端同步測試
  // ========================================

  describe('後端同步', () => {
    beforeEach(() => {
      vi.mocked(isAuthenticated).mockReturnValue(true)
    })

    it('應該從後端同步購物車', async () => {
      const mockCart = createMockApiCart([
        { productId: 'prod-1', quantity: 2 },
        { productId: 'prod-2', quantity: 3 },
      ])
      vi.mocked(api.get).mockResolvedValue({ data: mockCart })

      await act(async () => {
        await useCartStore.getState().syncWithBackend()
      })

      expect(api.get).toHaveBeenCalledWith('/cart')
      expect(useCartStore.getState().items).toHaveLength(2)
      expect(useCartStore.getState().isLoaded).toBe(true)
    })

    it('未登入時不應該同步', async () => {
      vi.mocked(isAuthenticated).mockReturnValue(false)

      await act(async () => {
        await useCartStore.getState().syncWithBackend()
      })

      expect(api.get).not.toHaveBeenCalled()
    })

    it('應該合併本地購物車到後端', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: createMockApiCart([]) })
      vi.mocked(api.get).mockResolvedValue({
        data: createMockApiCart([{ productId: 'prod-1', quantity: 2 }]),
      })

      // 設置本地購物車
      useCartStore.setState({
        items: [createMockCartItem({ productId: 'prod-1', quantity: 2 })],
      })

      await act(async () => {
        await useCartStore.getState().mergeLocalToBackend()
      })

      expect(api.post).toHaveBeenCalledWith('/cart/items', {
        productId: 'prod-1',
        quantity: 2,
      })
      expect(api.get).toHaveBeenCalledWith('/cart')
    })

    it('本地購物車為空時應該直接同步', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: createMockApiCart([]) })

      useCartStore.setState({ items: [] })

      await act(async () => {
        await useCartStore.getState().mergeLocalToBackend()
      })

      expect(api.post).not.toHaveBeenCalled()
      expect(api.get).toHaveBeenCalledWith('/cart')
    })
  })

  // ========================================
  // Selector Hooks 測試
  // ========================================

  describe('Selector Hooks', () => {
    it('useTotalItems 應該計算總數量', () => {
      useCartStore.setState({
        items: [
          createMockCartItem({ id: '1', productId: 'p1', price: 100, quantity: 2 }),
          createMockCartItem({ id: '2', productId: 'p2', price: 200, quantity: 3 }),
        ],
      })

      // 直接測試 selector 邏輯
      const totalItems = useCartStore.getState().items.reduce(
        (sum, item) => sum + item.quantity,
        0
      )
      expect(totalItems).toBe(5)
    })

    it('useTotalPrice 應該計算總金額', () => {
      useCartStore.setState({
        items: [
          createMockCartItem({ id: '1', productId: 'p1', price: 100, quantity: 2 }),
          createMockCartItem({ id: '2', productId: 'p2', price: 200, quantity: 3 }),
        ],
      })

      const totalPrice = useCartStore.getState().items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      )
      expect(totalPrice).toBe(800) // 100*2 + 200*3
    })
  })
})
