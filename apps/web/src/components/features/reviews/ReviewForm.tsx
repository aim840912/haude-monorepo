'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { StarRating } from './StarRating'
import { cn } from '@/lib/utils'

interface ReviewFormProps {
  initialRating?: number
  initialTitle?: string
  initialContent?: string
  isSubmitting?: boolean
  submitLabel?: string
  onSubmit: (data: { rating: number; title: string; content: string }) => Promise<void>
  onCancel?: () => void
  className?: string
}

/**
 * 評論表單元件
 */
export function ReviewForm({
  initialRating = 0,
  initialTitle = '',
  initialContent = '',
  isSubmitting = false,
  submitLabel = '提交評論',
  onSubmit,
  onCancel,
  className,
}: ReviewFormProps) {
  const [rating, setRating] = useState(initialRating)
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [errors, setErrors] = useState<{ rating?: string; title?: string; content?: string }>({})

  const validate = () => {
    const newErrors: typeof errors = {}

    if (rating === 0) {
      newErrors.rating = '請選擇評分'
    }
    if (!title.trim()) {
      newErrors.title = '請輸入評論標題'
    } else if (title.length > 100) {
      newErrors.title = '標題不能超過 100 字'
    }
    if (!content.trim()) {
      newErrors.content = '請輸入評論內容'
    } else if (content.length > 1000) {
      newErrors.content = '內容不能超過 1000 字'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    await onSubmit({ rating, title: title.trim(), content: content.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      {/* 評分 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          評分 <span className="text-red-500">*</span>
        </label>
        <StarRating
          rating={rating}
          size="lg"
          interactive
          onChange={(value) => {
            setRating(value)
            if (errors.rating) setErrors({ ...errors, rating: undefined })
          }}
        />
        {errors.rating && (
          <p className="text-sm text-red-500 mt-1">{errors.rating}</p>
        )}
      </div>

      {/* 標題 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          標題 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            if (errors.title) setErrors({ ...errors, title: undefined })
          }}
          placeholder="用一句話總結您的評價"
          className={cn(
            'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent',
            errors.title ? 'border-red-300' : 'border-gray-300'
          )}
          disabled={isSubmitting}
        />
        {errors.title && (
          <p className="text-sm text-red-500 mt-1">{errors.title}</p>
        )}
      </div>

      {/* 內容 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          評論內容 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
            if (errors.content) setErrors({ ...errors, content: undefined })
          }}
          placeholder="分享您的使用心得..."
          rows={4}
          className={cn(
            'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none',
            errors.content ? 'border-red-300' : 'border-gray-300'
          )}
          disabled={isSubmitting}
        />
        <div className="flex justify-between mt-1">
          {errors.content ? (
            <p className="text-sm text-red-500">{errors.content}</p>
          ) : (
            <span />
          )}
          <span className="text-xs text-gray-400">{content.length} / 1000</span>
        </div>
      </div>

      {/* 按鈕 */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            取消
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            'px-6 py-2 bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2',
            isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'
          )}
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
