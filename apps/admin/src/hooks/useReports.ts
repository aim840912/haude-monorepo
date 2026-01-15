import { useState, useCallback } from 'react'
import {
  reportsApi,
  type SalesSummaryResponse,
  type SalesTrendItem,
  type SalesDetailResponse,
  type CompareMode,
  type GroupBy,
} from '../services/api'
import logger from '../lib/logger'

export interface ReportFilters {
  startDate: string
  endDate: string
  compareMode?: CompareMode
  groupBy: GroupBy
}

interface UseReportsReturn {
  // 資料
  summary: SalesSummaryResponse | null
  trend: SalesTrendItem[]
  detail: SalesDetailResponse | null
  // 篩選條件
  filters: ReportFilters
  setFilters: (filters: ReportFilters) => void
  // 分頁
  page: number
  setPage: (page: number) => void
  pageSize: number
  // 載入狀態
  isLoading: boolean
  isTrendLoading: boolean
  isDetailLoading: boolean
  error: string | null
  // 操作
  fetchSummary: () => Promise<void>
  fetchTrend: () => Promise<void>
  fetchDetail: (offset?: number) => Promise<void>
  fetchAll: () => Promise<void>
}

// 取得預設日期範圍（過去 30 天）
function getDefaultDateRange(): { startDate: string; endDate: string } {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  }
}

export function useReports(): UseReportsReturn {
  const defaultRange = getDefaultDateRange()

  const [filters, setFilters] = useState<ReportFilters>({
    startDate: defaultRange.startDate,
    endDate: defaultRange.endDate,
    compareMode: undefined,
    groupBy: 'day',
  })

  const [summary, setSummary] = useState<SalesSummaryResponse | null>(null)
  const [trend, setTrend] = useState<SalesTrendItem[]>([])
  const [detail, setDetail] = useState<SalesDetailResponse | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [isTrendLoading, setIsTrendLoading] = useState(false)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const pageSize = 20

  // 取得銷售摘要
  const fetchSummary = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await reportsApi.getSummary({
        startDate: filters.startDate,
        endDate: filters.endDate,
        compareMode: filters.compareMode,
      })
      setSummary(response.data)
    } catch (err) {
      const message = err instanceof Error ? err.message : '載入銷售摘要失敗'
      setError(message)
      logger.error('[useReports] 銷售摘要載入錯誤', { error: err instanceof Error ? err.message : String(err) })
    } finally {
      setIsLoading(false)
    }
  }, [filters.startDate, filters.endDate, filters.compareMode])

  // 取得銷售趨勢
  const fetchTrend = useCallback(async () => {
    setIsTrendLoading(true)
    try {
      const response = await reportsApi.getSalesTrend({
        startDate: filters.startDate,
        endDate: filters.endDate,
        groupBy: filters.groupBy,
      })
      setTrend(response.data || [])
    } catch (err) {
      logger.error('[useReports] 銷售趨勢載入錯誤', { error: err instanceof Error ? err.message : String(err) })
    } finally {
      setIsTrendLoading(false)
    }
  }, [filters.startDate, filters.endDate, filters.groupBy])

  // 取得銷售明細
  const fetchDetail = useCallback(async (offset = 0) => {
    setIsDetailLoading(true)
    try {
      const response = await reportsApi.getSalesDetail({
        startDate: filters.startDate,
        endDate: filters.endDate,
        limit: pageSize,
        offset,
      })
      setDetail(response.data)
    } catch (err) {
      logger.error('[useReports] 銷售明細載入錯誤', { error: err instanceof Error ? err.message : String(err) })
    } finally {
      setIsDetailLoading(false)
    }
  }, [filters.startDate, filters.endDate, pageSize])

  // 取得所有報表資料
  const fetchAll = useCallback(async () => {
    await Promise.all([
      fetchSummary(),
      fetchTrend(),
      fetchDetail(0),
    ])
    setPage(1)
  }, [fetchSummary, fetchTrend, fetchDetail])

  // 處理分頁變更
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
    fetchDetail((newPage - 1) * pageSize)
  }, [fetchDetail, pageSize])

  return {
    // 資料
    summary,
    trend,
    detail,
    // 篩選條件
    filters,
    setFilters,
    // 分頁
    page,
    setPage: handlePageChange,
    pageSize,
    // 載入狀態
    isLoading,
    isTrendLoading,
    isDetailLoading,
    error,
    // 操作
    fetchSummary,
    fetchTrend,
    fetchDetail,
    fetchAll,
  }
}
