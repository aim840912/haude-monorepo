'use client'

/**
 * Header 元件 — 方向 A（Hero 上透明、捲動後變白）
 *
 * 行為：
 * - 在「有滿版 Hero 的頁面」（首頁 / 觀光果園）最頂端時 → 透明背景、白色文字
 * - 一旦向下捲動（>40px）或開啟手機選單 → 白底實心、深色文字
 * - 其他頁面 → 一律白底實心
 *
 * 直接覆蓋 components/layouts/common/Header.tsx
 */

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { DesktopHeader } from './header/DesktopHeader'
import { MobileHeader } from './header/MobileHeader'
import { useHeaderState } from './header/useHeaderState'

export function Header() {
  const {
    isMobileMenuOpen,
    mobileMenuRef,
    mobileMenuButtonRef,
    handleMobileMenuToggle,
    handleMenuItemClick,
  } = useHeaderState()

  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // 判斷是否為滿版 Hero 頁面（首頁、觀光果園）— 相容 locale 前綴（/、/en、/zh-TW）
  const isHeroPage =
    pathname === '/' ||
    /^\/[a-z]{2}(-[A-Z]{2})?\/?$/.test(pathname) ||
    pathname.includes('/farm-tours')

  const transparent = isHeroPage && !scrolled && !isMobileMenuOpen

  return (
    <header
      className={`fixed top-0 w-full z-50 min-h-[var(--header-height)] transition-colors duration-300 ${
        transparent
          ? 'bg-transparent'
          : 'bg-white dark:bg-[#2d1f1a] shadow-md border-b border-card-border'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1">
        <DesktopHeader transparent={transparent} />

        <MobileHeader
          transparent={transparent}
          isMobileMenuOpen={isMobileMenuOpen}
          mobileMenuRef={mobileMenuRef}
          mobileMenuButtonRef={mobileMenuButtonRef}
          handleMobileMenuToggle={handleMobileMenuToggle}
          handleMenuItemClick={handleMenuItemClick}
        />
      </nav>
    </header>
  )
}
