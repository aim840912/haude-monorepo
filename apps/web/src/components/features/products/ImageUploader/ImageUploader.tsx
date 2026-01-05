import { useState, useCallback } from 'react'
import { X, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { UploadArea } from './UploadArea'
import type { ImageUploaderProps, UploadedImage } from './types'

/**
 * 圖片上傳器元件
 *
 * 提供多圖片上傳功能：
 * - 拖放上傳
 * - 圖片預覽
 * - 排序功能
 * - 刪除功能
 */
export function ImageUploader({
  onUploadSuccess,
  onUploadError,
  onDeleteSuccess,
  onFilesSelected,
  maxFiles = 5,
  allowMultiple = true,
  className,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  maxFileSize = 10 * 1024 * 1024, // 10MB
  initialImages = [],
  isUploading = false,
  uploadProgress = 0,
}: ImageUploaderProps) {
  const [images, setImages] = useState<UploadedImage[]>(initialImages)

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!acceptedTypes.includes(file.type)) {
        return `不支援的檔案格式: ${file.type}`
      }
      if (file.size > maxFileSize) {
        return `檔案過大: ${(file.size / 1024 / 1024).toFixed(2)}MB (最大 ${maxFileSize / 1024 / 1024}MB)`
      }
      return null
    },
    [acceptedTypes, maxFileSize]
  )

  const handleFileSelect = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return

      const files = Array.from(fileList)
      const availableSlots = maxFiles - images.length

      if (files.length > availableSlots) {
        onUploadError?.(`最多只能上傳 ${maxFiles} 張圖片`)
        return
      }

      // 驗證所有檔案
      const validFiles: File[] = []
      for (const file of files) {
        const error = validateFile(file)
        if (error) {
          onUploadError?.(error)
          return
        }
        validFiles.push(file)
      }

      // 建立預覽
      const newImages: UploadedImage[] = validFiles.map((file, index) => ({
        id: `temp-${Date.now()}-${index}`,
        file,
        preview: URL.createObjectURL(file),
        position: images.length + index,
      }))

      setImages(prev => [...prev, ...newImages])
      onFilesSelected?.(validFiles)
      onUploadSuccess?.(newImages)
    },
    [images.length, maxFiles, validateFile, onFilesSelected, onUploadSuccess, onUploadError]
  )

  const handleDelete = useCallback(
    (imageToDelete: UploadedImage) => {
      // 清理預覽 URL
      if (imageToDelete.preview) {
        URL.revokeObjectURL(imageToDelete.preview)
      }

      setImages(prev => prev.filter(img => img.id !== imageToDelete.id))
      onDeleteSuccess?.(imageToDelete)
    },
    [onDeleteSuccess]
  )

  // 排序功能（保留供未來使用）
  // const handleReorder = useCallback((dragIndex: number, hoverIndex: number) => {
  //   setImages(prev => {
  //     const newImages = [...prev]
  //     const [draggedImage] = newImages.splice(dragIndex, 1)
  //     newImages.splice(hoverIndex, 0, draggedImage)
  //     return newImages.map((img, idx) => ({ ...img, position: idx }))
  //   })
  // }, [])

  const canAddMore = images.length < maxFiles

  return (
    <div className={cn('space-y-4', className)}>
      {/* 上傳區域 */}
      {canAddMore && (
        <UploadArea
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          allowMultiple={allowMultiple}
          maxFiles={maxFiles}
          acceptedTypes={acceptedTypes}
          onFileSelect={handleFileSelect}
        />
      )}

      {/* 已上傳圖片預覽 */}
      {images.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            已選擇 {images.length} / {maxFiles} 張圖片
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((image, index) => (
              <div
                key={image.id}
                className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
              >
                <img
                  src={image.preview || image.storage_url || image.url}
                  alt={image.alt || `圖片 ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* 拖曳手柄和刪除按鈕 */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    className="p-2 bg-white rounded-full text-gray-600 hover:text-gray-800 cursor-grab"
                    title="拖曳排序"
                    onMouseDown={() => {
                      // TODO: 實作拖曳排序
                    }}
                  >
                    <GripVertical className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(image)}
                    className="p-2 bg-white rounded-full text-red-600 hover:text-red-700"
                    title="刪除"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* 位置標示 */}
                <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  {index + 1}
                </div>

                {/* 主圖標示 */}
                {index === 0 && (
                  <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                    主圖
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
