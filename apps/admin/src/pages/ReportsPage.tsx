import { useEffect, useCallback } from 'react'
import { FileSpreadsheet } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { KpiSummaryCards, ReportFilters, SalesTable } from '../components/reports'
import { useReports } from '../hooks/useReports'
import { exportSalesReport } from '../utils/exportExcel'

export function ReportsPage() {
  const {
    summary,
    trend,
    detail,
    filters,
    setFilters,
    page,
    setPage,
    pageSize,
    isLoading,
    isTrendLoading,
    isDetailLoading,
    error,
    fetchAll,
  } = useReports()

  // 初始載入
  useEffect(() => {
    fetchAll()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 處理篩選條件變更
  const handleFiltersApply = useCallback(() => {
    fetchAll()
  }, [fetchAll])

  // 處理匯出
  const handleExport = useCallback(() => {
    if (!summary || !detail) return

    exportSalesReport({
      summary: summary.current,
      changes: summary.changes,
      period: summary.period,
      items: detail.items,
    })
  }, [summary, detail])

  // 格式化日期顯示
  const formatDate = (date: string) => {
    const d = new Date(date)
    return d.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })
  }

  // 格式化金額
  const formatCurrency = (value: number) => `NT$ ${value.toLocaleString()}`

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-100 rounded-lg">
          <FileSpreadsheet className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">銷售報表</h1>
          <p className="text-sm text-gray-500">查看銷售數據與趨勢分析</p>
        </div>
      </div>

      {/* 錯誤提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* 篩選器 */}
      <ReportFilters
        startDate={filters.startDate}
        endDate={filters.endDate}
        compareMode={filters.compareMode}
        groupBy={filters.groupBy}
        onStartDateChange={(date) => setFilters({ ...filters, startDate: date })}
        onEndDateChange={(date) => setFilters({ ...filters, endDate: date })}
        onCompareModeChange={(mode) => setFilters({ ...filters, compareMode: mode })}
        onGroupByChange={(groupBy) => setFilters({ ...filters, groupBy })}
        onRefresh={handleFiltersApply}
        onExport={handleExport}
        isLoading={isLoading}
      />

      {/* KPI 摘要卡片 */}
      {summary ? (
        <KpiSummaryCards
          current={summary.current}
          changes={summary.changes}
          isLoading={isLoading}
        />
      ) : (
        <KpiSummaryCards
          current={{
            totalRevenue: 0,
            totalOrders: 0,
            averageOrderValue: 0,
            cancelRate: 0,
          }}
          isLoading={isLoading}
        />
      )}

      {/* 營收趨勢圖 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">營收趨勢</h3>
        {isTrendLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
          </div>
        ) : trend.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-500">
            此期間暫無營收數據
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'revenue') return [formatCurrency(value), '營收']
                    if (name === 'orders') return [value, '訂單數']
                    return [value, name]
                  }}
                  labelFormatter={formatDate}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={{ fill: '#16a34a', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#16a34a' }}
                  name="revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 銷售明細表格 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">銷售明細</h3>
        <SalesTable
          items={detail?.items || []}
          total={detail?.total || 0}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          isLoading={isDetailLoading}
        />
      </div>
    </div>
  )
}
