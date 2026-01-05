'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Heart, Share2, ShoppingCart, Truck, Shield, RefreshCw, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useProduct } from '@/hooks/useProducts'
import { useCartStore } from '@/stores/cartStore'
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner'
import { cn } from '@/lib/utils'

interface ProductDetailPageProps {
  params: Promise<{ id: string }>
}

/**
 * 產品詳情頁
 *
 * 功能：
 * - 顯示產品完整資訊
 * - 圖片輪播
 * - 加入購物車
 */
export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { product, isLoading, error } = useProduct(id)
  const { addItem, isLoading: isAddingToCart } = useCartStore()
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)

  // 載入狀態
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // 錯誤狀態
  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">產品不存在</h2>
        <p className="text-gray-600 mb-8">{error || '找不到此產品'}</p>
        <button
          onClick={() => router.push('/products')}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          返回產品列表
        </button>
      </div>
    )
  }

  // 注意：API 回傳的是 images (camelCase)，不是 productImages
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const images = (product as any).images || product.productImages || []
  const currentImage = images[selectedImageIndex]?.storageUrl || images[selectedImageIndex]?.storage_url || '/placeholder-product.jpg'

  // 注意：API 回傳的是 stock (資料庫欄位)，前端型別定義是 inventory
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stock = (product as any).stock ?? product.inventory ?? 0

  // 計算折扣
  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0

  const handleShare = async () => {
    const shareUrl = window.location.href
    const shareData = {
      title: product.name,
      text: `查看這個產品：${product.name}`,
      url: shareUrl,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(shareUrl)
        alert('連結已複製到剪貼簿！')
      }
    } catch {
      // User cancelled or error
    }
  }

  const handleAddToCart = async () => {
    try {
      await addItem(product, quantity)
      setAddedToCart(true)
      // 2 秒後重置狀態
      setTimeout(() => setAddedToCart(false), 2000)
    } catch (error) {
      console.error('加入購物車失敗:', error)
      alert('加入購物車失敗，請稍後再試')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頂部導航 */}
      <div className="bg-white border-b sticky top-[var(--header-height)] z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>返回</span>
            </button>
            <div className="flex items-center gap-4">
              <button
                onClick={handleShare}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="分享"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                aria-label="收藏"
              >
                <Heart className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 主要內容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* 左側：圖片區 */}
          <div className="space-y-4">
            {/* 主圖 */}
            <div className="aspect-square bg-white rounded-xl overflow-hidden shadow-lg">
              <img
                src={currentImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* 縮圖列表 */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((image: { id: string; storageUrl?: string; storage_url?: string }, index: number) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImageIndex(index)}
                    className={cn(
                      'flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors',
                      selectedImageIndex === index
                        ? 'border-green-500'
                        : 'border-transparent hover:border-gray-300'
                    )}
                  >
                    <img
                      src={image.storageUrl || image.storage_url}
                      alt={`${product.name} - ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 右側：產品資訊 */}
          <div className="space-y-6">
            {/* 類別 */}
            <Link
              href={`/products?category=${product.category}`}
              className="inline-block text-sm text-green-600 hover:text-green-700 uppercase tracking-wider"
            >
              {product.category}
            </Link>

            {/* 名稱 */}
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

            {/* 價格區 */}
            <div className="flex items-baseline gap-4">
              <span className="text-3xl font-bold text-green-900">
                NT$ {product.price.toLocaleString()}
                {product.priceUnit && (
                  <span className="text-lg font-normal text-gray-600 ml-1">
                    / {product.priceUnit}
                  </span>
                )}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <>
                  <span className="text-xl text-gray-500 line-through">
                    NT$ {product.originalPrice.toLocaleString()}
                  </span>
                  <span className="text-sm font-bold text-red-600 bg-red-100 px-2 py-1 rounded">
                    -{discountPercent}%
                  </span>
                </>
              )}
            </div>

            {/* 庫存 */}
            <div className="text-sm">
              {stock > 0 ? (
                <span className="text-green-600">庫存充足 ({stock})</span>
              ) : (
                <span className="text-red-500">缺貨中</span>
              )}
            </div>

            {/* 描述 */}
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            {/* 數量選擇 */}
            <div className="flex items-center gap-4">
              <span className="text-gray-700 font-medium">數量</span>
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="px-4 py-2 border-x border-gray-300 min-w-[60px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                  disabled={quantity >= stock}
                >
                  +
                </button>
              </div>
            </div>

            {/* 購買按鈕 */}
            <div className="flex gap-4">
              <button
                onClick={handleAddToCart}
                disabled={stock <= 0 || isAddingToCart}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-4 rounded-lg font-medium transition-colors',
                  addedToCart
                    ? 'bg-green-700 text-white'
                    : stock > 0 && !isAddingToCart
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                )}
              >
                {isAddingToCart ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    處理中...
                  </>
                ) : addedToCart ? (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    已加入購物車
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    加入購物車
                  </>
                )}
              </button>
            </div>

            {/* 服務保證 */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t">
              <div className="flex flex-col items-center text-center">
                <Truck className="w-6 h-6 text-green-600 mb-2" />
                <span className="text-sm text-gray-600">免運費</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <Shield className="w-6 h-6 text-green-600 mb-2" />
                <span className="text-sm text-gray-600">品質保證</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <RefreshCw className="w-6 h-6 text-green-600 mb-2" />
                <span className="text-sm text-gray-600">7天退換</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
