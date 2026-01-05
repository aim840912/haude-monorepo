'use client'

import { DesktopHeader } from './header/DesktopHeader'
import { MobileHeader } from './header/MobileHeader'
import { useHeaderState } from './header/useHeaderState'

/**
 * Header 元件 - 網站頂部導航欄
 *
 * 架構:
 * - useHeaderState: 狀態管理 Hook (選單開合、外部點擊偵測)
 * - DesktopHeader: 桌面版佈局 (≥ lg breakpoint)
 * - MobileHeader: 移動版佈局 (< lg breakpoint)
 */
export function Header() {
  const {
    isMobileMenuOpen,
    mobileMenuRef,
    mobileMenuButtonRef,
    handleMobileMenuToggle,
    handleMenuItemClick,
  } = useHeaderState()

  return (
    <header className="fixed top-0 w-full z-50 bg-white dark:bg-[#2d1f1a] shadow-md min-h-[var(--header-height)] border-b border-card-border">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1">
        <DesktopHeader />

        <MobileHeader
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
