import Link from 'next/link'
import Image from 'next/image'
import { Calendar, MapPin, Users, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PLACEHOLDER_IMAGES } from '@/config/placeholder.config'
import type { FarmTour } from '@/types/farm-tour'

interface FarmTourCardProps {
  tour: FarmTour
  className?: string
  /** 點擊卡片時的回調 */
  onClick?: () => void
}

/**
 * 農場體驗卡片元件
 */
export function FarmTourCard({ tour, className, onClick }: FarmTourCardProps) {
  const availableSpots = tour.maxParticipants - tour.currentParticipants
  const isFull = availableSpots <= 0

  const typeLabels: Record<FarmTour['type'], string> = {
    harvest: '採收體驗',
    workshop: '手作工坊',
    tour: '農場導覽',
    tasting: '品嚐會',
  }

  const statusColors: Record<FarmTour['status'], string> = {
    upcoming: 'bg-green-100 text-green-700',
    ongoing: 'bg-blue-100 text-blue-700',
    completed: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  const statusLabels: Record<FarmTour['status'], string> = {
    upcoming: '即將舉行',
    ongoing: '進行中',
    completed: '已結束',
    cancelled: '已取消',
  }

  const cardClassName = cn(
    'group block bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl',
    'border border-gray-200 transition-all duration-300',
    'hover:-translate-y-1 cursor-pointer',
    className
  )

  const cardContent = (
    <>
      {/* 圖片區域 */}
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        <Image
          src={tour.imageUrl || PLACEHOLDER_IMAGES.farmTour(tour.id)}
          alt={tour.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* 狀態標籤 */}
        <div className="absolute top-3 left-3">
          <span className={cn('px-3 py-1 rounded-full text-xs font-medium', statusColors[tour.status])}>
            {statusLabels[tour.status]}
          </span>
        </div>

        {/* 類型標籤 */}
        <div className="absolute top-3 right-3">
          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-700">
            {typeLabels[tour.type]}
          </span>
        </div>
      </div>

      {/* 內容區域 */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-green-700 transition-colors">
          {tour.name}
        </h3>

        <p className="text-sm text-gray-600 line-clamp-2 mb-4">{tour.description}</p>

        {/* 資訊列表 */}
        <div className="space-y-2 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span>{tour.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span>{tour.startTime} - {tour.endTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{tour.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 flex-shrink-0" />
            <span className={cn(isFull && 'text-red-500')}>
              {isFull ? '已額滿' : `剩餘 ${availableSpots} 名額`}
            </span>
          </div>
        </div>

        {/* 價格和按鈕 */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-green-700">
              NT$ {tour.price.toLocaleString()}
            </span>
            <span className="text-sm text-gray-500 ml-1">/人</span>
          </div>
          <span
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              isFull
                ? 'bg-gray-100 text-gray-400'
                : 'bg-green-100 text-green-700 group-hover:bg-green-600 group-hover:text-white'
            )}
          >
            {isFull ? '已額滿' : '立即報名'}
          </span>
        </div>

        {/* 標籤 */}
        {tour.tags && tour.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {tour.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  )

  // 如果有 onClick，使用 div，否則使用 Link
  if (onClick) {
    return (
      <div
        className={cardClassName}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onClick()}
      >
        {cardContent}
      </div>
    )
  }

  return (
    <Link href={`/farm-tours/${tour.id}`} className={cardClassName}>
      {cardContent}
    </Link>
  )
}
