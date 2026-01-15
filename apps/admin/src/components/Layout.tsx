import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  TreeDeciduous,
  CalendarDays,
  ShoppingCart,
  CreditCard,
  Users,
  MapPin,
  Settings,
  Menu,
  X,
  LogOut,
  Tag,
  Share2,
  FileSpreadsheet,
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { NotificationBell } from './notifications'

const navItems = [
  { path: '/', label: '儀表板', icon: LayoutDashboard },
  { path: '/products', label: '產品管理', icon: Package },
  { path: '/farm-tours', label: '觀光果園', icon: TreeDeciduous },
  { path: '/schedules', label: '擺攤行程', icon: CalendarDays },
  { path: '/locations', label: '門市管理', icon: MapPin },
  { path: '/orders', label: '訂單管理', icon: ShoppingCart },
  { path: '/payments', label: '付款監控', icon: CreditCard },
  { path: '/discounts', label: '折扣碼管理', icon: Tag },
  { path: '/social-posts', label: '社群貼文', icon: Share2 },
  { path: '/users', label: '會員管理', icon: Users },
  { path: '/reports', label: '銷售報表', icon: FileSpreadsheet },
  { path: '/settings', label: '系統設定', icon: Settings },
]

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-gray-900 transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
          <span className="text-xl font-bold text-white">豪德後台</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-green-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            登出
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="ml-auto flex items-center gap-4">
            <NotificationBell />
            {user?.avatar && (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-full"
              />
            )}
            <span className="text-sm text-gray-600">{user?.name || '管理員'}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
