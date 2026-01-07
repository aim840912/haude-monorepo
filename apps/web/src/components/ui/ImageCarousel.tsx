'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageCarouselProps {
  /** 圖片 URL 陣列 */
  images: string[]
  /** 產品名稱（用於 alt 屬性） */
  productName: string
  /** 自動輪播間隔（毫秒），設為 0 則停用自動輪播，預設 4000 */
  autoPlayInterval?: number
  /** 是否顯示指示器，預設 true */
  showIndicators?: boolean
  /** 是否顯示箭頭，預設 true */
  showArrows?: boolean
  /** 自訂 class */
  className?: string
}

/**
 * 圖片輪播元件
 *
 * 功能：
 * - 左右箭頭切換圖片
 * - 自動輪播（可設定間隔）
 * - hover 時暫停自動輪播
 * - 圓點指示器 + 數字顯示
 * - 鍵盤左右鍵控制
 */
export function ImageCarousel({
  images,
  productName,
  autoPlayInterval = 4000,
  showIndicators = true,
  showArrows = true,
  className,
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const totalImages = images.length
  const hasMultipleImages = totalImages > 1

  // 切換到下一張
  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalImages)
  }, [totalImages])

  // 切換到上一張
  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalImages) % totalImages)
  }, [totalImages])

  // 切換到指定索引
  const goToIndex = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  // 自動輪播
  useEffect(() => {
    if (!hasMultipleImages || autoPlayInterval <= 0 || isPaused) {
      return
    }

    const timer = setInterval(goToNext, autoPlayInterval)
    return () => clearInterval(timer)
  }, [hasMultipleImages, autoPlayInterval, isPaused, goToNext])

  // 鍵盤控制
  useEffect(() => {
    if (!hasMultipleImages) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrev()
      } else if (e.key === 'ArrowRight') {
        goToNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasMultipleImages, goToNext, goToPrev])

  // 單張圖片時不需要輪播功能
  if (totalImages === 0) {
    return null
  }

  return (
    <div
      className={cn('relative group', className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 主圖容器 */}
      <div className="aspect-square bg-white rounded-xl overflow-hidden shadow-lg">
        <img
          src={images[currentIndex]}
          alt={`${productName}${hasMultipleImages ? ` - ${currentIndex + 1}` : ''}`}
          className="w-full h-full object-cover transition-opacity duration-300"
        />
      </div>

      {/* 左右箭頭（多張圖片時才顯示） */}
      {hasMultipleImages && showArrows && (
        <>
          {/* 左箭頭 */}
          <button
            onClick={goToPrev}
            className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2',
              'w-10 h-10 flex items-center justify-center',
              'bg-black/30 hover:bg-black/50 text-white rounded-full',
              'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
              'focus:outline-none focus:ring-2 focus:ring-white/50'
            )}
            aria-label="上一張圖片"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* 右箭頭 */}
          <button
            onClick={goToNext}
            className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2',
              'w-10 h-10 flex items-center justify-center',
              'bg-black/30 hover:bg-black/50 text-white rounded-full',
              'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
              'focus:outline-none focus:ring-2 focus:ring-white/50'
            )}
            aria-label="下一張圖片"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* 指示器（多張圖片時才顯示） */}
      {hasMultipleImages && showIndicators && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
          {/* 圓點指示器 */}
          <div className="flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToIndex(index)}
                className={cn(
                  'w-2.5 h-2.5 rounded-full transition-all duration-200',
                  currentIndex === index
                    ? 'bg-white scale-110'
                    : 'bg-white/50 hover:bg-white/70'
                )}
                aria-label={`跳至第 ${index + 1} 張圖片`}
              />
            ))}
          </div>

          {/* 數字指示器 */}
          <span className="text-white text-sm font-medium bg-black/40 px-2 py-0.5 rounded">
            {currentIndex + 1} / {totalImages}
          </span>
        </div>
      )}

      {/* 自動播放暫停提示（hover 時顯示） */}
      {hasMultipleImages && autoPlayInterval > 0 && isPaused && (
        <div className="absolute top-3 right-3 text-white text-xs bg-black/40 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
          已暫停
        </div>
      )}
    </div>
  )
}
