import { Loader2 } from 'lucide-react'
import { useFarmTours } from '@/hooks/useFarmTours'
import { FarmTourCard } from './FarmTourCard'

interface FarmTourListProps {
  /** 最大顯示數量 */
  limit?: number
  /** 自訂類名 */
  className?: string
  /** 點擊體驗項目時的回調 */
  onTourClick?: (tourId: string) => void
}

/**
 * 農場體驗列表元件
 */
export function FarmTourList({ limit, className, onTourClick }: FarmTourListProps) {
  const { tours, isLoading, error, refetch } = useFarmTours()

  const displayTours = limit ? tours.slice(0, limit) : tours

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          重試
        </button>
      </div>
    )
  }

  if (displayTours.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">目前沒有可報名的農場體驗活動</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayTours.map(tour => (
          <FarmTourCard
            key={tour.id}
            tour={tour}
            onClick={onTourClick ? () => onTourClick(tour.id) : undefined}
          />
        ))}
      </div>
    </div>
  )
}
