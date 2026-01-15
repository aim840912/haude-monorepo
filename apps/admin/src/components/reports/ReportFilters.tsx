import { Calendar, RefreshCw, Download } from 'lucide-react'
import type { CompareMode, GroupBy } from '../../services/api'

interface ReportFiltersProps {
  startDate: string
  endDate: string
  compareMode?: CompareMode
  groupBy: GroupBy
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  onCompareModeChange: (mode: CompareMode | undefined) => void
  onGroupByChange: (groupBy: GroupBy) => void
  onRefresh: () => void
  onExport?: () => void
  isLoading?: boolean
}

const compareModeOptions: { value: CompareMode | ''; label: string }[] = [
  { value: '', label: '不比較' },
  { value: 'yoy', label: '年同比 (YoY)' },
  { value: 'mom', label: '月環比 (MoM)' },
  { value: 'wow', label: '週環比 (WoW)' },
]

const groupByOptions: { value: GroupBy; label: string }[] = [
  { value: 'day', label: '按日' },
  { value: 'week', label: '按週' },
  { value: 'month', label: '按月' },
]

export function ReportFilters({
  startDate,
  endDate,
  compareMode,
  groupBy,
  onStartDateChange,
  onEndDateChange,
  onCompareModeChange,
  onGroupByChange,
  onRefresh,
  onExport,
  isLoading = false,
}: ReportFiltersProps) {
  // 快捷日期範圍
  const setDateRange = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    onStartDateChange(start.toISOString().slice(0, 10))
    onEndDateChange(end.toISOString().slice(0, 10))
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* 日期範圍 */}
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-400" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <span className="text-gray-500">至</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* 快捷按鈕 */}
        <div className="flex gap-2">
          <button
            onClick={() => setDateRange(7)}
            className="px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            近 7 天
          </button>
          <button
            onClick={() => setDateRange(30)}
            className="px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            近 30 天
          </button>
          <button
            onClick={() => setDateRange(90)}
            className="px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            近 90 天
          </button>
        </div>

        {/* 比較模式 */}
        <select
          value={compareMode || ''}
          onChange={(e) => onCompareModeChange(e.target.value as CompareMode | undefined || undefined)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          {compareModeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* 分組方式 */}
        <select
          value={groupBy}
          onChange={(e) => onGroupByChange(e.target.value as GroupBy)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          {groupByOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* 操作按鈕 */}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            重新整理
          </button>
          {onExport && (
            <button
              onClick={onExport}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              匯出 Excel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
