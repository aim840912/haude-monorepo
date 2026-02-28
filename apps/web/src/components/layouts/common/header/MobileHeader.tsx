'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, LogOut, User, Menu, X, Package, ExternalLink } from 'lucide-react'
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

interface MobileHeaderProps {
  isMobileMenuOpen: boolean
  mobileMenuRef: React.RefObject<HTMLDivElement | null>
  mobileMenuButtonRef: React.RefObject<HTMLButtonElement | null>
  handleMobileMenuToggle: () => void
  handleMenuItemClick: () => void
}

/**
 * 行動版 Header
 * 簡化版本：使用 Zustand authStore，移除複雜依賴
 */
export function MobileHeader({
  isMobileMenuOpen,
  mobileMenuRef,
  mobileMenuButtonRef,
  handleMobileMenuToggle,
  handleMenuItemClick,
}: MobileHeaderProps) {
  const pathname = usePathname()
  const t = useTranslations('nav')
  const { user, isAuthenticated, logout } = useAuthStore()
  const totalItems = useTotalItems()

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(path)
  }

  const handleLogout = () => {
    logout()
    handleMenuItemClick()
  }

  return (
    <div className="lg:hidden">
      <div className="flex items-center justify-between">
        {/* Brand - 左側固定 */}
        <Link href="/" className="flex items-center flex-shrink-0">
          <div>
            <div className="font-display text-green-900 tracking-tight text-xl">豪德製茶所</div>
            <div className="text-green-700/70 font-inter font-medium tracking-wider text-[8px]">
              HAUDE TEA
            </div>
          </div>
        </Link>

        {/* 右側:工具按鈕組 */}
        <div className="flex items-center flex-shrink-0 space-x-1">
          {/* 語系切換 */}
          <LanguageSwitcher />

          {/* 購物車按鈕 - 所有用戶皆可見 */}
          <Link
            href="/cart"
            className="relative flex items-center text-gray-700 hover:text-green-900 hover:bg-green-50 transition-colors duration-200 justify-center rounded-md min-h-[44px] min-w-[44px] p-2"
            title={t('cart')}
          >
            <ShoppingCart className="w-5 h-5" />
            {/* 購物車數量 Badge */}
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1">
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
              className="flex items-center gap-1 text-green-800 hover:text-green-900 hover:bg-green-50/50 transition-colors duration-200 rounded-md min-h-[44px] px-2"
              title={t('admin')}
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          )}

          {/* 漢堡選單按鈕 - Mobile */}
          <button
            ref={mobileMenuButtonRef}
            className="flex items-center text-gray-700 hover:text-green-900 hover:bg-green-50 transition-colors duration-200 justify-center rounded-md min-h-[44px] min-w-[44px] p-2"
            title="導航選單"
            onClick={handleMobileMenuToggle}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* 手機版導航選單 - 絕對定位下拉 */}
      <div
        className={`absolute left-0 right-0 top-full bg-white shadow-lg border-b border-gray-200 transition-[opacity,visibility] duration-300 ease-in-out z-50 ${
          isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        <div className="py-4 max-w-7xl mx-auto px-4" ref={mobileMenuRef}>
          <div className="space-y-2">
            {navItemsConfig.map(item => (
              <div key={item.href} className="group">
                <Link
                  href={item.href}
                  className={`block px-4 py-3 transition-colors duration-200 rounded-lg mx-2 ${
                    isActive(item.href)
                      ? 'text-green-900 bg-green-50 font-semibold'
                      : 'text-gray-700 hover:text-green-900 hover:bg-green-50'
                  }`}
                  onClick={handleMenuItemClick}
                >
                  <span className="font-sans font-medium text-base">{t(item.labelKey)}</span>
                </Link>
              </div>
            ))}

            {/* 分隔線 */}
            <div className="border-t border-gray-100 my-2 mx-4"></div>

            {/* 登入/登出區域 */}
            {isAuthenticated ? (
              <>
                <div className="px-4 py-2 text-sm text-gray-500">
                  {user?.name}
                </div>
                {/* 用戶選單項目 */}
                {userMenuConfig.map(item => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleMenuItemClick}
                      className={`flex items-center gap-2 px-4 py-3 transition-colors duration-200 rounded-lg mx-2 ${
                        isActive(item.href)
                          ? 'text-green-900 bg-green-50 font-semibold'
                          : 'text-gray-700 hover:text-green-900 hover:bg-green-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-sans font-medium text-base">{t(item.labelKey)}</span>
                    </Link>
                  )
                })}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200 rounded-lg mx-2"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-sans font-medium text-base">{t('logout')}</span>
                </button>
              </>
            ) : (
              <Link
                href={`/login?from=${pathname}`}
                className="flex items-center gap-2 px-4 py-3 text-green-600 hover:bg-green-50 transition-colors duration-200 rounded-lg mx-2"
                onClick={handleMenuItemClick}
              >
                <User className="w-5 h-5" />
                <span className="font-sans font-medium text-base">{t('login')}</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
