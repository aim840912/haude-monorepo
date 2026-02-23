'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, LogOut, User, ChevronDown, Package, ExternalLink } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAuthStore } from '@/stores/authStore'
import { useTotalItems } from '@/stores/cartStore'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'

// 導航項目配置（使用翻譯鍵）
const navItemsConfig = [
  { href: '/', labelKey: 'explore' },
  { href: '/farm-tours', labelKey: 'farmTours' },
  { href: '/products', labelKey: 'products' },
  { href: '/locations', labelKey: 'locations' },
  { href: '/schedule', labelKey: 'schedule' },
  { href: '/news', labelKey: 'news' },
] as const

// 用戶選單配置
const userMenuConfig = [
  { href: '/account', labelKey: 'myAccount', icon: User },
  { href: '/orders', labelKey: 'myOrders', icon: Package },
] as const

/**
 * 桌面版 Header
 * 簡化版本：移除 ThemeToggle、ExpandableSearchBar、SocialLinks
 * 使用 Zustand authStore 替代 AuthContext
 */
export function DesktopHeader() {
  const pathname = usePathname()
  const t = useTranslations('nav')
  const { user, isAuthenticated, logout } = useAuthStore()
  const totalItems = useTotalItems()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(path)
  }

  // 點擊外部關閉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
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
          <Link href="/" className="flex items-center">
            <div className="flex items-center gap-2 h-8">
              <div className="font-display text-[#3e2723] tracking-tight text-2xl">豪德製茶所</div>
              <div className="text-[#5d4037]/70 font-inter font-medium tracking-wider text-[8px]">
                HAUDE TEA
              </div>
            </div>
          </Link>

          {/* 導航選單（緊湊版）*/}
          <div className="flex items-center space-x-2">
            {navItemsConfig.map(item => (
              <div key={item.href} className="group relative flex items-center min-h-[32px]">
                <Link href={item.href} className="block py-2 px-2">
                  <span
                    className={`text-gray-600 hover:text-green-600 transition-colors duration-200 text-sm font-sans font-medium ${
                      isActive(item.href) ? 'text-green-600' : ''
                    }`}
                  >
                    {t(item.labelKey)}
                  </span>
                  <div
                    className={`absolute bottom-0 left-0 h-0.5 bg-green-600 transition-all duration-300 ${
                      isActive(item.href) ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  ></div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* 右側：工具按鈕 */}
        <div className="flex items-center space-x-2 h-8">
          {/* 語系切換 */}
          <LanguageSwitcher />

          {/* 購物車按鈕 - 所有用戶皆可見 */}
          <Link
            href="/cart"
            className="relative w-10 h-10 flex items-center justify-center text-[#5d4037] hover:text-green-600 hover:bg-gray-100 transition-colors duration-200 rounded-md"
            title={t('cart')}
          >
            <ShoppingCart className="w-5 h-5" />
            {/* 購物車數量 Badge */}
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </Link>

          {/* 管理後台連結 - 僅 ADMIN 可見 */}
          {user?.role === 'ADMIN' && (
            <a
              href="https://haude-admin.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 h-10 text-[#5d4037] hover:text-green-600 hover:bg-gray-100 transition-colors duration-200 rounded-md"
              title={t('admin')}
            >
              <ExternalLink className="w-5 h-5" />
              <span className="text-sm font-medium">{t('admin')}</span>
            </a>
          )}

          {/* 用戶選單（所有登入用戶可見）*/}
          {isAuthenticated ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-3 h-10 text-[#5d4037] hover:text-green-600 hover:bg-gray-100 transition-colors duration-200 rounded-md"
              >
                <User className="w-5 h-5" />
                <span className="text-sm font-medium">{user?.name}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* 用戶下拉選單 */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  {userMenuConfig.map(item => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsUserMenuOpen(false)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                          isActive(item.href)
                            ? 'text-green-600 bg-green-50'
                            : 'text-gray-700 hover:text-green-600 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {t(item.labelKey)}
                      </Link>
                    )
                  })}
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false)
                      logout()
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href={`/login?from=${pathname}`}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
            >
              <User className="w-4 h-4" />
              {t('login')}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
