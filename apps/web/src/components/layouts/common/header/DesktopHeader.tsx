import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ShoppingCart, Settings, LogOut, User, ChevronDown } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useTotalItems } from '@/stores/cartStore'
import { navItems } from './NavigationItems'

const adminMenuItems = [
  { href: '/dashboard', label: '控制台' },
  { href: '/admin/products', label: '產品管理' },
  { href: '/admin/schedules', label: '日程管理' },
  { href: '/admin/locations', label: '據點管理' },
]

/**
 * 桌面版 Header
 * 簡化版本：移除 ThemeToggle、ExpandableSearchBar、SocialLinks
 * 使用 Zustand authStore 替代 AuthContext
 */
export function DesktopHeader() {
  const location = useLocation()
  const { user, isAuthenticated, logout } = useAuthStore()
  const totalItems = useTotalItems()
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false)
  const adminMenuRef = useRef<HTMLDivElement>(null)

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  // 點擊外部關閉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target as Node)) {
        setIsAdminMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="hidden lg:block">
      {/* Desktop Layout - 統一緊湊樣式 */}
      <div className="flex items-center justify-between h-12">
        {/* 左側：品牌 + 導航 */}
        <div className="flex items-center gap-6 h-8">
          {/* 品牌標誌（緊湊版）*/}
          <Link to="/" className="flex items-center">
            <div className="flex items-center gap-2 h-8">
              <div className="font-display text-[#3e2723] tracking-tight text-2xl">豪德製茶所</div>
              <div className="text-[#5d4037]/70 font-inter font-medium tracking-wider text-[8px]">
                HAUDE TEA
              </div>
            </div>
          </Link>

          {/* 導航選單（緊湊版）*/}
          <div className="flex items-center space-x-2">
            {navItems.map(item => (
              <div key={item.href} className="group relative flex items-center min-h-[32px]">
                {item.isExternal ? (
                  <a href={item.href} className="block py-2 px-2">
                    <span
                      className={`text-gray-600 hover:text-green-600 transition-colors duration-200 text-sm font-sans font-medium ${
                        isActive(item.href) ? 'text-green-600' : ''
                      }`}
                    >
                      {item.label}
                    </span>
                    <div
                      className={`absolute bottom-0 left-0 h-0.5 bg-green-600 transition-all duration-300 ${
                        isActive(item.href) ? 'w-full' : 'w-0 group-hover:w-full'
                      }`}
                    ></div>
                  </a>
                ) : (
                  <Link to={item.href} className="block py-2 px-2">
                    <span
                      className={`text-gray-600 hover:text-green-600 transition-colors duration-200 text-sm font-sans font-medium ${
                        isActive(item.href) ? 'text-green-600' : ''
                      }`}
                    >
                      {item.label}
                    </span>
                    <div
                      className={`absolute bottom-0 left-0 h-0.5 bg-green-600 transition-all duration-300 ${
                        isActive(item.href) ? 'w-full' : 'w-0 group-hover:w-full'
                      }`}
                    ></div>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 右側：工具按鈕 */}
        <div className="flex items-center space-x-2 h-8">
          {/* 購物車按鈕 - 僅登入用戶顯示 */}
          {isAuthenticated && (
            <Link
              to="/cart"
              className="relative w-10 h-10 flex items-center justify-center text-[#5d4037] hover:text-green-600 hover:bg-gray-100 transition-colors duration-200 rounded-md"
              title="購物車"
            >
              <ShoppingCart className="w-5 h-5" />
              {/* 購物車數量 Badge */}
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>
          )}

          {/* 管理員選單 */}
          {user?.role === 'ADMIN' && (
            <div className="relative" ref={adminMenuRef}>
              <button
                onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
                className="flex items-center gap-1 px-3 h-10 text-[#5d4037] hover:text-green-600 hover:bg-gray-100 transition-colors duration-200 rounded-md"
                title="管理控制台"
              >
                <Settings className="w-5 h-5" />
                <ChevronDown className={`w-4 h-4 transition-transform ${isAdminMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* 下拉選單 */}
              {isAdminMenuOpen && (
                <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  {adminMenuItems.map(item => (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setIsAdminMenuOpen(false)}
                      className={`block px-4 py-2 text-sm transition-colors ${
                        isActive(item.href)
                          ? 'text-green-600 bg-green-50'
                          : 'text-gray-700 hover:text-green-600 hover:bg-gray-50'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 登入/登出按鈕 */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{user?.name}</span>
              <button
                onClick={logout}
                className="w-10 h-10 flex items-center justify-center text-[#5d4037] hover:text-green-600 hover:bg-gray-100 transition-colors duration-200 rounded-md"
                title="登出"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
            >
              <User className="w-4 h-4" />
              登入
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
