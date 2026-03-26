'use client'

import { useState, useEffect, useCallback } from 'react'
import { SafeImage } from '@/components/ui/SafeImage'
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
  /** 是否顯示縮圖列，預設 true（多圖時） */
  showThumbnails?: boolean
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
  showThumbnails = true,
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
      <div className="aspect-square bg-white rounded-xl overflow-hidden shadow-lg relative">
        <SafeImage
          src={images[currentIndex]}
          alt={`${productName}${hasMultipleImages ? ` - ${currentIndex + 1}` : ''}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 500px"
          className="object-cover transition-opacity duration-300"
          priority={currentIndex === 0}
        />

        {/* 左右點擊區（在主圖容器內，多張圖片時才顯示） */}
        {hasMultipleImages && showArrows && (
          <>
            {/* 左側 20% - 上一張 */}
            <button
              onClick={goToPrev}
              className={cn(
                'absolute left-0 top-0 w-[20%] h-full',
                'flex items-center justify-center',
                'bg-transparent hover:bg-black/10',
                'transition-colors duration-200',
                'focus:outline-none',
                '[&>div]:opacity-0 [&:hover>div]:opacity-100'
              )}
              aria-label="上一張圖片"
            >
              <div
                className={cn(
                  'w-10 h-10 flex items-center justify-center',
                  'bg-black/30 text-white rounded-full',
                  'transition-opacity duration-200'
                )}
              >
                <ChevronLeft className="w-6 h-6" />
              </div>
            </button>

            {/* 右側 20% - 下一張 */}
            <button
              onClick={goToNext}
              className={cn(
                'absolute right-0 top-0 w-[20%] h-full',
                'flex items-center justify-center',
                'bg-transparent hover:bg-black/10',
                'transition-colors duration-200',
                'focus:outline-none',
                '[&>div]:opacity-0 [&:hover>div]:opacity-100'
              )}
              aria-label="下一張圖片"
            >
              <div
                className={cn(
                  'w-10 h-10 flex items-center justify-center',
                  'bg-black/30 text-white rounded-full',
                  'transition-opacity duration-200'
                )}
              >
                <ChevronRight className="w-6 h-6" />
              </div>
            </button>
          </>
        )}
      </div>

      {/* 指示器（多張圖片時才顯示，但如果有縮圖則隱藏） */}
      {hasMultipleImages && showIndicators && !showThumbnails && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
          {/* 圓點指示器 */}
          <div className="flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToIndex(index)}
                className={cn(
                  'w-2.5 h-2.5 rounded-full transition-[transform,background-color] duration-200',
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

      {/* 縮圖列（多張圖片時才顯示） */}
      {hasMultipleImages && showThumbnails && (
        <div className="mt-4 py-2 overflow-x-auto scrollbar-hide">
          <div className="flex justify-center gap-3 min-w-max px-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => goToIndex(index)}
                className={cn(
                  'relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden',
                  'transition-[transform,opacity] duration-200 ease-out',
                  'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2',
                  currentIndex === index
                    ? 'scale-110 opacity-100 shadow-lg ring-2 ring-green-500'
                    : 'opacity-60 hover:opacity-90 hover:scale-105'
                )}
                aria-label={`檢視第 ${index + 1} 張圖片`}
              >
                <SafeImage
                  src={image}
                  alt={`${productName} 縮圖 ${index + 1}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
