import { useState, useEffect, useCallback } from 'react'
import {
  productsApi,
  ordersApi,
  usersApi,
  dashboardApi,
  type RevenueTrendData,
  type OrderStatusData,
  type TopProductData,
} from '../services/api'
import logger from '../lib/logger'

export interface DashboardStats {
  totalProducts: number
  totalOrders: number
  totalUsers: number
  totalRevenue: number
}

export interface RecentOrder {
  id: string
  orderNumber: string
  customerName: string
  totalAmount: number
  status: string
  createdAt: string
}

export interface RecentUser {
  id: string
  name: string
  email: string
  createdAt: string
}

// 圖表資料類型
export type { RevenueTrendData, OrderStatusData, TopProductData }

interface UseDashboardReturn {
  stats: DashboardStats
  recentOrders: RecentOrder[]
  recentUsers: RecentUser[]
  // 圖表資料
  revenueTrend: RevenueTrendData[]
  orderStatus: OrderStatusData[]
  topProducts: TopProductData[]
  revenuePeriod: 'day' | 'week' | 'month'
  setRevenuePeriod: (period: 'day' | 'week' | 'month') => void
  // 載入狀態
  isLoading: boolean
  isChartLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useDashboard(): UseDashboardReturn {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
  })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 圖表資料狀態
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrendData[]>([])
  const [orderStatus, setOrderStatus] = useState<OrderStatusData[]>([])
  const [topProducts, setTopProducts] = useState<TopProductData[]>([])
  const [revenuePeriod, setRevenuePeriod] = useState<'day' | 'week' | 'month'>('day')
  const [isChartLoading, setIsChartLoading] = useState(true)

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // 並行請求所有資料
      const [productsRes, ordersRes, usersRes] = await Promise.all([
        productsApi.getAll().catch(() => ({ data: [] })),
        ordersApi.getAll().catch(() => ({ data: { orders: [], total: 0 } })),
        usersApi.getAll().catch(() => ({ data: [] })),
      ])

      const products = productsRes.data || []
      // ordersApi.getAll() 返回分頁結構 { orders: [], total, limit, offset, hasMore }
      const ordersData = ordersRes.data || { orders: [], total: 0 }
      const orders = ordersData.orders || []
      const ordersTotal = ordersData.total || 0
      const users = usersRes.data || []

      // 計算統計數據（金額已改為整數，無需轉換）
      const totalRevenue = orders.reduce(
        (sum: number, order: { totalAmount?: number }) => sum + (order.totalAmount || 0),
        0
      )

      setStats({
        totalProducts: products.length,
        totalOrders: ordersTotal, // 使用分頁的 total 而非陣列長度
        totalUsers: users.length,
        totalRevenue,
      })

      // 取得最近 5 筆訂單
      const sortedOrders = [...orders]
        .sort((a: { createdAt: string }, b: { createdAt: string }) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5)
        .map((order: {
          id: string
          orderNumber: string
          shippingAddress?: { name?: string }
          totalAmount: number
          status: string
          createdAt: string
        }) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.shippingAddress?.name || '未知',
          totalAmount: order.totalAmount,
          status: order.status,
          createdAt: order.createdAt,
        }))

      setRecentOrders(sortedOrders)

      // 取得最近 5 位新會員
      const sortedUsers = [...users]
        .sort((a: { createdAt: string }, b: { createdAt: string }) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5)
        .map((user: { id: string; name: string; email: string; createdAt: string }) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        }))

      setRecentUsers(sortedUsers)
    } catch (err) {
      const message = err instanceof Error ? err.message : '載入儀表板資料失敗'
      setError(message)
      logger.error('[useDashboard] API 錯誤', { error: err })
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 獲取圖表資料
  const fetchChartData = useCallback(async (period: 'day' | 'week' | 'month') => {
    setIsChartLoading(true)
    try {
      const [revenueRes, statusRes, productsRes] = await Promise.all([
        dashboardApi.getRevenueTrend(period).catch(() => ({ data: [] })),
        dashboardApi.getOrderStatus().catch(() => ({ data: [] })),
        dashboardApi.getTopProducts(10).catch(() => ({ data: [] })),
      ])

      setRevenueTrend(revenueRes.data || [])
      setOrderStatus(statusRes.data || [])
      setTopProducts(productsRes.data || [])
    } catch (err) {
      logger.error('[useDashboard] 圖表資料載入錯誤', { error: err })
    } finally {
      setIsChartLoading(false)
    }
  }, [])

  // 當 period 改變時重新獲取營收趨勢
  const handlePeriodChange = useCallback((period: 'day' | 'week' | 'month') => {
    setRevenuePeriod(period)
    dashboardApi.getRevenueTrend(period)
      .then((res) => setRevenueTrend(res.data || []))
      .catch((err) => logger.error('[useDashboard] 營收趨勢載入錯誤', { error: err }))
  }, [])

  useEffect(() => {
    fetchDashboardData()
    fetchChartData(revenuePeriod)
  }, [fetchDashboardData, fetchChartData, revenuePeriod])

  return {
    stats,
    recentOrders,
    recentUsers,
    // 圖表資料
    revenueTrend,
    orderStatus,
    topProducts,
    revenuePeriod,
    setRevenuePeriod: handlePeriodChange,
    // 載入狀態
    isLoading,
    isChartLoading,
    error,
    refetch: fetchDashboardData,
  }
}
