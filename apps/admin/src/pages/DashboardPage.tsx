import { Package, ShoppingCart, Users, TrendingUp, RefreshCw, Clock, UserPlus } from 'lucide-react'
import { useDashboard } from '../hooks/useDashboard'

// 訂單狀態中文名稱
const orderStatusLabels: Record<string, string> = {
  pending: '待處理',
  confirmed: '已確認',
  processing: '處理中',
  shipped: '已出貨',
  delivered: '已送達',
  cancelled: '已取消',
  refunded: '已退款',
}

// 訂單狀態樣式
const orderStatusStyles: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
}

// 格式化日期
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-TW', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 格式化金額
function formatCurrency(amount: number): string {
  return `NT$ ${amount.toLocaleString()}`
}

export function DashboardPage() {
  const { stats, recentOrders, recentUsers, isLoading, error, refetch } = useDashboard()

  const statCards = [
    { label: '總產品數', value: stats.totalProducts.toString(), icon: Package, color: 'bg-blue-500' },
    { label: '總訂單數', value: stats.totalOrders.toString(), icon: ShoppingCart, color: 'bg-green-500' },
    { label: '註冊會員', value: stats.totalUsers.toLocaleString(), icon: Users, color: 'bg-purple-500' },
    { label: '總營收', value: formatCurrency(stats.totalRevenue), icon: TrendingUp, color: 'bg-orange-500' },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={refetch}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          <RefreshCw className="w-4 h-4" />
          重試
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">儀表板</h1>
        <button
          onClick={refetch}
          className="p-2 text-gray-600 hover:text-green-600 hover:bg-gray-100 rounded-lg"
          title="重新整理"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">最新訂單</h2>
          </div>
          {recentOrders.length === 0 ? (
            <div className="text-gray-500 text-center py-8">尚無訂單記錄</div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 truncate">
                        {order.orderNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          orderStatusStyles[order.status] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {orderStatusLabels[order.status] || order.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {order.customerName} · {formatDate(order.createdAt)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-gray-900">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">新註冊會員</h2>
          </div>
          {recentUsers.length === 0 ? (
            <div className="text-gray-500 text-center py-8">尚無會員記錄</div>
          ) : (
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{user.name}</div>
                    <div className="text-sm text-gray-500 truncate">{user.email}</div>
                  </div>
                  <div className="text-sm text-gray-400">{formatDate(user.createdAt)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
