import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle: string
  className?: string
}

/**
 * 頁面標題區塊
 *
 * 用於頁面頂部的標題和副標題顯示
 *
 * @example
 * ```tsx
 * <PageHeader
 *   title="產品列表"
 *   subtitle="探索我們的優質農產品"
 * />
 * ```
 */
export function PageHeader({ title, subtitle, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'bg-green-600 text-white py-[1.28rem]',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-2">{title}</h1>
        <p className="text-green-100">{subtitle}</p>
      </div>
    </div>
  )
}
