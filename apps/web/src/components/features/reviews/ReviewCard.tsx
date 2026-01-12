'use client'

import { BadgeCheck, Trash2, Edit } from 'lucide-react'
import { StarRating } from './StarRating'
import { cn } from '@/lib/utils'

interface ReviewCardProps {
  id: string
  userName: string
  rating: number
  title: string
  content: string
  isVerified: boolean
  createdAt: string
  isOwnReview?: boolean
  onEdit?: () => void
  onDelete?: () => void
  className?: string
}

/**
 * 單則評論卡片元件
 */
export function ReviewCard({
  userName,
  rating,
  title,
  content,
  isVerified,
  createdAt,
  isOwnReview = false,
  onEdit,
  onDelete,
  className,
}: ReviewCardProps) {
  const formattedDate = new Date(createdAt).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className={cn('border-b border-gray-100 pb-6 last:border-0', className)}>
      {/* 評論頭部 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* 用戶頭像（使用首字母） */}
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-green-700 font-medium">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{userName}</span>
              {isVerified && (
                <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  <BadgeCheck className="w-3 h-3" />
                  已驗證購買
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500">{formattedDate}</span>
          </div>
        </div>

        {/* 自己的評論可以編輯/刪除 */}
        {isOwnReview && (
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="編輯評論"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="刪除評論"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* 評分和標題 */}
      <div className="mb-2">
        <StarRating rating={rating} size="sm" />
        <h4 className="font-medium text-gray-900 mt-1">{title}</h4>
      </div>

      {/* 評論內容 */}
      <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
        {content}
      </p>
    </div>
  )
}
