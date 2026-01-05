import { Package, ShoppingCart, Users, TrendingUp } from 'lucide-react'

const stats = [
  { label: '總產品數', value: '24', icon: Package, color: 'bg-blue-500' },
  { label: '本月訂單', value: '156', icon: ShoppingCart, color: 'bg-green-500' },
  { label: '註冊會員', value: '1,234', icon: Users, color: 'bg-purple-500' },
  { label: '本月營收', value: 'NT$ 89,400', icon: TrendingUp, color: 'bg-orange-500' },
]

export function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">儀表板</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
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

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">最近活動</h2>
        <div className="text-gray-500 text-center py-8">
          尚無活動記錄
        </div>
      </div>
    </div>
  )
}
