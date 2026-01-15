import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

export interface OrderStatusData {
  status: string
  count: number
  label: string
}

interface OrderStatusPieChartProps {
  data: OrderStatusData[]
  isLoading?: boolean
}

// 訂單狀態顏色映射
const STATUS_COLORS: Record<string, string> = {
  pending: '#fbbf24',     // 黃色 - 待處理
  confirmed: '#3b82f6',   // 藍色 - 已確認
  processing: '#8b5cf6',  // 紫色 - 處理中
  shipped: '#a855f7',     // 淺紫 - 已出貨
  delivered: '#22c55e',   // 綠色 - 已送達
  cancelled: '#ef4444',   // 紅色 - 已取消
  refunded: '#6b7280',    // 灰色 - 已退款
}

/**
 * 訂單狀態圓餅圖
 * 顯示各狀態訂單的分布
 */
export function OrderStatusPieChart({ data, isLoading = false }: OrderStatusPieChartProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0)

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">訂單狀態分布</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        </div>
      </div>
    )
  }

  if (data.length === 0 || total === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">訂單狀態分布</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          暫無訂單數據
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">訂單狀態分布</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              label={({ label, percent }) =>
                percent > 0.05 ? `${label} ${(percent * 100).toFixed(0)}%` : ''
              }
              labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.status}
                  fill={STATUS_COLORS[entry.status] || '#9ca3af'}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [
                `${value} 筆 (${((value / total) * 100).toFixed(1)}%)`,
                name,
              ]}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 text-center text-sm text-gray-500">
        總計 {total} 筆訂單
      </div>
    </div>
  )
}
