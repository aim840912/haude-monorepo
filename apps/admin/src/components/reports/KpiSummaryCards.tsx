import { DollarSign, ShoppingCart, TrendingUp, XCircle, ArrowUp, ArrowDown } from 'lucide-react'
import { AnimatedNumber } from '../charts/AnimatedNumber'
import type { PeriodStats } from '../../services/api'

interface KpiSummaryCardsProps {
  current: PeriodStats
  changes?: {
    revenueChange: number
    ordersChange: number
    aovChange: number
    cancelRateChange: number
  } | null
  isLoading?: boolean
}

interface KpiCardProps {
  title: string
  value: number
  change?: number
  icon: React.ReactNode
  formatter?: (value: number) => string
  prefix?: string
  suffix?: string
  isLoading?: boolean
  isInverse?: boolean // 數值下降反而是好事（如取消率）
}

function KpiCard({
  title,
  value,
  change,
  icon,
  formatter,
  prefix = '',
  suffix = '',
  isLoading = false,
  isInverse = false,
}: KpiCardProps) {
  const hasChange = change !== undefined && change !== null
  const isPositive = isInverse ? change !== undefined && change < 0 : change !== undefined && change > 0

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          {isLoading ? (
            <div className="h-8 w-24 bg-gray-200 animate-pulse rounded mt-1" />
          ) : (
            <div className="mt-1">
              <AnimatedNumber
                value={value}
                prefix={prefix}
                suffix={suffix}
                formatter={formatter}
                className="text-2xl font-bold text-gray-900"
              />
            </div>
          )}
          {hasChange && !isLoading && (
            <div className={`flex items-center mt-2 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? (
                <ArrowUp className="w-4 h-4 mr-1" />
              ) : (
                <ArrowDown className="w-4 h-4 mr-1" />
              )}
              <span>
                {Math.abs(change).toFixed(1)}%
                <span className="text-gray-500 ml-1">vs 前期</span>
              </span>
            </div>
          )}
        </div>
        <div className="p-3 bg-green-50 rounded-full text-green-600">
          {icon}
        </div>
      </div>
    </div>
  )
}

export function KpiSummaryCards({ current, changes, isLoading = false }: KpiSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        title="總營收"
        value={current.totalRevenue}
        change={changes?.revenueChange}
        icon={<DollarSign className="w-6 h-6" />}
        prefix="NT$ "
        isLoading={isLoading}
      />
      <KpiCard
        title="訂單數"
        value={current.totalOrders}
        change={changes?.ordersChange}
        icon={<ShoppingCart className="w-6 h-6" />}
        suffix=" 筆"
        isLoading={isLoading}
      />
      <KpiCard
        title="平均客單價"
        value={current.averageOrderValue}
        change={changes?.aovChange}
        icon={<TrendingUp className="w-6 h-6" />}
        prefix="NT$ "
        isLoading={isLoading}
      />
      <KpiCard
        title="取消率"
        value={current.cancelRate}
        change={changes?.cancelRateChange}
        icon={<XCircle className="w-6 h-6" />}
        suffix="%"
        formatter={(v) => v.toFixed(1)}
        isLoading={isLoading}
        isInverse={true}
      />
    </div>
  )
}
