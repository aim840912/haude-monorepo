import React, { useState, useEffect, useRef, useMemo } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { useModalAnimation, useEscapeKey, useFocusTrap } from '@/hooks/useModalAnimation'
import { ProductFeaturesList } from './modal/ProductFeaturesList'
import { ProductModalActions } from './modal/ProductModalActions'
import { ProductModalHeader, ProductPriceDisplay } from './modal/ProductModalHeader'
import { ProductQuantitySelector } from './modal/ProductQuantitySelector'
import { ProductSpecificationsList } from './modal/ProductSpecificationsList'
import type { ProductDetailModalProps, ExtendedProduct } from './modal/types'

// 導出型別供外部使用
export type { ExtendedProduct, ProductDetailModalProps }

/**
 * 產品詳細資訊 Modal
 *
 * 顯示完整的產品詳細資訊：
 * - 產品圖片
 * - 完整的產品資訊
 * - 產品特色和規格
 * - 數量選擇
 * - 收藏功能
 * - 詢問報價功能
 * - 優雅的動畫效果
 * - 響應式設計
 */
export const ProductDetailModal = React.memo<ProductDetailModalProps>(
  ({ product, isInterested = false, onClose, onToggleInterest, onRequestQuote }) => {
    const [quantity, setQuantity] = useState(1)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const modalRef = useRef<HTMLDivElement>(null)

    // 動畫控制
    const { shouldRender, backdropClasses, contentClasses } = useModalAnimation(true, 300)

    // 鍵盤支援
    useEscapeKey(onClose, shouldRender)
    useFocusTrap(shouldRender)

    // 重置數量當產品變更時（這是從 props 同步到 state 的合法模式）
    
    useEffect(() => {
      setQuantity(1)
      setCurrentImageIndex(0)
    }, [product.id])
    

    const handleBackdropClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose()
      }
    }

    // 圖片陣列（使用 useMemo 避免重複計算）
    const images = useMemo(() => {
      const validImages = (product.images || [])
        .filter(img => img.storageUrl)
        .map(img => ({ id: img.id, storageUrl: img.storageUrl }))

      // Fallback：使用 product.image 或 placeholder
      if (validImages.length === 0) {
        const fallbackUrl = product.image || '/placeholder-product.png'
        return [{ id: 'fallback', storageUrl: fallbackUrl }]
      }
      return validImages
    }, [product.images, product.image])

    // 當前顯示的圖片 URL
    const currentImageUrl = images[currentImageIndex]?.storageUrl || '/placeholder-product.png'

    // 圖片切換處理
    const handleImageChange = (index: number) => {
      setCurrentImageIndex(index)
    }

    // 確保只在客戶端渲染 Portal
    if (typeof window === 'undefined' || !shouldRender) {
      return null
    }

    const modalContent = (
      <div
        className={cn(backdropClasses)}
        onClick={handleBackdropClick}
        data-modal="true"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <div ref={modalRef} className={cn(contentClasses, 'overflow-hidden')}>
          {/* Modal 主體 - 響應式設計 */}
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* 移動端頂部拖拽指示器 */}
            <div className="md:hidden bg-gray-300 h-1 w-full" />

            <div className="grid md:grid-cols-2 gap-0">
              {/* 產品圖片 - 左側 */}
              <div className="relative bg-gray-50 md:rounded-l-2xl overflow-hidden border-r border-gray-100">
                <div className="p-6 md:p-8">
                  {/* 圖片容器 */}
                  <div className="mb-6">
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                      <div className="relative aspect-square">
                        <Image
                          src={currentImageUrl}
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/placeholder-product.png'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 縮圖預覽 */}
                  {images.length > 1 && (
                    <div className="flex space-x-3 overflow-x-auto pb-2 justify-center">
                      {images.map((image, index) => (
                        <button
                          key={image.id || index}
                          type="button"
                          onClick={() => handleImageChange(index)}
                          className={cn(
                            'relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden',
                            'transition-transform duration-200 hover:scale-105',
                            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400',
                            currentImageIndex === index
                              ? 'ring-2 ring-gray-400 shadow-md'
                              : 'ring-1 ring-gray-300 hover:ring-gray-400'
                          )}
                          aria-label={`切換到圖片 ${index + 1}，共 ${images.length} 張`}
                          aria-pressed={currentImageIndex === index}
                        >
                          <Image
                            src={image.storageUrl}
                            alt={`預覽 ${index + 1}`}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 產品詳細資訊 - 右側 */}
              <div className="relative p-6 md:p-8 bg-white/80 backdrop-blur-sm">
                {/* 關閉按鈕 */}
                <button
                  type="button"
                  onClick={onClose}
                  className={cn(
                    'absolute top-4 right-4 z-10',
                    'w-10 h-10 bg-white/90 hover:bg-red-50 backdrop-blur-sm rounded-full',
                    'flex items-center justify-center',
                    'shadow-lg hover:shadow-xl',
                    'text-gray-400 hover:text-red-500',
                    'transition-[box-shadow,transform] duration-300 ease-out',
                    'hover:scale-110 hover:rotate-90',
                    'focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2'
                  )}
                  aria-label="關閉產品詳細資訊視窗"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* 產品基本資訊 */}
                <ProductModalHeader product={product} />

                {/* 產品特色 */}
                {product.features && <ProductFeaturesList features={product.features} />}

                {/* 商品規格 */}
                {product.specifications && (
                  <ProductSpecificationsList specifications={product.specifications} />
                )}

                {/* 價格和操作區域 */}
                <div className="border-t border-gray-200 pt-6">
                  {/* 價格顯示 */}
                  <ProductPriceDisplay product={product} />

                  {/* 數量選擇 */}
                  <ProductQuantitySelector
                    quantity={quantity}
                    onQuantityChange={setQuantity}
                    max={product.availableStock ?? product.stock ?? 99}
                  />

                  {/* 操作按鈕組 */}
                  <ProductModalActions
                    product={product}
                    quantity={quantity}
                    isInterested={isInterested}
                    onToggleInterest={onToggleInterest}
                    onRequestQuote={onRequestQuote}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )

    return createPortal(modalContent, document.body)
  }
)

ProductDetailModal.displayName = 'ProductDetailModal'
