import { useState, useEffect, useCallback } from 'react'
import { ordersApi } from '../services/api'
import type { OrderStatus } from '@haude/types'
import logger from '../lib/logger'

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'expired'

export interface Order {
  id: string
  orderNumber: string
  userId: string
  userName?: string
  userEmail?: string
  items: {
    productId: string
    productName: string
    quantity: number
    unitPrice: number
    subtotal: number
  }[]
  totalAmount: number
  status: OrderStatus
  paymentStatus?: PaymentStatus
  paymentMethod?: string
  shippingAddress?: string
  shippingPhone?: string
  note?: string
  createdAt: string
  updatedAt: string
}

interface Pagination {
  total: number
  limit: number
  offset: number
  hasMore: boolean
  currentPage: number
  totalPages: number
}

interface UseOrdersReturn {
  orders: Order[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<boolean>
  isUpdating: boolean
  // 分頁相關
  pagination: Pagination
  goToPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  setPageSize: (size: number) => void
}

const DEFAULT_PAGE_SIZE = 20

export function useOrders(): UseOrdersReturn {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  // 分頁狀態
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    limit: DEFAULT_PAGE_SIZE,
    offset: 0,
    hasMore: false,
    currentPage: 1,
    totalPages: 1,
  })

  const fetchOrders = useCallback(async (limit = pagination.limit, offset = pagination.offset) => {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await ordersApi.getAll(limit, offset)
      // API 回傳格式: { orders, total, limit, offset, hasMore }
      setOrders(data.orders || [])

      const total = data.total || 0
      const totalPages = Math.ceil(total / limit) || 1
      const currentPage = Math.floor(offset / limit) + 1

      setPagination({
        total,
        limit,
        offset,
        hasMore: data.hasMore ?? false,
        currentPage,
        totalPages,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : '載入訂單失敗'
      setError(message)
      logger.error('[useOrders] API 錯誤', { error: err })
    } finally {
      setIsLoading(false)
    }
  }, [pagination.limit, pagination.offset])

  const updateOrderStatus = useCallback(async (id: string, status: OrderStatus): Promise<boolean> => {
    setIsUpdating(true)
    try {
      await ordersApi.updateStatus(id, status)
      await fetchOrders(pagination.limit, pagination.offset)
      return true
    } catch (err) {
      logger.error('[useOrders] 更新狀態失敗', { error: err })
      return false
    } finally {
      setIsUpdating(false)
    }
  }, [fetchOrders, pagination.limit, pagination.offset])

  // 分頁方法
  const goToPage = useCallback((page: number) => {
    const newOffset = (page - 1) * pagination.limit
    fetchOrders(pagination.limit, newOffset)
  }, [fetchOrders, pagination.limit])

  const nextPage = useCallback(() => {
    if (pagination.hasMore) {
      goToPage(pagination.currentPage + 1)
    }
  }, [goToPage, pagination.hasMore, pagination.currentPage])

  const prevPage = useCallback(() => {
    if (pagination.currentPage > 1) {
      goToPage(pagination.currentPage - 1)
    }
  }, [goToPage, pagination.currentPage])

  const setPageSize = useCallback((size: number) => {
    // 切換每頁筆數時回到第一頁
    fetchOrders(size, 0)
  }, [fetchOrders])

  useEffect(() => {
    fetchOrders(DEFAULT_PAGE_SIZE, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 只在首次載入時執行一次
  }, [])

  return {
    orders,
    isLoading,
    error,
    refetch: () => fetchOrders(pagination.limit, pagination.offset),
    updateOrderStatus,
    isUpdating,
    // 分頁相關
    pagination,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
  }
}

interface UseOrderReturn {
  order: Order | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

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
      const message = err instanceof Error ? err.message : '載入訂單失敗'
      setError(message)
      logger.error('[useOrder] API 錯誤', { error: err })
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
