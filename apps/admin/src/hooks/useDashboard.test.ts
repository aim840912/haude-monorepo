// @ts-nocheck - 測試檔案的 mock 型別與嚴格的 AxiosResponse 型別不完全匹配
/**
 * Admin 儀表板 Hook 單元測試
 *
 * 測試功能：
 * - useDashboard：儀表板統計與圖表資料
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

// Mock API
vi.mock('../services/api', () => ({
  productsApi: {
    getAll: vi.fn(),
  },
  ordersApi: {
    getAll: vi.fn(),
  },
  usersApi: {
    getAll: vi.fn(),
  },
  dashboardApi: {
    getRevenueTrend: vi.fn(),
    getOrderStatus: vi.fn(),
    getTopProducts: vi.fn(),
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

import { useDashboard } from './useDashboard'
import { productsApi, ordersApi, usersApi, dashboardApi } from '../services/api'

describe('useDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ========================================
  // 統計資料
  // ========================================

  describe('統計資料', () => {
    it('應該載入所有統計資料', async () => {
      // Mock 基礎資料
      vi.mocked(productsApi.getAll).mockResolvedValue({
        data: [{ id: 'p1' }, { id: 'p2' }],
      })
      vi.mocked(ordersApi.getAll).mockResolvedValue({
        data: {
          orders: [
            { id: 'o1', totalAmount: 1000, createdAt: '2024-01-15T10:00:00Z', status: 'PAID', shippingAddress: { name: '張三' } },
            { id: 'o2', totalAmount: 2000, createdAt: '2024-01-14T10:00:00Z', status: 'PENDING', shippingAddress: { name: '李四' } },
          ],
          total: 2,
        },
      })
      vi.mocked(usersApi.getAll).mockResolvedValue({
        data: [{ id: 'u1', name: '用戶1', email: 'u1@test.com', createdAt: '2024-01-10T10:00:00Z' }],
      })

      // Mock 圖表資料
      vi.mocked(dashboardApi.getRevenueTrend).mockResolvedValue({
        data: [{ date: '2024-01-15', revenue: 3000, orders: 2 }],
      })
      vi.mocked(dashboardApi.getOrderStatus).mockResolvedValue({
        data: [{ status: 'PAID', count: 1, label: '已付款' }],
      })
      vi.mocked(dashboardApi.getTopProducts).mockResolvedValue({
        data: [{ id: 'p1', name: '產品1', sales: 10, revenue: 5000 }],
      })

      const { result } = renderHook(() => useDashboard())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.stats.totalProducts).toBe(2)
      expect(result.current.stats.totalOrders).toBe(2)
      expect(result.current.stats.totalUsers).toBe(1)
      expect(result.current.stats.totalRevenue).toBe(3000) // 1000 + 2000
      expect(result.current.error).toBeNull()
    })

    it('應該計算最近訂單', async () => {
      vi.mocked(productsApi.getAll).mockResolvedValue({ data: [] })
      vi.mocked(ordersApi.getAll).mockResolvedValue({
        data: {
          orders: [
            { id: 'o1', orderNumber: 'ORD-001', totalAmount: 1000, status: 'PAID', createdAt: '2024-01-10T10:00:00Z', shippingAddress: { name: '張三' } },
            { id: 'o2', orderNumber: 'ORD-002', totalAmount: 2000, status: 'PENDING', createdAt: '2024-01-15T10:00:00Z', shippingAddress: { name: '李四' } },
          ],
          total: 2,
        },
      })
      vi.mocked(usersApi.getAll).mockResolvedValue({ data: [] })
      vi.mocked(dashboardApi.getRevenueTrend).mockResolvedValue({ data: [] })
      vi.mocked(dashboardApi.getOrderStatus).mockResolvedValue({ data: [] })
      vi.mocked(dashboardApi.getTopProducts).mockResolvedValue({ data: [] })

      const { result } = renderHook(() => useDashboard())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // 最近訂單按時間排序（最新的在前）
      expect(result.current.recentOrders[0].orderNumber).toBe('ORD-002')
      expect(result.current.recentOrders[0].customerName).toBe('李四')
    })

    it('應該計算最近用戶', async () => {
      vi.mocked(productsApi.getAll).mockResolvedValue({ data: [] })
      vi.mocked(ordersApi.getAll).mockResolvedValue({ data: { orders: [], total: 0 } })
      vi.mocked(usersApi.getAll).mockResolvedValue({
        data: [
          { id: 'u1', name: '舊用戶', email: 'old@test.com', createdAt: '2024-01-01T10:00:00Z' },
          { id: 'u2', name: '新用戶', email: 'new@test.com', createdAt: '2024-01-15T10:00:00Z' },
        ],
      })
      vi.mocked(dashboardApi.getRevenueTrend).mockResolvedValue({ data: [] })
      vi.mocked(dashboardApi.getOrderStatus).mockResolvedValue({ data: [] })
      vi.mocked(dashboardApi.getTopProducts).mockResolvedValue({ data: [] })

      const { result } = renderHook(() => useDashboard())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // 最近用戶按時間排序（最新的在前）
      expect(result.current.recentUsers[0].name).toBe('新用戶')
    })
  })

  // ========================================
  // 圖表資料
  // ========================================

  describe('圖表資料', () => {
    it('應該載入營收趨勢', async () => {
      vi.mocked(productsApi.getAll).mockResolvedValue({ data: [] })
      vi.mocked(ordersApi.getAll).mockResolvedValue({ data: { orders: [], total: 0 } })
      vi.mocked(usersApi.getAll).mockResolvedValue({ data: [] })
      vi.mocked(dashboardApi.getRevenueTrend).mockResolvedValue({
        data: [
          { date: '2024-01-14', revenue: 1000, orders: 1 },
          { date: '2024-01-15', revenue: 2000, orders: 2 },
        ],
      })
      vi.mocked(dashboardApi.getOrderStatus).mockResolvedValue({ data: [] })
      vi.mocked(dashboardApi.getTopProducts).mockResolvedValue({ data: [] })

      const { result } = renderHook(() => useDashboard())

      await waitFor(() => {
        expect(result.current.isChartLoading).toBe(false)
      })

      expect(result.current.revenueTrend).toHaveLength(2)
      expect(result.current.revenueTrend[0].revenue).toBe(1000)
    })

    it('應該載入訂單狀態分布', async () => {
      vi.mocked(productsApi.getAll).mockResolvedValue({ data: [] })
      vi.mocked(ordersApi.getAll).mockResolvedValue({ data: { orders: [], total: 0 } })
      vi.mocked(usersApi.getAll).mockResolvedValue({ data: [] })
      vi.mocked(dashboardApi.getRevenueTrend).mockResolvedValue({ data: [] })
      vi.mocked(dashboardApi.getOrderStatus).mockResolvedValue({
        data: [
          { status: 'PAID', count: 10, label: '已付款' },
          { status: 'PENDING', count: 5, label: '待付款' },
        ],
      })
      vi.mocked(dashboardApi.getTopProducts).mockResolvedValue({ data: [] })

      const { result } = renderHook(() => useDashboard())

      await waitFor(() => {
        expect(result.current.isChartLoading).toBe(false)
      })

      expect(result.current.orderStatus).toHaveLength(2)
      expect(result.current.orderStatus[0].count).toBe(10)
    })

    it('應該載入熱門產品', async () => {
      vi.mocked(productsApi.getAll).mockResolvedValue({ data: [] })
      vi.mocked(ordersApi.getAll).mockResolvedValue({ data: { orders: [], total: 0 } })
      vi.mocked(usersApi.getAll).mockResolvedValue({ data: [] })
      vi.mocked(dashboardApi.getRevenueTrend).mockResolvedValue({ data: [] })
      vi.mocked(dashboardApi.getOrderStatus).mockResolvedValue({ data: [] })
      vi.mocked(dashboardApi.getTopProducts).mockResolvedValue({
        data: [
          { id: 'p1', name: '熱賣商品', sales: 100, revenue: 50000 },
        ],
      })

      const { result } = renderHook(() => useDashboard())

      await waitFor(() => {
        expect(result.current.isChartLoading).toBe(false)
      })

      expect(result.current.topProducts).toHaveLength(1)
      expect(result.current.topProducts[0].sales).toBe(100)
    })

    it('setRevenuePeriod 應該切換期間並重新載入', async () => {
      vi.mocked(productsApi.getAll).mockResolvedValue({ data: [] })
      vi.mocked(ordersApi.getAll).mockResolvedValue({ data: { orders: [], total: 0 } })
      vi.mocked(usersApi.getAll).mockResolvedValue({ data: [] })
      vi.mocked(dashboardApi.getRevenueTrend).mockResolvedValue({ data: [] })
      vi.mocked(dashboardApi.getOrderStatus).mockResolvedValue({ data: [] })
      vi.mocked(dashboardApi.getTopProducts).mockResolvedValue({ data: [] })

      const { result } = renderHook(() => useDashboard())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // 預設是 'day'
      expect(result.current.revenuePeriod).toBe('day')

      // 切換到 'week'
      vi.mocked(dashboardApi.getRevenueTrend).mockClear()
      vi.mocked(dashboardApi.getRevenueTrend).mockResolvedValue({ data: [] })

      act(() => {
        result.current.setRevenuePeriod('week')
      })

      expect(result.current.revenuePeriod).toBe('week')
      // 驗證 API 被呼叫
      await waitFor(() => {
        expect(dashboardApi.getRevenueTrend).toHaveBeenCalledWith('week')
      })
    })
  })

  // ========================================
  // 錯誤處理
  // ========================================

  describe('錯誤處理', () => {
    it('單一 API 失敗應該優雅降級使用預設值（不設定 error）', async () => {
      // 注意：useDashboard 使用 .catch() 處理每個 API 失敗
      // 所以個別 API 失敗不會觸發 error，而是使用預設值
      vi.mocked(productsApi.getAll).mockRejectedValue(new Error('載入失敗'))
      vi.mocked(ordersApi.getAll).mockRejectedValue(new Error('載入失敗'))
      vi.mocked(usersApi.getAll).mockRejectedValue(new Error('載入失敗'))
      vi.mocked(dashboardApi.getRevenueTrend).mockResolvedValue({ data: [] })
      vi.mocked(dashboardApi.getOrderStatus).mockResolvedValue({ data: [] })
      vi.mocked(dashboardApi.getTopProducts).mockResolvedValue({ data: [] })

      const { result } = renderHook(() => useDashboard())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // 由於 .catch() 處理，error 保持 null
      expect(result.current.error).toBeNull()
      // 但統計數據使用預設值
      expect(result.current.stats.totalProducts).toBe(0)
      expect(result.current.stats.totalOrders).toBe(0)
      expect(result.current.stats.totalUsers).toBe(0)
    })

    it('部分 API 失敗應該使用預設值', async () => {
      vi.mocked(productsApi.getAll).mockResolvedValue({ data: [{ id: 'p1' }] })
      vi.mocked(ordersApi.getAll).mockRejectedValue(new Error('網路錯誤'))
      vi.mocked(usersApi.getAll).mockRejectedValue(new Error('網路錯誤'))
      vi.mocked(dashboardApi.getRevenueTrend).mockResolvedValue({ data: [] })
      vi.mocked(dashboardApi.getOrderStatus).mockResolvedValue({ data: [] })
      vi.mocked(dashboardApi.getTopProducts).mockResolvedValue({ data: [] })

      const { result } = renderHook(() => useDashboard())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // 產品成功載入
      expect(result.current.stats.totalProducts).toBe(1)
      // 其他使用預設值
      expect(result.current.stats.totalOrders).toBe(0)
      expect(result.current.stats.totalUsers).toBe(0)
    })
  })

  // ========================================
  // refetch
  // ========================================

  describe('refetch', () => {
    it('應該支援手動重新載入', async () => {
      vi.mocked(productsApi.getAll).mockResolvedValue({ data: [] })
      vi.mocked(ordersApi.getAll).mockResolvedValue({ data: { orders: [], total: 0 } })
      vi.mocked(usersApi.getAll).mockResolvedValue({ data: [] })
      vi.mocked(dashboardApi.getRevenueTrend).mockResolvedValue({ data: [] })
      vi.mocked(dashboardApi.getOrderStatus).mockResolvedValue({ data: [] })
      vi.mocked(dashboardApi.getTopProducts).mockResolvedValue({ data: [] })

      const { result } = renderHook(() => useDashboard())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // 清除呼叫記錄
      vi.mocked(productsApi.getAll).mockClear()
      vi.mocked(ordersApi.getAll).mockClear()
      vi.mocked(usersApi.getAll).mockClear()

      await act(async () => {
        await result.current.refetch()
      })

      // 驗證 API 被重新呼叫
      expect(productsApi.getAll).toHaveBeenCalled()
      expect(ordersApi.getAll).toHaveBeenCalled()
      expect(usersApi.getAll).toHaveBeenCalled()
    })
  })
})
