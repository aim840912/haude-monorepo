import { useState, useEffect, useCallback } from 'react'
import { productsApi, ordersApi, usersApi } from '../services/api'

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

interface UseDashboardReturn {
  stats: DashboardStats
  recentOrders: RecentOrder[]
  recentUsers: RecentUser[]
  isLoading: boolean
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

      // 計算統計數據
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
      console.error('[useDashboard] API 錯誤:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  return {
    stats,
    recentOrders,
    recentUsers,
    isLoading,
    error,
    refetch: fetchDashboardData,
  }
}
