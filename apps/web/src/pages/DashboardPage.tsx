import { useAuth } from '../hooks/useAuth'
import { Users, ShoppingCart, TrendingUp, Activity } from 'lucide-react'

export function DashboardPage() {
  const { user } = useAuth()

  const stats = [
    { name: '總用戶數', value: '2,651', icon: Users, change: '+12%', changeType: 'increase' },
    { name: '總訂單數', value: '1,234', icon: ShoppingCart, change: '+8%', changeType: 'increase' },
    { name: '營收', value: 'NT$ 456,789', icon: TrendingUp, change: '+15%', changeType: 'increase' },
    { name: '活躍用戶', value: '892', icon: Activity, change: '-3%', changeType: 'decrease' },
  ]

  // 使用固定的 mock 數據，避免在 render 期間調用不純函數
  const recentOrderAmounts = [350, 520, 180, 890, 420]

  return (
    <div>
      {/* Welcome message */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          歡迎回來，{user?.name || '使用者'}！
        </h1>
        <p className="text-gray-500">這是您的 Dashboard 概覽</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <stat.icon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <span
                className={`text-sm font-medium ${
                  stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {stat.change}
              </span>
              <span className="text-sm text-gray-500 ml-1">vs 上個月</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">最近訂單</h2>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">訂單 #{1000 + i}</p>
                    <p className="text-xs text-gray-500">2 分鐘前</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-900">NT$ {recentOrderAmounts[i - 1]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Users */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">最近註冊用戶</h2>
          <div className="space-y-4">
            {['Alice', 'Bob', 'Charlie', 'David', 'Eve'].map((name, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">{name[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{name}</p>
                    <p className="text-xs text-gray-500">{name.toLowerCase()}@example.com</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{i + 1} 小時前</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
