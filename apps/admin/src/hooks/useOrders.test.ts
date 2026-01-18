// @ts-nocheck - 測試檔案的 mock 型別與嚴格的 AxiosResponse 型別不完全匹配
/**
 * Admin 訂單 Hooks 單元測試
 *
 * 測試功能：
 * - useOrders：訂單列表與分頁
 * - useOrder：單一訂單
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

// Mock API
vi.mock('../services/api', () => ({
  ordersApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    updateStatus: vi.fn(),
  },
}))

// Mock logger
vi.mock('../lib/logger', () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}))

import { useOrders, useOrder, type Order } from './useOrders'
import { ordersApi } from '../services/api'

// Mock order factory
const createMockOrder = (overrides = {}): Order => ({
  id: 'order-1',
  orderNumber: 'ORD-20240115-001',
  userId: 'user-1',
  userName: '張三',
  userEmail: 'test@example.com',
  items: [
    {
      productId: 'prod-1',
      productName: '阿里山高山茶',
      quantity: 2,
      unitPrice: 500,
      subtotal: 1000,
    },
  ],
  totalAmount: 1000,
  status: 'PENDING',
  paymentStatus: 'pending',
  paymentMethod: 'CREDIT',
  shippingAddress: '台北市中正區忠孝東路一段100號',
  shippingPhone: '0912345678',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
  ...overrides,
})

describe('Admin 訂單 Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ========================================
  // useOrders Hook
  // ========================================

  describe('useOrders', () => {
    it('應該自動載入訂單列表', async () => {
      const mockOrders = [
        createMockOrder({ id: 'order-1' }),
        createMockOrder({ id: 'order-2', status: 'PAID' }),
      ]
      vi.mocked(ordersApi.getAll).mockResolvedValue({
        data: {
          orders: mockOrders,
          total: 2,
          limit: 20,
          offset: 0,
          hasMore: false,
        },
      })

      const { result } = renderHook(() => useOrders())

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.orders).toHaveLength(2)
      expect(result.current.pagination.total).toBe(2)
      expect(result.current.error).toBeNull()
    })

    it('應該正確計算分頁資訊', async () => {
      vi.mocked(ordersApi.getAll).mockResolvedValue({
        data: {
          orders: [createMockOrder()],
          total: 50,
          limit: 20,
          offset: 0,
          hasMore: true,
        },
      })

      const { result } = renderHook(() => useOrders())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.pagination.currentPage).toBe(1)
      expect(result.current.pagination.totalPages).toBe(3) // ceil(50/20)
      expect(result.current.pagination.hasMore).toBe(true)
    })

    it('goToPage 應該切換到指定頁', async () => {
      vi.mocked(ordersApi.getAll).mockResolvedValue({
        data: {
          orders: [createMockOrder()],
          total: 50,
          limit: 20,
          offset: 0,
          hasMore: true,
        },
      })

      const { result } = renderHook(() => useOrders())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // 切換到第二頁
      vi.mocked(ordersApi.getAll).mockClear()
      vi.mocked(ordersApi.getAll).mockResolvedValue({
        data: {
          orders: [createMockOrder({ id: 'order-page2' })],
          total: 50,
          limit: 20,
          offset: 20,
          hasMore: true,
        },
      })

      await act(async () => {
        result.current.goToPage(2)
      })

      await waitFor(() => {
        expect(ordersApi.getAll).toHaveBeenCalledWith(20, 20) // offset = (2-1) * 20
      })
    })

    it('setPageSize 應該切換每頁筆數並回到第一頁', async () => {
      vi.mocked(ordersApi.getAll).mockResolvedValue({
        data: {
          orders: [createMockOrder()],
          total: 50,
          limit: 20,
          offset: 0,
          hasMore: true,
        },
      })

      const { result } = renderHook(() => useOrders())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      vi.mocked(ordersApi.getAll).mockClear()
      vi.mocked(ordersApi.getAll).mockResolvedValue({
        data: {
          orders: [],
          total: 50,
          limit: 10,
          offset: 0,
          hasMore: true,
        },
      })

      await act(async () => {
        result.current.setPageSize(10)
      })

      await waitFor(() => {
        expect(ordersApi.getAll).toHaveBeenCalledWith(10, 0)
      })
    })

    it('updateOrderStatus 應該更新訂單狀態', async () => {
      vi.mocked(ordersApi.getAll).mockResolvedValue({
        data: {
          orders: [createMockOrder()],
          total: 1,
          limit: 20,
          offset: 0,
          hasMore: false,
        },
      })
      vi.mocked(ordersApi.updateStatus).mockResolvedValue({ data: {} })

      const { result } = renderHook(() => useOrders())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let success = false
      await act(async () => {
        success = await result.current.updateOrderStatus('order-1', 'SHIPPED')
      })

      expect(success).toBe(true)
      expect(ordersApi.updateStatus).toHaveBeenCalledWith('order-1', 'SHIPPED')
    })

    it('API 失敗應該設定錯誤', async () => {
      vi.mocked(ordersApi.getAll).mockRejectedValue(new Error('載入訂單失敗'))

      const { result } = renderHook(() => useOrders())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe('載入訂單失敗')
    })
  })

  // ========================================
  // useOrder Hook
  // ========================================

  describe('useOrder', () => {
    it('應該載入單一訂單', async () => {
      const mockOrder = createMockOrder()
      vi.mocked(ordersApi.getById).mockResolvedValue({ data: mockOrder })

      const { result } = renderHook(() => useOrder('order-1'))

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.order).toEqual(mockOrder)
      expect(result.current.error).toBeNull()
    })

    it('應該處理 undefined orderId', () => {
      const { result } = renderHook(() => useOrder(undefined))

      expect(result.current.isLoading).toBe(false)
      expect(result.current.order).toBeNull()
      expect(ordersApi.getById).not.toHaveBeenCalled()
    })

    it('API 失敗應該設定錯誤', async () => {
      vi.mocked(ordersApi.getById).mockRejectedValue(new Error('找不到訂單'))

      const { result } = renderHook(() => useOrder('non-existent'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe('找不到訂單')
    })

    it('應該支援手動重新載入', async () => {
      const mockOrder = createMockOrder()
      vi.mocked(ordersApi.getById).mockResolvedValue({ data: mockOrder })

      const { result } = renderHook(() => useOrder('order-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      vi.mocked(ordersApi.getById).mockClear()

      await act(async () => {
        await result.current.refetch()
      })

      expect(ordersApi.getById).toHaveBeenCalledTimes(1)
    })
  })
})
