import React from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ViewAllButtonProps {
  /** 是否可見（用於動畫） */
  isVisible?: boolean
  /** 連結路徑 */
  href?: string
  /** 按鈕文字 */
  label?: string
}

/**
 * 查看所有商品按鈕元件
 */
export const ViewAllButton = React.memo<ViewAllButtonProps>(({
  isVisible = true,
  href = '/products',
  label = '瀏覽所有商品',
}) => {
  return (
    <div className={cn('text-center', isVisible && 'animate-fade-in')}>
      <Link
        to={href}
        className={cn(
          'inline-flex items-center gap-3',
          'bg-gray-900 text-white px-8 py-4 rounded-lg',
          'text-lg font-semibold',
          'hover:bg-gray-800 transition-all duration-200',
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
