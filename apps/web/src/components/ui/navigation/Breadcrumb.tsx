'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

/**
 * 麵包屑導航元件
 *
 * 提供清晰的頁面層級導航，自動在最前面加入首頁連結
 *
 * @example
 * ```tsx
 * <Breadcrumb items={[
 *   { label: '產品', href: '/products' },
 *   { label: '阿里山高山茶' }
 * ]} />
 * // 顯示: 🏠 > 產品 > 阿里山高山茶
 * ```
 */
export function Breadcrumb({ items, className }: BreadcrumbProps) {
  // 在最前面加入首頁
  const allItems: BreadcrumbItem[] = [{ label: '首頁', href: '/' }, ...items]

  return (
    <nav
      aria-label="麵包屑導航"
      className={cn('flex items-center text-sm text-gray-600', className)}
    >
      <ol className="flex items-center space-x-1">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1
          const isFirst = index === 0

          return (
            <li key={index} className="flex items-center">
              {/* 分隔符 */}
              {index > 0 && (
                <ChevronRight className="w-4 h-4 mx-1 text-gray-400 flex-shrink-0" />
              )}

              {/* 連結或純文字 */}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="flex items-center hover:text-green-600 transition-colors"
                >
                  {isFirst && <Home className="w-4 h-4 mr-1" />}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span
                  className={cn(
                    'flex items-center',
                    isLast ? 'text-gray-900 font-medium' : ''
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {isFirst && <Home className="w-4 h-4 mr-1" />}
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
