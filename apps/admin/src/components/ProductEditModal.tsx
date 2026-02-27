import { useState, useEffect, useCallback } from 'react'
import { X, Loader2 } from 'lucide-react'
import type { Product } from '@haude/types'
import type { CreateProductData, UpdateProductData } from '../hooks/useProducts'
import { ImageManager } from './ImageManager'
import { productImagesApi, type ProductImage } from '../services/api'
import logger from '../lib/logger'

interface ProductEditModalProps {
  product: Product | null  // null = 新增模式，isDraft=true = 草稿模式
  isOpen: boolean
  isLoading: boolean
  onClose: () => void
  onCreate?: (data: CreateProductData) => Promise<boolean>
  onUpdate?: (id: string, data: UpdateProductData) => Promise<boolean>
  onDelete?: (id: string) => Promise<{ success: boolean; error?: string }>
}

export function ProductEditModal({
  product,
  isOpen,
  isLoading,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: ProductEditModalProps) {
  const isEditMode = product !== null
  const isDraftMode = product?.isDraft === true

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
  // 追蹤待刪除的圖片 ID（儲存時才真正刪除）
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([])
  const [isCancelling, setIsCancelling] = useState(false)

  // 載入產品圖片（僅編輯模式）
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

  // 當 product 改變時重置表單
  useEffect(() => {
    if (isEditMode && product) {
      // 編輯模式：載入現有產品資料
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        price: product.price || 0,
        stock: product.stock ?? 0,
        isActive: product.isActive ?? true,
      })
      setError(null)
      setNewlyUploadedIds([])
      setPendingDeleteIds([])
      // 載入圖片
      if (product.images && product.images.length > 0) {
        setImages(product.images.map(img => ({
          id: img.id,
          productId: product.id,
          storageUrl: img.storageUrl,
          filePath: img.filePath ?? '',
          altText: img.altText || undefined,
          displayPosition: img.displayPosition ?? 0,
          size: (img.size ?? 'medium') as 'thumbnail' | 'medium' | 'large',
          createdAt: img.createdAt ?? '',
          updatedAt: img.updatedAt ?? '',
        })))
      } else {
        loadImages()
      }
    } else {
      // 新增模式：重置為空表單
      setFormData({
        name: '',
        description: '',
        category: '',
        price: 0,
        stock: 0,
        isActive: true,
      })
      setError(null)
      setImages([])
      setNewlyUploadedIds([])
      setPendingDeleteIds([])
    }
  }, [product, isEditMode, loadImages])

  // 處理圖片變更（上傳完成時呼叫）
  const handleImagesChange = useCallback((newImageIds?: string[]) => {
    if (newImageIds && newImageIds.length > 0) {
      setNewlyUploadedIds(prev => [...prev, ...newImageIds])
    }
    loadImages()
  }, [loadImages])

  // 標記圖片為待刪除
  const handleMarkForDelete = useCallback((imageId: string) => {
    // 如果是新上傳的圖片，從 newlyUploadedIds 移除
    if (newlyUploadedIds.includes(imageId)) {
      setNewlyUploadedIds(prev => prev.filter(id => id !== imageId))
    }
    // 加入待刪除列表
    setPendingDeleteIds(prev => [...prev, imageId])
  }, [newlyUploadedIds])

  // 復原圖片（取消待刪除標記）
  const handleRestoreImage = useCallback((imageId: string) => {
    setPendingDeleteIds(prev => prev.filter(id => id !== imageId))
  }, [])

  // 取消時清理：草稿模式刪除整個產品，否則只刪除新上傳的圖片
  const handleCancel = useCallback(async () => {
    // 草稿模式：刪除整個草稿產品
    if (isDraftMode && product?.id && onDelete) {
      setIsCancelling(true)
      try {
        await onDelete(product.id)
      } catch (err) {
        logger.error('刪除草稿產品失敗', { error: err })
      } finally {
        setIsCancelling(false)
        setNewlyUploadedIds([])
        setPendingDeleteIds([])
        onClose()
      }
      return
    }

    // 非草稿模式：
    // - pendingDeleteIds → 直接清空（還沒真正刪除）
    // - newlyUploadedIds → 需要調用 API 刪除
    if (newlyUploadedIds.length === 0 || !product?.id) {
      setPendingDeleteIds([])
      onClose()
      return
    }

    setIsCancelling(true)
    try {
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
      setPendingDeleteIds([])
      onClose()
    }
  }, [isDraftMode, newlyUploadedIds, product?.id, onClose, onDelete])

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

    // 步驟 1: 先刪除被標記的圖片
    if (pendingDeleteIds.length > 0 && product?.id) {
      try {
        await Promise.all(
          pendingDeleteIds.map(imageId =>
            productImagesApi.deleteImage(product.id, imageId)
          )
        )
      } catch (err) {
        logger.error('刪除圖片失敗', { error: err })
        setError('部分圖片刪除失敗，請稍後再試')
        return
      }
    }

    let success = false

    if (isEditMode && product && onUpdate) {
      // 編輯模式（含草稿模式）
      success = await onUpdate(product.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category.trim(),
        price: formData.price,
        stock: formData.stock,
        isActive: formData.isActive,
        // 草稿模式：提交時設置 isDraft: false
        ...(isDraftMode && { isDraft: false }),
      })
    } else if (!isEditMode && onCreate) {
      // 純新增模式（沒有 product）
      success = await onCreate({
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: formData.price,
        category: formData.category.trim(),
        stock: formData.stock,
        isActive: formData.isActive,
      })
    }

    if (success) {
      setNewlyUploadedIds([])
      setPendingDeleteIds([])
      onClose()
    } else {
      setError(isDraftMode ? '儲存失敗，請稍後再試' : isEditMode ? '更新失敗，請稍後再試' : '新增失敗，請稍後再試')
    }
  }

  const handleBackdropMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading && !isCancelling) {
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
          <h2 className="text-lg font-semibold text-gray-900">
            {isDraftMode ? '新增產品' : isEditMode ? '編輯產品' : '新增產品'}
          </h2>
          <button
            onClick={handleCancel}
            disabled={isLoading || isCancelling}
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
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>

          {/* 價格與庫存 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                價格 (NT$) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                min="0"
                disabled={isLoading}
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
                disabled={isLoading}
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
              disabled={isLoading}
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
                  disabled={isLoading}
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
                  disabled={isLoading}
                />
                <span className="text-sm text-gray-700">下架</span>
              </label>
            </div>
          </div>

          {/* 產品圖片（編輯模式和草稿模式都顯示） */}
          {isEditMode && product && (
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
                <ImageManager
                  entityId={product.id}
                  images={images}
                  imagesApi={productImagesApi}
                  onImagesChange={handleImagesChange}
                  disabled={isLoading || isCancelling}
                  label="產品圖片"
                  pendingDeleteIds={pendingDeleteIds}
                  onMarkForDelete={handleMarkForDelete}
                  onRestoreImage={handleRestoreImage}
                />
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading || isCancelling}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              {isCancelling && <Loader2 className="w-4 h-4 animate-spin" />}
              {isCancelling ? '清理中...' : '取消'}
            </button>
            <button
              type="submit"
              disabled={isLoading || isCancelling}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? '儲存中...' : isDraftMode ? '新增產品' : isEditMode ? '儲存變更' : '新增產品'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
