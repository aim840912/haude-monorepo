import { cn } from '@/lib/utils'

/**
 * 頁面標題區塊 — 方向 A
 *
 * 與原版差異：綠色橫幅 bg-green-600 → 深茶褐漸層 + 金色細線 + 襯線標題、金色副標。
 * 此元件用於多個內頁頂部（產品列表、門市據點、搜尋等），改一處即可整批升級。
 *
 * 直接覆蓋 components/ui/sections/PageHeader.tsx
 */

interface PageHeaderProps {
  title: string
  subtitle: string
  className?: string
}

export function PageHeader({ title, subtitle, className }: PageHeaderProps) {
  return (
    <div className={cn('bg-gradient-to-r from-[#3e2723] to-[#4e342e] text-white py-9', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <span className="block w-10 h-px bg-[#d4af37] mb-4" />
        <h1 className="font-serif text-4xl font-bold mb-2 tracking-wide">{title}</h1>
        <p className="text-[#e9d9a8]">{subtitle}</p>
      </div>
    </div>
  )
}
