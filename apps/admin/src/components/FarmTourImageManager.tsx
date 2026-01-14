import { useState, useCallback } from 'react'
import { Upload, X, Loader2, GripVertical, Image as ImageIcon } from 'lucide-react'
import { farmTourImagesApi, type FarmTourImage } from '../services/api'
import logger from '../lib/logger'

interface FarmTourImageManagerProps {
  farmTourId: string
  images: FarmTourImage[]
  onImagesChange: (newImageIds?: string[]) => void
  disabled?: boolean
}

export function FarmTourImageManager({
  farmTourId,
  images,
  onImagesChange,
  disabled = false,
}: FarmTourImageManagerProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  // 刪除確認狀態
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // 處理檔案上傳
  const handleUpload = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files)
      if (fileArray.length === 0) return

      // 驗證檔案類型
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      const invalidFiles = fileArray.filter((f) => !validTypes.includes(f.type))
      if (invalidFiles.length > 0) {
        setError('只接受 JPG, PNG, WebP, GIF 格式的圖片')
        return
      }

      // 驗證檔案大小（最大 5MB）
      const maxSize = 5 * 1024 * 1024
      const oversizedFiles = fileArray.filter((f) => f.size > maxSize)
      if (oversizedFiles.length > 0) {
        setError('圖片大小不能超過 5MB')
        return
      }

      setIsUploading(true)
      setError(null)
      setUploadProgress(0)

      // 收集本次上傳的圖片 ID
      const uploadedImageIds: string[] = []

      try {
        for (let i = 0; i < fileArray.length; i++) {
          const file = fileArray[i]

          // 1. 取得上傳 URL
          const { data: uploadData } = await farmTourImagesApi.getUploadUrl(
            farmTourId,
            file.name
          )

          // 2. 直接上傳到 Supabase Storage
          const uploadResponse = await fetch(uploadData.uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type,
            },
          })

          if (!uploadResponse.ok) {
            throw new Error(`上傳失敗: ${uploadResponse.statusText}`)
          }

          // 3. 新增圖片記錄到資料庫
          const { data: newImage } = await farmTourImagesApi.addImage(farmTourId, {
            storageUrl: uploadData.publicUrl,
            filePath: uploadData.filePath,
            altText: file.name.replace(/\.[^/.]+$/, ''), // 移除副檔名作為 alt
          })

          // 記錄新上傳的圖片 ID
          uploadedImageIds.push(newImage.id)

          setUploadProgress(((i + 1) / fileArray.length) * 100)
        }

        // 通知父元件更新，並傳遞新上傳的圖片 ID
        onImagesChange(uploadedImageIds)
      } catch (err) {
        logger.error('上傳錯誤', { error: err })
        setError(err instanceof Error ? err.message : '上傳失敗，請稍後再試')
      } finally {
        setIsUploading(false)
        setUploadProgress(0)
      }
    },
    [farmTourId, onImagesChange]
  )

  // 處理刪除 - 顯示確認 UI
  const handleDeleteClick = useCallback((imageId: string) => {
    setDeletingImageId(imageId)
  }, [])

  // 確認刪除
  const handleConfirmDelete = useCallback(async () => {
    if (!deletingImageId) return

    setIsDeleting(true)
    try {
      await farmTourImagesApi.deleteImage(farmTourId, deletingImageId)
      setDeletingImageId(null)
      onImagesChange()
    } catch (err) {
      logger.error('刪除失敗', { error: err })
      setError('刪除失敗，請稍後再試')
    } finally {
      setIsDeleting(false)
    }
  }, [deletingImageId, farmTourId, onImagesChange])

  // 取消刪除
  const handleCancelDelete = useCallback(() => {
    setDeletingImageId(null)
  }, [])

  // 拖放處理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (!disabled && e.dataTransfer.files) {
      handleUpload(e.dataTransfer.files)
    }
  }

  // 檔案選擇處理
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleUpload(e.target.files)
      e.target.value = '' // 重置，允許重複選擇同一檔案
    }
  }

  return (
    <div className="space-y-4">
      {/* 錯誤訊息 */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 上傳區域 */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${isDragOver ? 'border-green-500 bg-green-50' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-green-400'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && document.getElementById('farm-tour-image-upload')?.click()}
      >
        <input
          id="farm-tour-image-upload"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          disabled={disabled || isUploading}
        />

        {isUploading ? (
          <div className="space-y-2">
            <Loader2 className="w-8 h-8 mx-auto text-green-500 animate-spin" />
            <p className="text-sm text-gray-600">上傳中... {Math.round(uploadProgress)}%</p>
            <div className="w-48 mx-auto bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="w-8 h-8 mx-auto text-gray-400" />
            <p className="text-sm text-gray-600">
              拖放圖片到這裡，或<span className="text-green-600">點擊選擇</span>
            </p>
            <p className="text-xs text-gray-400">
              支援 JPG, PNG, WebP, GIF（最大 5MB）
            </p>
          </div>
        )}
      </div>

      {/* 圖片列表 */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">
              已上傳圖片 ({images.length})
            </p>
            <p className="text-xs text-amber-600">
              新圖片需點擊「儲存變更」才會保留
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((image, index) => (
              <div
                key={image.id}
                className="relative group bg-gray-100 rounded-lg overflow-hidden aspect-square"
              >
                <img
                  src={image.storageUrl}
                  alt={image.altText || `農場體驗圖片 ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* 排序標籤 */}
                <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                  <GripVertical className="w-3 h-3" />
                  {index + 1}
                </div>

                {/* 刪除確認 UI */}
                {deletingImageId === image.id ? (
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 p-2">
                    <p className="text-white text-xs text-center">確定刪除？</p>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleConfirmDelete()
                        }}
                        disabled={isDeleting}
                        className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-50 flex items-center gap-1"
                      >
                        {isDeleting && <Loader2 className="w-3 h-3 animate-spin" />}
                        {isDeleting ? '刪除中' : '確定'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCancelDelete()
                        }}
                        disabled={isDeleting}
                        className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 disabled:opacity-50"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  /* 刪除按鈕 */
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteClick(image.id)
                    }}
                    disabled={disabled || deletingImageId !== null}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 無圖片提示 */}
      {images.length === 0 && !isUploading && (
        <div className="text-center py-4 text-gray-400 text-sm">
          <div className="flex items-center justify-center gap-2">
            <ImageIcon className="w-5 h-5" />
            尚未上傳任何圖片
          </div>
          <p className="text-xs text-amber-600 mt-1">
            新圖片需點擊「儲存變更」才會保留
          </p>
        </div>
      )}
    </div>
  )
}
