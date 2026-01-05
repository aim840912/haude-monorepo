import { Loader2 } from 'lucide-react'
import { useLocations } from '@/hooks/useLocations'
import { LocationCard } from './LocationCard'

interface LocationListProps {
  /** 自訂類名 */
  className?: string
  /** 點擊地點時的回調 */
  onLocationClick?: (locationId: string) => void
}

/**
 * 地點列表元件
 */
export function LocationList({ className, onLocationClick }: LocationListProps) {
  const { locations, isLoading, error, refetch } = useLocations()

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

  if (locations.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">目前沒有可顯示的地點</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.map(location => (
          <LocationCard
            key={location.id}
            location={location}
            onClick={onLocationClick ? () => onLocationClick(location.id) : undefined}
          />
        ))}
      </div>
    </div>
  )
}
