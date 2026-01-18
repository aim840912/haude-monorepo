/**
 * 訂單 Hooks 單元測試
 *
 * 測試功能：
 * - useOrders：訂單列表
 * - useOrder：單一訂單
 * - useCreateOrder：建立訂單
 * - useCancelOrder：取消訂單
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import type { Order } from '@/types/order'

// Mock API
vi.mock('@/services/api', () => ({
  ordersApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    cancel: vi.fn(),
  },
}))

// Mock mock data
vi.mock('@/services/mock/order.mock', () => ({
  mockOrders: [
    { id: 'order-1', status: 'PENDING', totalAmount: 1000 },
    { id: 'order-2', status: 'PAID', totalAmount: 2000 },
    { id: 'order-3', status: 'SHIPPED', totalAmount: 1500 },
  ],
  getMockOrderById: vi.fn((id: string) => {
    if (id === 'order-1') {
      return { id: 'order-1', status: 'PENDING', totalAmount: 1000 }
    }
    return null
  }),
}))

import { useOrders, useOrder, useCreateOrder, useCancelOrder } from './useOrders'
import { ordersApi } from '@/services/api'
import { mockOrders, getMockOrderById } from '@/services/mock/order.mock'
import { createMockOrder, createMockAxiosResponse } from '@/test/mocks'

describe('訂單 Hooks', () => {
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
      const mockOrderList = [
        createMockOrder({ id: 'order-1' }),
        createMockOrder({ id: 'order-2', status: 'confirmed' }),
      ]
      vi.mocked(ordersApi.getAll).mockResolvedValue(
        createMockAxiosResponse({
          orders: mockOrderList,
          total: 2,
          hasMore: false,
        })
      )

      const { result } = renderHook(() => useOrders())

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.orders).toHaveLength(2)
      expect(result.current.total).toBe(2)
      expect(result.current.hasMore).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('應該支援關閉自動載入', () => {
      const { result } = renderHook(() => useOrders({ autoLoad: false }))

      expect(result.current.isLoading).toBe(false)
      expect(result.current.orders).toHaveLength(0)
      expect(ordersApi.getAll).not.toHaveBeenCalled()
    })

    it('應該支援自訂每頁數量', async () => {
      vi.mocked(ordersApi.getAll).mockResolvedValue(
        createMockAxiosResponse({ orders: [], total: 0, hasMore: false })
      )

      renderHook(() => useOrders({ limit: 5 }))

      await waitFor(() => {
        expect(ordersApi.getAll).toHaveBeenCalledWith({ limit: 5, offset: 0 })
      })
    })

    it('應該支援載入更多', async () => {
      const firstPage = [createMockOrder({ id: 'order-1' })]
      const secondPage = [createMockOrder({ id: 'order-2' })]

      vi.mocked(ordersApi.getAll)
        .mockResolvedValueOnce(
          createMockAxiosResponse({ orders: firstPage, total: 2, hasMore: true })
        )
        .mockResolvedValueOnce(
          createMockAxiosResponse({ orders: secondPage, total: 2, hasMore: false })
        )

      const { result } = renderHook(() => useOrders({ limit: 1 }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.orders).toHaveLength(1)
      expect(result.current.hasMore).toBe(true)

      await act(async () => {
        await result.current.loadMore()
      })

      expect(result.current.orders).toHaveLength(2)
    })

    it('沒有更多資料時不應該載入', async () => {
      vi.mocked(ordersApi.getAll).mockResolvedValue(
        createMockAxiosResponse({ orders: [createMockOrder()], total: 1, hasMore: false })
      )

      const { result } = renderHook(() => useOrders())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const callCount = vi.mocked(ordersApi.getAll).mock.calls.length

      await act(async () => {
        await result.current.loadMore()
      })

      // 不應該有新的 API 呼叫
      expect(vi.mocked(ordersApi.getAll).mock.calls.length).toBe(callCount)
    })

    it('API 失敗時應該在開發模式使用 Mock 資料', async () => {
      vi.stubEnv('NODE_ENV', 'development')

      vi.mocked(ordersApi.getAll).mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useOrders())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.orders).toEqual(mockOrders)
      expect(result.current.error).toBeNull()

      vi.unstubAllEnvs()
    })

    it('應該支援手動重新載入', async () => {
      vi.mocked(ordersApi.getAll).mockResolvedValue(
        createMockAxiosResponse({ orders: [createMockOrder()], total: 1, hasMore: false })
      )

      const { result } = renderHook(() => useOrders())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      vi.mocked(ordersApi.getAll).mockClear()

      await act(async () => {
        await result.current.refetch()
      })

      expect(ordersApi.getAll).toHaveBeenCalledTimes(1)
    })
  })

  // ========================================
  // useOrder Hook
  // ========================================

  describe('useOrder', () => {
    it('應該載入單一訂單', async () => {
      const mockOrder = createMockOrder()
      vi.mocked(ordersApi.getById).mockResolvedValue(createMockAxiosResponse(mockOrder))

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

    it('API 失敗時應該在開發模式使用 Mock 資料', async () => {
      vi.stubEnv('NODE_ENV', 'development')

      vi.mocked(ordersApi.getById).mockRejectedValue(new Error('Not found'))
      vi.mocked(getMockOrderById).mockReturnValue(createMockOrder() as ReturnType<typeof getMockOrderById>)

      const { result } = renderHook(() => useOrder('order-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.order).toBeDefined()
      expect(result.current.error).toBeNull()

      vi.unstubAllEnvs()
    })

    it('Mock 也找不到時應該設定錯誤', async () => {
      vi.stubEnv('NODE_ENV', 'development')

      vi.mocked(ordersApi.getById).mockRejectedValue(new Error('Not found'))
      vi.mocked(getMockOrderById).mockReturnValue(undefined)

      const { result } = renderHook(() => useOrder('non-existent'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe('找不到該訂單')

      vi.unstubAllEnvs()
    })
  })

  // ========================================
  // useCreateOrder Hook
  // ========================================

  describe('useCreateOrder', () => {
    it('應該建立訂單', async () => {
      const newOrder = createMockOrder({ id: 'new-order' })
      vi.mocked(ordersApi.create).mockResolvedValue(createMockAxiosResponse(newOrder))

      const { result } = renderHook(() => useCreateOrder())

      expect(result.current.isCreating).toBe(false)

      let createdOrder: Order | null = null
      await act(async () => {
        createdOrder = await result.current.createOrder({
          items: [{ productId: 'prod-1', quantity: 2 }],
          shippingAddress: {
            name: '張三',
            phone: '0912345678',
            street: '忠孝東路一段100號',
            city: '台北市',
            postalCode: '100',
            country: '台灣',
          },
          paymentMethod: 'CREDIT',
        })
      })

      expect(createdOrder).toEqual(newOrder)
      expect(result.current.error).toBeNull()
    })

    it('應該處理建立失敗', async () => {
      vi.mocked(ordersApi.create).mockRejectedValue(new Error('庫存不足'))

      const { result } = renderHook(() => useCreateOrder())

      let createdOrder: Order | null = null
      await act(async () => {
        createdOrder = await result.current.createOrder({
          items: [],
          shippingAddress: {
            name: '',
            phone: '',
            street: '',
            city: '',
            postalCode: '',
            country: '',
          },
          paymentMethod: 'CREDIT',
        })
      })

      expect(createdOrder).toBeNull()
      expect(result.current.error).toBe('庫存不足')
    })

    it('應該在請求期間顯示載入狀態', async () => {
      let resolvePromise!: (value: ReturnType<typeof createMockAxiosResponse>) => void
      vi.mocked(ordersApi.create).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve as typeof resolvePromise
          })
      )

      const { result } = renderHook(() => useCreateOrder())

      act(() => {
        result.current.createOrder({
          items: [],
          shippingAddress: {
            name: '',
            phone: '',
            street: '',
            city: '',
            postalCode: '',
            country: '',
          },
          paymentMethod: 'CREDIT',
        })
      })

      expect(result.current.isCreating).toBe(true)

      await act(async () => {
        resolvePromise!(createMockAxiosResponse(createMockOrder()))
      })

      expect(result.current.isCreating).toBe(false)
    })
  })

  // ========================================
  // useCancelOrder Hook
  // ========================================

  describe('useCancelOrder', () => {
    it('應該取消訂單', async () => {
      vi.mocked(ordersApi.cancel).mockResolvedValue(createMockAxiosResponse({}))

      const { result } = renderHook(() => useCancelOrder())

      let success = false
      await act(async () => {
        success = await result.current.cancelOrder('order-1', '不想要了')
      })

      expect(success).toBe(true)
      expect(ordersApi.cancel).toHaveBeenCalledWith('order-1', '不想要了')
      expect(result.current.error).toBeNull()
    })

    it('應該處理取消失敗', async () => {
      vi.mocked(ordersApi.cancel).mockRejectedValue(new Error('訂單已出貨，無法取消'))

      const { result } = renderHook(() => useCancelOrder())

      let success = false
      await act(async () => {
        success = await result.current.cancelOrder('order-1')
      })

      expect(success).toBe(false)
      expect(result.current.error).toBe('訂單已出貨，無法取消')
    })

    it('應該在請求期間顯示載入狀態', async () => {
      let resolvePromise!: (value: ReturnType<typeof createMockAxiosResponse>) => void
      vi.mocked(ordersApi.cancel).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve as typeof resolvePromise
          })
      )

      const { result } = renderHook(() => useCancelOrder())

      act(() => {
        result.current.cancelOrder('order-1')
      })

      expect(result.current.isCancelling).toBe(true)

      await act(async () => {
        resolvePromise!(createMockAxiosResponse({}))
      })

      expect(result.current.isCancelling).toBe(false)
    })
  })
})
