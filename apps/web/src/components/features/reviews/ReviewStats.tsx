'use client'

import { StarRating } from './StarRating'
import { cn } from '@/lib/utils'

interface ReviewStatsProps {
  averageRating: number
  totalReviews: number
  ratingDistribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
  className?: string
}

/**
 * 評分統計元件
 */
export function ReviewStats({
  averageRating,
  totalReviews,
  ratingDistribution,
  className,
}: ReviewStatsProps) {
  const maxCount = Math.max(...Object.values(ratingDistribution), 1)

  return (
    <div className={cn('flex flex-col sm:flex-row gap-6', className)}>
      {/* 平均評分 */}
      <div className="flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-gray-900">
          {averageRating > 0 ? averageRating.toFixed(1) : '-'}
        </span>
        <StarRating rating={Math.round(averageRating)} size="md" className="mt-1" />
        <span className="text-sm text-gray-500 mt-1">
          {totalReviews} 則評論
        </span>
      </div>

      {/* 評分分佈 */}
      <div className="flex-1 space-y-2">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = ratingDistribution[star as keyof typeof ratingDistribution]
          const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
          const barWidth = totalReviews > 0 ? (count / maxCount) * 100 : 0

          return (
            <div key={star} className="flex items-center gap-2 text-sm">
              <span className="w-3 text-gray-600">{star}</span>
              <StarRating rating={1} maxRating={1} size="sm" />
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-[width] duration-300"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <span className="w-10 text-right text-gray-500">
                {percentage.toFixed(0)}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
