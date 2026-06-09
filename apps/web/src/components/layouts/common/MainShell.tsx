'use client'

/**
 * MainShell — 方向 A（透明 nav 配套）
 *
 * 目的：原本 layout 的 <main className="pt-[var(--header-height)]"> 會把所有頁面
 * 往下推一個 header 高度。但「透明 nav」需要 Hero 頁面從最頂端開始、墊在 nav 之下，
 * 否則 Hero 上方會出現一條空白。
 *
 * 作法：Hero 頁面（首頁 / 觀光果園）pt-0，其餘頁面維持 pt-[var(--header-height)]。
 *
 * 用法：在 app/[locale]/layout.tsx 把
 *   <main className="pt-[var(--header-height)]">{children}</main>
 * 換成
 *   <MainShell>{children}</MainShell>
 * 並 import { MainShell } from '@/components/layouts/common/MainShell'
 *
 * 放到 components/layouts/common/MainShell.tsx
 */

import { usePathname } from 'next/navigation'

export function MainShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const isHeroPage =
    pathname === '/' ||
    /^\/[a-z]{2}(-[A-Z]{2})?\/?$/.test(pathname) ||
    pathname.includes('/farm-tours')

  return <main className={isHeroPage ? '' : 'pt-[var(--header-height)]'}>{children}</main>
}
