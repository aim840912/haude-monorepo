'use client'

/**
 * 行動版 Header — 方向 A（支援 Hero 上透明）
 *
 * 新增 transparent prop：Hero 頂端時品牌名與工具列圖示轉白色 / 半透明 hover；
 * 下拉選單面板仍維持白底以確保可讀。其餘邏輯與原版相同。
 *
 * 直接覆蓋 components/layouts/common/header/MobileHeader.tsx
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, LogOut, User, Menu, X, Package, ExternalLink } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAuthStore } from '@/stores/authStore'
import { useTotalItems } from '@/stores/cartStore'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'

const navItemsConfig = [
  { href: '/', labelKey: 'explore' },
  { href: '/farm-tours', labelKey: 'farmTours' },
  { href: '/products', labelKey: 'products' },
  { href: '/locations', labelKey: 'locations' },
  { href: '/schedule', labelKey: 'schedule' },
  { href: '/news', labelKey: 'news' },
] as const

const userMenuConfig = [
  { href: '/account', labelKey: 'myAccount', icon: User },
  { href: '/orders', labelKey: 'myOrders', icon: Package },
] as const

interface MobileHeaderProps {
  transparent?: boolean
  isMobileMenuOpen: boolean
  mobileMenuRef: React.RefObject<HTMLDivElement | null>
  mobileMenuButtonRef: React.RefObject<HTMLButtonElement | null>
  handleMobileMenuToggle: () => void
  handleMenuItemClick: () => void
}

export function MobileHeader({
  transparent = false,
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
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  }

  const handleLogout = () => {
    logout()
    handleMenuItemClick()
  }

  const iconBtn = transparent
    ? 'text-white/90 hover:text-[#f3d77a] hover:bg-white/10'
    : 'text-[#5d4037] hover:text-[#d4af37] hover:bg-[#faf3e0] dark:hover:bg-[#3e2723]'

  return (
    <div className="lg:hidden">
      <div className="flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center flex-shrink-0">
          <div>
            <div
              className={`font-serif tracking-[0.06em] text-xl ${
                transparent ? 'text-white' : 'text-[#3e2723] dark:text-[#d7ccc8]'
              }`}
            >
              豪德製茶所
            </div>
            <div
              className={`font-medium tracking-[0.22em] text-[8px] ${
                transparent ? 'text-white/70' : 'text-[#5d4037]/70 dark:text-[#bcaaa4]/70'
              }`}
            >
              HAUDE TEA
            </div>
          </div>
        </Link>

        {/* 右側:工具按鈕組 */}
        <div className="flex items-center flex-shrink-0 space-x-1">
          <div className={transparent ? 'text-white [&_button]:text-white/90' : ''}>
            <LanguageSwitcher />
          </div>

          <Link
            href="/cart"
            className={`relative flex items-center transition-colors duration-200 justify-center rounded-md min-h-[44px] min-w-[44px] p-2 ${iconBtn}`}
            title={t('cart')}
          >
            <ShoppingCart className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 min-w-[18px] h-[18px] flex items-center justify-center bg-[#8b0000] text-white text-xs font-bold rounded-full px-1">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </Link>

          {user?.role === 'ADMIN' && process.env.NEXT_PUBLIC_ADMIN_URL && (
            <a
              href={process.env.NEXT_PUBLIC_ADMIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1 transition-colors duration-200 rounded-md min-h-[44px] px-2 ${iconBtn}`}
              title={t('admin')}
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          )}

          <button
            ref={mobileMenuButtonRef}
            className={`flex items-center transition-colors duration-200 justify-center rounded-md min-h-[44px] min-w-[44px] p-2 ${iconBtn}`}
            title="導航選單"
            onClick={handleMobileMenuToggle}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* 手機版導航選單（面板維持白底） */}
      <div
        className={`absolute left-0 right-0 top-full bg-white dark:bg-[#2d1f1a] shadow-lg border-b border-[#e7ded3] dark:border-[#5d4037] transition-[opacity,visibility] duration-300 ease-in-out z-50 ${
          isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        <div className="py-4 max-w-7xl mx-auto px-4" ref={mobileMenuRef}>
          <div className="space-y-2">
            {navItemsConfig.map((item) => (
              <div key={item.href} className="group">
                <Link
                  href={item.href}
                  className={`block px-4 py-3 transition-colors duration-200 rounded-lg mx-2 ${
                    isActive(item.href)
                      ? 'text-[#d4af37] bg-[#faf3e0] dark:bg-[#3e2723] font-semibold'
                      : 'text-[#5d4037] dark:text-[#bcaaa4] hover:text-[#d4af37] hover:bg-[#faf8f5] dark:hover:bg-[#3e2723]'
                  }`}
                  onClick={handleMenuItemClick}
                >
                  <span className="font-medium text-base">{t(item.labelKey)}</span>
                </Link>
              </div>
            ))}

            <div className="border-t border-[#e7ded3] dark:border-[#5d4037] my-2 mx-4"></div>

            {isAuthenticated ? (
              <>
                <div className="px-4 py-2 text-sm text-[#695a52] dark:text-[#a69187]">
                  {user?.name}
                </div>
                {userMenuConfig.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleMenuItemClick}
                      className={`flex items-center gap-2 px-4 py-3 transition-colors duration-200 rounded-lg mx-2 ${
                        isActive(item.href)
                          ? 'text-[#d4af37] bg-[#faf3e0] dark:bg-[#3e2723] font-semibold'
                          : 'text-[#5d4037] dark:text-[#bcaaa4] hover:text-[#d4af37] hover:bg-[#faf8f5] dark:hover:bg-[#3e2723]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium text-base">{t(item.labelKey)}</span>
                    </Link>
                  )
                })}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-3 text-[#8b0000] hover:bg-[#fbeaea] dark:hover:bg-[#3e2723] transition-colors duration-200 rounded-lg mx-2"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium text-base">{t('logout')}</span>
                </button>
              </>
            ) : (
              <Link
                href={`/login?from=${pathname}`}
                className="flex items-center gap-2 px-4 py-3 text-[#3e2723] dark:text-[#d7ccc8] hover:text-[#d4af37] hover:bg-[#faf3e0] dark:hover:bg-[#3e2723] transition-colors duration-200 rounded-lg mx-2"
                onClick={handleMenuItemClick}
              >
                <User className="w-5 h-5" />
                <span className="font-medium text-base">{t('login')}</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
