'use client'

/**
 * 桌面版 Header — 方向 A（支援 Hero 上透明）
 *
 * 新增 transparent prop：
 * - transparent=true（Hero 頂端）→ 白色文字、半透明 hover、描邊白色登入鈕
 * - transparent=false（白底）→ 茶褐文字、金色 hover/active、茶褐登入鈕
 * 其餘邏輯（auth / 購物車 / i18n / 用戶選單）與原版相同。
 *
 * 直接覆蓋 components/layouts/common/header/DesktopHeader.tsx
 */

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, LogOut, User, ChevronDown, Package, ExternalLink } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAuthStore } from '@/stores/authStore'
import { performLogout } from '@/services/auth'
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

interface DesktopHeaderProps {
  transparent?: boolean
}

export function DesktopHeader({ transparent = false }: DesktopHeaderProps) {
  const pathname = usePathname()
  const t = useTranslations('nav')
  const { user, isAuthenticated } = useAuthStore()
  const totalItems = useTotalItems()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 依透明狀態切換顏色
  const iconBtn = transparent
    ? 'text-white/90 hover:text-[#f3d77a] hover:bg-white/10'
    : 'text-[#5d4037] dark:text-[#d7ccc8] hover:text-[#d4af37] hover:bg-[#faf3e0] dark:hover:bg-[#3e2723]'

  return (
    <div className="hidden lg:block">
      <div className="flex items-center justify-between h-12">
        {/* 左側：品牌 + 導航 */}
        <div className="flex items-center gap-8 h-8">
          <Link href="/" className="flex items-center">
            <div className="flex items-baseline gap-2">
              <div
                className={`font-serif tracking-[0.08em] text-2xl ${
                  transparent ? 'text-white' : 'text-[#3e2723] dark:text-[#d7ccc8]'
                }`}
              >
                豪德製茶所
              </div>
              <div
                className={`font-medium tracking-[0.25em] text-[9px] ${
                  transparent ? 'text-white/70' : 'text-[#5d4037]/70 dark:text-[#bcaaa4]/70'
                }`}
              >
                HAUDE TEA
              </div>
            </div>
          </Link>

          <div className="flex items-center space-x-1">
            {navItemsConfig.map((item) => (
              <div key={item.href} className="group relative flex items-center min-h-[32px]">
                <Link href={item.href} className="block py-2 px-2.5">
                  <span
                    className={`transition-colors duration-200 text-sm tracking-[0.04em] ${
                      transparent
                        ? `text-white/90 hover:text-[#f3d77a] ${isActive(item.href) ? 'text-[#f3d77a]' : ''}`
                        : `text-[#5d4037] dark:text-[#bcaaa4] hover:text-[#d4af37] ${isActive(item.href) ? 'text-[#d4af37]' : ''}`
                    }`}
                  >
                    {t(item.labelKey)}
                  </span>
                  <div
                    className={`absolute bottom-0 left-0 h-0.5 bg-[#d4af37] transition-[width] duration-300 ${
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
          <div className={transparent ? 'text-white [&_button]:text-white/90' : ''}>
            <LanguageSwitcher />
          </div>

          <Link
            href="/cart"
            className={`relative w-10 h-10 flex items-center justify-center transition-colors duration-200 rounded-md ${iconBtn}`}
            title={t('cart')}
          >
            <ShoppingCart className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-[#8b0000] text-white text-xs font-bold rounded-full px-1">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`flex items-center gap-2 px-3 h-10 transition-colors duration-200 rounded-md ${iconBtn}`}
              >
                <User className="w-5 h-5" />
                <span className="text-sm font-medium">{user?.name}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-[#2d1f1a] rounded-lg shadow-lg border border-[#e7ded3] dark:border-[#5d4037] py-1 z-50">
                  {user?.role === 'ADMIN' && process.env.NEXT_PUBLIC_ADMIN_URL && (
                    <>
                      {/* 跨網域，必須用原生 a 而非 next/link */}
                      <a
                        href={process.env.NEXT_PUBLIC_ADMIN_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-[#5d4037] dark:text-[#bcaaa4] hover:text-[#d4af37] hover:bg-[#faf8f5] dark:hover:bg-[#3e2723] transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" aria-hidden="true" />
                        <span className="flex-1">{t('admin')}</span>
                        <span className="sr-only">（在新分頁開啟）</span>
                      </a>
                      <div className="border-t border-[#e7ded3] dark:border-[#5d4037] my-1" />
                    </>
                  )}
                  {userMenuConfig.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsUserMenuOpen(false)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                          isActive(item.href)
                            ? 'text-[#d4af37] bg-[#faf3e0] dark:bg-[#3e2723]'
                            : 'text-[#5d4037] dark:text-[#bcaaa4] hover:text-[#d4af37] hover:bg-[#faf8f5] dark:hover:bg-[#3e2723]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {t(item.labelKey)}
                      </Link>
                    )
                  })}
                  <div className="border-t border-[#e7ded3] dark:border-[#5d4037] my-1" />
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false)
                      void performLogout()
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-[#8b0000] hover:bg-[#fbeaea] dark:hover:bg-[#3e2723] transition-colors"
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
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                transparent
                  ? 'border border-white/60 text-white hover:bg-white/10'
                  : 'text-white bg-[#3e2723] hover:bg-[#5d4037]'
              }`}
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
