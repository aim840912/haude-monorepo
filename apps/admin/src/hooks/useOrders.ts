import { useState, useEffect, useCallback } from 'react'
import { ordersApi } from '../services/api'
import type { OrderStatus } from '@haude/types'
import logger from '../lib/logger'

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
  shippingAddress?: string
  shippingPhone?: string
  note?: string
  createdAt: string
  updatedAt: string
}

interface UseOrdersReturn {
  orders: Order[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<boolean>
  isUpdating: boolean
}

export function useOrders(): UseOrdersReturn {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchOrders = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await ordersApi.getAll()
      // API 回傳格式: { orders, total, limit, offset, hasMore }
      setOrders(data.orders || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : '載入訂單失敗'
      setError(message)
      logger.error('[useOrders] API 錯誤', { error: err })
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateOrderStatus = useCallback(async (id: string, status: OrderStatus): Promise<boolean> => {
    setIsUpdating(true)
    try {
      await ordersApi.updateStatus(id, status)
      await fetchOrders()
      return true
    } catch (err) {
      logger.error('[useOrders] 更新狀態失敗', { error: err })
      return false
    } finally {
      setIsUpdating(false)
    }
  }, [fetchOrders])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return {
    orders,
    isLoading,
    error,
    refetch: fetchOrders,
    updateOrderStatus,
    isUpdating,
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
