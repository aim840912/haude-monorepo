import { useState, useEffect, useCallback } from 'react'
import { ordersApi } from '@/services/api'
import type { Order, CreateOrderRequest } from '@/types/order'
import { mockOrders, getMockOrderById } from '@/services/mock/order.mock'

interface UseOrdersOptions {
  /** 是否自動載入 */
  autoLoad?: boolean
  /** 每頁數量 */
  limit?: number
}

interface UseOrdersReturn {
  orders: Order[]
  total: number
  hasMore: boolean
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  loadMore: () => Promise<void>
}

/**
 * 訂單列表 Hook
 *
 * @example
 * ```tsx
 * const { orders, isLoading, loadMore, hasMore } = useOrders()
 * ```
 */
export function useOrders(options: UseOrdersOptions = {}): UseOrdersReturn {
  const { autoLoad = true, limit = 10 } = options
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [isLoading, setIsLoading] = useState(autoLoad)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = useCallback(
    async (reset = true) => {
      setIsLoading(true)
      setError(null)
      try {
        const currentOffset = reset ? 0 : offset
        const { data } = await ordersApi.getAll({ limit, offset: currentOffset })

        if (reset) {
          setOrders(data.orders as Order[])
          setOffset(limit)
        } else {
          setOrders((prev) => [...prev, ...(data.orders as Order[])])
          setOffset((prev) => prev + limit)
        }

        setTotal(data.total)
        setHasMore(data.hasMore)
      } catch (err) {
        // 開發模式：API 失敗時使用 Mock 資料
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[useOrders] API 不可用，使用 Mock 資料')
          const currentOffset = reset ? 0 : offset
          const paginatedOrders = mockOrders.slice(currentOffset, currentOffset + limit)
          if (reset) {
            setOrders(paginatedOrders)
            setOffset(limit)
          } else {
            setOrders((prev) => [...prev, ...paginatedOrders])
            setOffset((prev) => prev + limit)
          }
          setTotal(mockOrders.length)
          setHasMore(currentOffset + limit < mockOrders.length)
          setError(null)
        } else {
          const message = err instanceof Error ? err.message : '載入訂單失敗'
          setError(message)
        }
      } finally {
        setIsLoading(false)
      }
    },
    [limit, offset]
  )

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return
    await fetchOrders(false)
  }, [hasMore, isLoading, fetchOrders])

  useEffect(() => {
    if (autoLoad) {
      fetchOrders(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad])

  return {
    orders,
    total,
    hasMore,
    isLoading,
    error,
    refetch: () => fetchOrders(true),
    loadMore,
  }
}

interface UseOrderReturn {
  order: Order | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * 單一訂單 Hook
 *
 * @example
 * ```tsx
 * const { order, isLoading, error } = useOrder(orderId)
 * ```
 */
export function useOrder(orderId: string | undefined): UseOrderReturn {
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(!!orderId)
  const [error, setError] = useState<string | null>(null)

  const fetchOrder = useCallback(async () => {
    if (!orderId) return

    setIsLoading(true)
    setError(null)
    try {
      const { data } = await ordersApi.getById(orderId)
      setOrder(data)
    } catch (err) {
      // 開發模式：API 失敗時使用 Mock 資料
      if (process.env.NODE_ENV !== 'production') {
        const mockOrder = getMockOrderById(orderId)
        if (mockOrder) {
          console.warn('[useOrder] API 不可用，使用 Mock 資料')
          setOrder(mockOrder)
          setError(null)
        } else {
          setError('找不到該訂單')
        }
      } else {
        const message = err instanceof Error ? err.message : '載入訂單失敗'
        setError(message)
      }
    } finally {
      setIsLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    if (orderId) {
      fetchOrder()
    }
  }, [orderId, fetchOrder])

  return {
    order,
    isLoading,
    error,
    refetch: fetchOrder,
  }
}

interface UseCreateOrderReturn {
  createOrder: (data: CreateOrderRequest) => Promise<Order | null>
  isCreating: boolean
  error: string | null
}

/**
 * 建立訂單 Hook
 *
 * @example
 * ```tsx
 * const { createOrder, isCreating, error } = useCreateOrder()
 *
 * const handleSubmit = async () => {
 *   const order = await createOrder({ items, shippingAddress })
 *   if (order) {
 *     // 成功
 *   }
 * }
 * ```
 */
export function useCreateOrder(): UseCreateOrderReturn {
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createOrder = useCallback(async (data: CreateOrderRequest): Promise<Order | null> => {
    setIsCreating(true)
    setError(null)
    try {
      const { data: order } = await ordersApi.create(data)
      return order as Order
    } catch (err) {
      const message = err instanceof Error ? err.message : '建立訂單失敗'
      setError(message)
      return null
    } finally {
      setIsCreating(false)
    }
  }, [])

  return {
    createOrder,
    isCreating,
    error,
  }
}

interface UseCancelOrderReturn {
  cancelOrder: (orderId: string, reason?: string) => Promise<boolean>
  isCancelling: boolean
  error: string | null
}

/**
 * 取消訂單 Hook
 *
 * @example
 * ```tsx
 * const { cancelOrder, isCancelling } = useCancelOrder()
 *
 * const handleCancel = async () => {
 *   const success = await cancelOrder(orderId, '不想要了')
 * }
 * ```
 */
export function useCancelOrder(): UseCancelOrderReturn {
  const [isCancelling, setIsCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cancelOrder = useCallback(async (orderId: string, reason?: string): Promise<boolean> => {
    setIsCancelling(true)
    setError(null)
    try {
      await ordersApi.cancel(orderId, reason)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : '取消訂單失敗'
      setError(message)
      return false
    } finally {
      setIsCancelling(false)
    }
  }, [])

  return {
    cancelOrder,
    isCancelling,
    error,
  }
}
