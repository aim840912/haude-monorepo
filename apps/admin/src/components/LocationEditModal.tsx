import { useState, useEffect, useCallback } from 'react'
import { X, Loader2 } from 'lucide-react'
import type { Location, CreateLocationData, UpdateLocationData } from '../hooks/useLocations'
import { LocationImageManager } from './LocationImageManager'
import { locationImagesApi, type LocationImage } from '../services/api'
import logger from '../lib/logger'

interface LocationEditModalProps {
  location: Location | null  // null = 新增模式
  isOpen: boolean
  isLoading: boolean
  onClose: () => void
  onCreate?: (data: CreateLocationData) => Promise<boolean>
  onUpdate?: (id: string, data: UpdateLocationData) => Promise<boolean>
  onDelete?: (id: string) => Promise<boolean>  // 用於草稿取消時刪除
}

export function LocationEditModal({
  location,
  isOpen,
  isLoading,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: LocationEditModalProps) {
  const isEditMode = location !== null
  const isDraftMode = location?.isDraft === true  // 草稿模式（新增時建立的草稿）

  const [formData, setFormData] = useState({
    name: '',
    title: '',
    address: '',
    landmark: '',
    phone: '',
    lineId: '',
    hours: '',
    closedDays: '',
    parking: '',
    publicTransport: '',
    image: '',
    isMain: false,
    isActive: true,
  })
  const [error, setError] = useState<string | null>(null)
  const [images, setImages] = useState<LocationImage[]>([])
  const [isLoadingImages, setIsLoadingImages] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [newlyUploadedIds, setNewlyUploadedIds] = useState<string[]>([])  // 追蹤新上傳的圖片
  // 追蹤待刪除的圖片 ID（儲存時才真正刪除）
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([])

  // 載入圖片
  const loadImages = useCallback(async (locationId: string) => {
    setIsLoadingImages(true)
    try {
      const { data } = await locationImagesApi.getImages(locationId)
      setImages(data)
    } catch (err) {
      console.error('載入圖片失敗', err)
    } finally {
      setIsLoadingImages(false)
    }
  }, [])

  // 圖片變更處理（接收新上傳的圖片 ID）
  const handleImagesChange = useCallback((newImageIds?: string[]) => {
    // 追蹤新上傳的圖片 ID（用於取消時清理）
    if (newImageIds && newImageIds.length > 0) {
      setNewlyUploadedIds(prev => [...prev, ...newImageIds])
    }
    if (location?.id) {
      loadImages(location.id)
    }
  }, [location?.id, loadImages])

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

  useEffect(() => {
    if (isEditMode && location) {
      // 編輯模式或草稿模式：載入現有門市資料
      // 草稿模式下，name 可能是「未命名門市」，這裡清空讓用戶填寫
      setFormData({
        name: isDraftMode ? '' : (location.name || ''),
        title: location.title || '',
        address: location.address || '',
        landmark: location.landmark || '',
        phone: location.phone || '',
        lineId: location.lineId || '',
        hours: location.hours || '',
        closedDays: location.closedDays || '',
        parking: location.parking || '',
        publicTransport: location.publicTransport || '',
        image: location.image || '',
        isMain: location.isMain ?? false,
        isActive: location.isActive ?? true,
      })
      setError(null)
      setNewlyUploadedIds([])  // 重置新圖片追蹤
      setPendingDeleteIds([])  // 重置待刪除追蹤
      // 載入圖片
      loadImages(location.id)
    } else {
      // 純新增模式（無草稿）：重置為空表單
      setFormData({
        name: '',
        title: '',
        address: '',
        landmark: '',
        phone: '',
        lineId: '',
        hours: '',
        closedDays: '',
        parking: '',
        publicTransport: '',
        image: '',
        isMain: false,
        isActive: true,
      })
      setError(null)
      setImages([])
      setNewlyUploadedIds([])  // 重置新圖片追蹤
      setPendingDeleteIds([])  // 重置待刪除追蹤
    }
  }, [location, isEditMode, isDraftMode, loadImages])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.name.trim()) {
      setError('門市名稱不能為空')
      return
    }
    if (!formData.address.trim()) {
      setError('地址不能為空')
      return
    }

    // 步驟 1: 先刪除被標記的圖片
    if (pendingDeleteIds.length > 0 && location?.id) {
      try {
        await Promise.all(
          pendingDeleteIds.map(imageId =>
            locationImagesApi.deleteImage(location.id, imageId)
          )
        )
      } catch (err) {
        logger.error('刪除圖片失敗', { error: err })
        setError('部分圖片刪除失敗，請稍後再試')
        return
      }
    }

    let success = false

    if (isEditMode && location && onUpdate) {
      // 編輯模式或草稿模式：都使用 update
      success = await onUpdate(location.id, {
        name: formData.name.trim(),
        title: formData.title.trim() || undefined,
        address: formData.address.trim(),
        landmark: formData.landmark.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        lineId: formData.lineId.trim() || undefined,
        hours: formData.hours.trim() || undefined,
        closedDays: formData.closedDays.trim() || undefined,
        parking: formData.parking.trim() || undefined,
        publicTransport: formData.publicTransport.trim() || undefined,
        image: formData.image.trim() || undefined,
        isMain: formData.isMain,
        isActive: formData.isActive,
        // 草稿模式提交時，設置 isDraft: false 轉為正式資料
        ...(isDraftMode && { isDraft: false }),
      } as UpdateLocationData)
    } else if (!isEditMode && onCreate) {
      // 純新增模式（無草稿）
      success = await onCreate({
        name: formData.name.trim(),
        address: formData.address.trim(),
        title: formData.title.trim() || undefined,
        landmark: formData.landmark.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        lineId: formData.lineId.trim() || undefined,
        hours: formData.hours.trim() || undefined,
        closedDays: formData.closedDays.trim() || undefined,
        parking: formData.parking.trim() || undefined,
        publicTransport: formData.publicTransport.trim() || undefined,
        image: formData.image.trim() || undefined,
        isMain: formData.isMain,
        isActive: formData.isActive,
      })
    }

    if (success) {
      setNewlyUploadedIds([])
      setPendingDeleteIds([])
      onClose()
    } else {
      setError(isEditMode ? '更新失敗，請稍後再試' : '新增失敗，請稍後再試')
    }
  }

  // 處理取消（草稿模式刪除整個草稿；非草稿模式刪除新上傳的圖片）
  const handleCancel = useCallback(async () => {
    // 草稿模式：刪除整個門市（包含所有圖片）
    if (isDraftMode && location?.id && onDelete) {
      setIsCancelling(true)
      try {
        await onDelete(location.id)
      } catch (err) {
        logger.error('刪除草稿門市失敗', { error: err })
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
    if (newlyUploadedIds.length === 0 || !location?.id) {
      setPendingDeleteIds([])
      onClose()
      return
    }

    // 非草稿模式：刪除本次新上傳的圖片
    setIsCancelling(true)
    try {
      await Promise.all(
        newlyUploadedIds.map(imageId =>
          locationImagesApi.deleteImage(location.id, imageId).catch(err => {
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
  }, [isDraftMode, newlyUploadedIds, location?.id, onClose, onDelete])

  const handleBackdropMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading && !isCancelling) {
      handleCancel()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">
            {isDraftMode ? '新增門市據點' : isEditMode ? '編輯門市據點' : '新增門市據點'}
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

          {/* 基本資訊 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                門市名稱 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                副標題
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="例：總店"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* 地址 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              地址 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          {/* 地標 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              地標
            </label>
            <input
              type="text"
              value={formData.landmark}
              onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
              placeholder="例：7-11 旁邊"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          {/* 聯絡資訊 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                電話
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LINE ID
              </label>
              <input
                type="text"
                value={formData.lineId}
                onChange={(e) => setFormData({ ...formData, lineId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* 營業時間 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                營業時間
              </label>
              <input
                type="text"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                placeholder="例：09:00 - 18:00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                公休日
              </label>
              <input
                type="text"
                value={formData.closedDays}
                onChange={(e) => setFormData({ ...formData, closedDays: e.target.value })}
                placeholder="例：週一公休"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* 交通資訊 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                停車資訊
              </label>
              <input
                type="text"
                value={formData.parking}
                onChange={(e) => setFormData({ ...formData, parking: e.target.value })}
                placeholder="例：有專屬停車場"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                大眾運輸
              </label>
              <input
                type="text"
                value={formData.publicTransport}
                onChange={(e) => setFormData({ ...formData, publicTransport: e.target.value })}
                placeholder="例：捷運站步行 5 分鐘"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* 圖片 - 編輯模式和草稿模式都顯示上傳器 */}
          {location ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                門市圖片
              </label>
              {isLoadingImages ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : (
                <LocationImageManager
                  locationId={location.id}
                  images={images}
                  onImagesChange={handleImagesChange}
                  disabled={isLoading || isCancelling}
                  pendingDeleteIds={pendingDeleteIds}
                  onMarkForDelete={handleMarkForDelete}
                  onRestoreImage={handleRestoreImage}
                />
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                門市圖片 URL
              </label>
              <input
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                儲存後可上傳多張圖片
              </p>
              {formData.image && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-2">圖片預覽：</p>
                  <div className="relative w-full max-w-xs aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={formData.image}
                      alt="門市圖片預覽"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 狀態選項 */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isMain}
                onChange={(e) => setFormData({ ...formData, isMain: e.target.checked })}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                disabled={isLoading}
              />
              <span className="text-sm text-gray-700">設為主要門市</span>
            </label>
            {/* 營業狀態 */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">營業狀態</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={() => setFormData({ ...formData, isActive: true })}
                  className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                  disabled={isLoading}
                />
                <span className="text-sm text-gray-700">營業中</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="isActive"
                  checked={!formData.isActive}
                  onChange={() => setFormData({ ...formData, isActive: false })}
                  className="w-4 h-4 text-gray-600 border-gray-300 focus:ring-gray-500"
                  disabled={isLoading}
                />
                <span className="text-sm text-gray-700">已關閉</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading || isCancelling}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              {isCancelling && <Loader2 className="w-4 h-4 animate-spin" />}
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading || isCancelling}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? '儲存中...' : isDraftMode ? '新增門市' : isEditMode ? '儲存變更' : '新增門市'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
