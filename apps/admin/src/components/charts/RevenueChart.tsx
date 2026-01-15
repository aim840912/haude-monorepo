import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export interface RevenueTrendData {
  date: string
  revenue: number
  orders: number
}

interface RevenueChartProps {
  data: RevenueTrendData[]
  period: 'day' | 'week' | 'month'
  onPeriodChange: (period: 'day' | 'week' | 'month') => void
  isLoading?: boolean
}

const periodLabels = {
  day: '近 7 天',
  week: '近 4 週',
  month: '近 6 個月',
}

/**
 * 營收趨勢折線圖
 * 支援日/週/月視圖切換
 */
export function RevenueChart({
  data,
  period,
  onPeriodChange,
  isLoading = false,
}: RevenueChartProps) {
  const formatCurrency = (value: number) => `NT$ ${value.toLocaleString()}`
  const formatDate = (date: string) => {
    const d = new Date(date)
    switch (period) {
      case 'day':
        return d.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })
      case 'week':
        return `W${Math.ceil(d.getDate() / 7)}`
      case 'month':
        return d.toLocaleDateString('zh-TW', { month: 'short' })
      default:
        return date
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">營收趨勢</h3>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['day', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                period === p
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        </div>
      ) : data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          暫無數據
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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
                formatter={(value: number) => [formatCurrency(value), '營收']}
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
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
