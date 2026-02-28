import React from 'react'
import Link from 'next/link'
import { ShoppingBag, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ViewAllButtonProps {
  /** 連結路徑 */
  href?: string
  /** 按鈕文字 */
  label?: string
}

/**
 * 查看所有商品按鈕元件
 * 動畫由父層 Framer Motion 管理
 */
export const ViewAllButton = React.memo<ViewAllButtonProps>(({
  href = '/products',
  label = '瀏覽所有商品',
}) => {
  return (
    <div className="text-center">
      <Link
        href={href}
        className={cn(
          'inline-flex items-center gap-3',
          'bg-gray-900 text-white px-8 py-4 rounded-lg',
          'text-lg font-semibold',
          'hover:bg-gray-800 transition-[background-color,box-shadow] duration-200',
          'shadow-lg hover:shadow-xl'
        )}
      >
        <ShoppingBag className="w-5 h-5" />
        <span>{label}</span>
        <ChevronRight className="w-5 h-5" />
      </Link>
    </div>
  )
})

ViewAllButton.displayName = 'ViewAllButton'
