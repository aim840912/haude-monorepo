import { api } from './client'

// ==================== Reports API ====================
// 銷售報表

export interface PeriodStats {
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  cancelRate: number
}

export interface SalesSummaryResponse {
  current: PeriodStats
  compare: PeriodStats | null
  changes: {
    revenueChange: number
    ordersChange: number
    aovChange: number
    cancelRateChange: number
  } | null
  period: {
    start: string
    end: string
  }
}

export interface SalesTrendItem {
  date: string
  revenue: number
  orders: number
  averageOrderValue: number
}

export interface SalesDetailItem {
  date: string
  orderNumber: string
  customerName: string
  productCount: number
  subtotal: number
  discount: number
  shipping: number
  total: number
  status: string
  paymentStatus: string
}

export interface SalesDetailResponse {
  items: SalesDetailItem[]
  total: number
  hasMore: boolean
}

export type CompareMode = 'yoy' | 'mom' | 'wow'
export type GroupBy = 'day' | 'week' | 'month'

export const reportsApi = {
  // 取得銷售摘要（含同比環比）
  getSummary: (params: {
    startDate: string
    endDate: string
    compareMode?: CompareMode
  }) => {
    const searchParams = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
    })
    if (params.compareMode) {
      searchParams.append('compareMode', params.compareMode)
    }
    return api.get<SalesSummaryResponse>(`/admin/reports/summary?${searchParams.toString()}`)
  },

  // 取得銷售趨勢
  getSalesTrend: (params: {
    startDate: string
    endDate: string
    groupBy?: GroupBy
  }) => {
    const searchParams = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
    })
    if (params.groupBy) {
      searchParams.append('groupBy', params.groupBy)
    }
    return api.get<SalesTrendItem[]>(`/admin/reports/sales-trend?${searchParams.toString()}`)
  },

  // 取得銷售明細（分頁）
  getSalesDetail: (params: {
    startDate: string
    endDate: string
    limit?: number
    offset?: number
  }) => {
    const searchParams = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
    })
    if (params.limit) {
      searchParams.append('limit', params.limit.toString())
    }
    if (params.offset) {
      searchParams.append('offset', params.offset.toString())
    }
    return api.get<SalesDetailResponse>(`/admin/reports/sales-detail?${searchParams.toString()}`)
  },
}
