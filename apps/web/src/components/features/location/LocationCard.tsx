import Image from 'next/image'
import { MapPin, Phone, Clock, Car } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PLACEHOLDER_IMAGES } from '@/config/placeholder.config'
import type { Location } from '@/types/location'

interface LocationCardProps {
  location: Location
  className?: string
  onClick?: () => void
}

/**
 * 地點卡片元件
 */
export function LocationCard({ location, className, onClick }: LocationCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl overflow-hidden shadow-lg border border-gray-200',
        'transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* 圖片區域 */}
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        <Image
          src={location.images?.[0]?.storageUrl || location.image || PLACEHOLDER_IMAGES.location(location.id)}
          alt={location.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
          className="object-cover"
        />

        {/* 主要地點標籤 */}
        {location.isMain && (
          <div className="absolute top-3 left-3">
            <span className="px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
              總部
            </span>
          </div>
        )}
      </div>

      {/* 內容區域 */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-1">{location.name}</h3>
        <p className="text-sm text-gray-600 mb-4">{location.title}</p>

        {/* 資訊列表 */}
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-gray-700">{location.address}</p>
              {location.landmark && (
                <p className="text-gray-500 text-xs">（{location.landmark}）</p>
              )}
            </div>
          </div>

          {location.phone && (
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <a href={`tel:${location.phone}`} className="text-green-700 hover:underline">
                {location.phone}
              </a>
            </div>
          )}

          {location.hours && (
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-700">{location.hours}</span>
            </div>
          )}

          {location.parking && (
            <div className="flex items-start gap-3">
              <Car className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">{location.parking}</span>
            </div>
          )}
        </div>

        {/* 特色標籤 */}
        {location.features && location.features.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {location.features.map((feature, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                {feature}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
