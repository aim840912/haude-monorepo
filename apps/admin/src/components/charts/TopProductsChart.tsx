import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export interface TopProductData {
  id: string
  name: string
  sales: number
  revenue: number
}

interface TopProductsChartProps {
  data: TopProductData[]
  isLoading?: boolean
}

/**
 * 熱銷產品長條圖
 * 顯示銷量前 10 的產品
 */
export function TopProductsChart({ data, isLoading = false }: TopProductsChartProps) {
  const formatCurrency = (value: number) => `NT$ ${value.toLocaleString()}`

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">熱銷產品 TOP 10</h3>
        <div className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">熱銷產品 TOP 10</h3>
        <div className="h-80 flex items-center justify-center text-gray-500">
          暫無銷售數據
        </div>
      </div>
    )
  }

  // 截斷過長的產品名稱
  const chartData = data.map((item) => ({
    ...item,
    displayName: item.name.length > 10 ? `${item.name.slice(0, 10)}...` : item.name,
  }))

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">熱銷產品 TOP 10</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              type="category"
              dataKey="displayName"
              width={100}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === 'sales') return [`${value} 件`, '銷量']
                if (name === 'revenue') return [formatCurrency(value), '營收']
                return [value, name]
              }}
              labelFormatter={(_, payload) => {
                const item = payload?.[0]?.payload
                return item?.name || ''
              }}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            />
            <Bar dataKey="sales" fill="#16a34a" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
