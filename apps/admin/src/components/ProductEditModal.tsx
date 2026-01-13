import { useState, useEffect, useCallback } from 'react'
import { X, Loader2 } from 'lucide-react'
import type { Product } from '@haude/types'
import type { UpdateProductData } from '../hooks/useProducts'
import { ProductImageManager } from './ProductImageManager'
import { productImagesApi, type ProductImage } from '../services/api'
import logger from '../lib/logger'

interface ProductEditModalProps {
  product: Product
  isOpen: boolean
  isUpdating: boolean
  onClose: () => void
  onSave: (id: string, data: UpdateProductData) => Promise<boolean>
}

export function ProductEditModal({
  product,
  isOpen,
  isUpdating,
  onClose,
  onSave,
}: ProductEditModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: 0,
    stock: 0,
    isActive: true,
  })
  const [error, setError] = useState<string | null>(null)
  const [images, setImages] = useState<ProductImage[]>([])
  const [isLoadingImages, setIsLoadingImages] = useState(false)
  // 追蹤本次新上傳的圖片 ID（取消時需要刪除）
  const [newlyUploadedIds, setNewlyUploadedIds] = useState<string[]>([])
  const [isCancelling, setIsCancelling] = useState(false)

  // 載入產品圖片
  const loadImages = useCallback(async () => {
    if (!product?.id) return
    setIsLoadingImages(true)
    try {
      const { data } = await productImagesApi.getImages(product.id)
      setImages(data)
    } catch (err) {
      logger.error('載入圖片失敗', { error: err })
    } finally {
      setIsLoadingImages(false)
    }
  }, [product?.id])

  // 當 product 改變時重置表單並載入圖片
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        price: product.price || 0,
        stock: product.stock ?? 0,
        isActive: product.isActive ?? true,
      })
      setError(null)
      // 重置新上傳圖片追蹤
      setNewlyUploadedIds([])
      // 如果產品有預載入的圖片，使用它們；否則從 API 載入
      if (product.productImages && product.productImages.length > 0) {
        // API 已返回 camelCase，直接使用
        setImages(product.productImages.map(img => ({
          id: img.id,
          productId: product.id,
          storageUrl: img.storageUrl,
          filePath: img.filePath,
          altText: img.altText || undefined,
          displayPosition: img.displayPosition,
          size: img.size as 'thumbnail' | 'medium' | 'large',
          createdAt: img.createdAt,
          updatedAt: img.updatedAt,
        })))
      } else {
        loadImages()
      }
    }
  }, [product, loadImages])

  // 處理圖片變更（上傳完成時呼叫）
  const handleImagesChange = useCallback((newImageIds?: string[]) => {
    // 記錄新上傳的圖片 ID
    if (newImageIds && newImageIds.length > 0) {
      setNewlyUploadedIds(prev => [...prev, ...newImageIds])
    }
    // 重新載入圖片列表
    loadImages()
  }, [loadImages])

  // 取消時清理新上傳的圖片
  const handleCancel = useCallback(async () => {
    if (newlyUploadedIds.length === 0) {
      onClose()
      return
    }

    setIsCancelling(true)
    try {
      // 刪除本次新上傳的所有圖片
      await Promise.all(
        newlyUploadedIds.map(imageId =>
          productImagesApi.deleteImage(product.id, imageId).catch(err => {
            logger.error(`刪除圖片 ${imageId} 失敗`, { error: err })
          })
        )
      )
    } finally {
      setIsCancelling(false)
      setNewlyUploadedIds([])
      onClose()
    }
  }, [newlyUploadedIds, product.id, onClose])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // 基本驗證
    if (!formData.name.trim()) {
      setError('產品名稱不能為空')
      return
    }
    if (formData.price < 0) {
      setError('價格不能為負數')
      return
    }
    if (formData.stock < 0) {
      setError('庫存不能為負數')
      return
    }

    const success = await onSave(product.id, {
      name: formData.name.trim(),
      description: formData.description.trim(),
      category: formData.category.trim(),
      price: formData.price,
      stock: formData.stock,
      isActive: formData.isActive,
    })

    if (success) {
      // 儲存成功，清除追蹤（圖片已確認保留）
      setNewlyUploadedIds([])
      onClose()
    } else {
      setError('更新失敗，請稍後再試')
    }
  }

  // 使用 mousedown 而非 click，避免拖曳到外面時意外關閉
  const handleBackdropMouseDown = (e: React.MouseEvent) => {
    // 只有直接點擊背景時才關閉（不是點擊 Modal 內容後拖出來）
    if (e.target === e.currentTarget && !isUpdating && !isCancelling) {
      handleCancel()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8"
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 my-auto"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">編輯產品</h2>
          <button
            onClick={handleCancel}
            disabled={isUpdating || isCancelling}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* 產品名稱 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              產品名稱 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={isUpdating}
            />
          </div>

          {/* 分類 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              分類
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={isUpdating}
            />
          </div>

          {/* 價格與庫存 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                價格 (NT$)
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                min="0"
                disabled={isUpdating}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                庫存
              </label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                min="0"
                disabled={isUpdating}
              />
            </div>
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              產品描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              disabled={isUpdating}
            />
          </div>

          {/* 狀態 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              上架狀態
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={() => setFormData({ ...formData, isActive: true })}
                  className="w-4 h-4 text-green-600 focus:ring-green-500"
                  disabled={isUpdating}
                />
                <span className="text-sm text-gray-700">上架</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="isActive"
                  checked={!formData.isActive}
                  onChange={() => setFormData({ ...formData, isActive: false })}
                  className="w-4 h-4 text-green-600 focus:ring-green-500"
                  disabled={isUpdating}
                />
                <span className="text-sm text-gray-700">下架</span>
              </label>
            </div>
          </div>

          {/* 產品圖片 */}
          <div className="pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              產品圖片
            </label>
            {isLoadingImages ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">載入圖片中...</span>
              </div>
            ) : (
              <ProductImageManager
                productId={product.id}
                images={images}
                onImagesChange={handleImagesChange}
                disabled={isUpdating || isCancelling}
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isUpdating || isCancelling}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              {isCancelling && <Loader2 className="w-4 h-4 animate-spin" />}
              {isCancelling ? '清理中...' : '取消'}
            </button>
            <button
              type="submit"
              disabled={isUpdating || isCancelling}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
              {isUpdating ? '儲存中...' : '儲存變更'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
