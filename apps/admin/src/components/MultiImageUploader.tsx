import { useState, useCallback, useEffect } from 'react'
import { X, Loader2, Trash2, ChevronUp, ChevronDown, Plus } from 'lucide-react'
import { siteSettingsApi } from '../services/api/site-settings.api'
import type { Locale } from '../pages/SiteImagesPage'
import logger from '../lib/logger'

const TEXT = {
  zh: {
    recommended: '建議尺寸',
    addImage: '新增圖片',
    deleteImage: '刪除圖片',
    moveUp: '上移',
    moveDown: '下移',
    uploading: '上傳中...',
    saving: '儲存中...',
    dragHint: '拖曳圖片至此，或',
    selectAction: '點擊選取',
    formatHint: 'JPG、PNG、WebP（最大 5MB）',
    invalidFormat: '僅接受 JPG、PNG、WebP 格式',
    fileTooLarge: '圖片大小不可超過 5MB',
    uploadFailed: '上傳失敗，請重試',
    confirmDelete: '確定要刪除這張圖片嗎？',
    deleteFailed: '刪除失敗，請重試',
    saveFailed: '儲存失敗，請重試',
    imageSlot: (n: number, total: number) => `圖片 ${n} / ${total}`,
    maxReached: (n: number) => `已達上限 ${n} 張`,
  },
  en: {
    recommended: 'Recommended',
    addImage: 'Add image',
    deleteImage: 'Delete image',
    moveUp: 'Move up',
    moveDown: 'Move down',
    uploading: 'Uploading...',
    saving: 'Saving...',
    dragHint: 'Drag image here, or ',
    selectAction: 'click to select',
    formatHint: 'JPG, PNG, WebP (max 5MB)',
    invalidFormat: 'Only JPG, PNG, WebP formats are accepted',
    fileTooLarge: 'Image size cannot exceed 5MB',
    uploadFailed: 'Upload failed, please try again',
    confirmDelete: 'Are you sure you want to delete this image?',
    deleteFailed: 'Delete failed, please try again',
    saveFailed: 'Save failed, please try again',
    imageSlot: (n: number, total: number) => `Image ${n} / ${total}`,
    maxReached: (n: number) => `Max ${n} images reached`,
  },
} as const

/** Extract Supabase storage file path from a public URL */
function extractStoragePath(url: string): string | null {
  const match = url.match(/\/storage\/v1\/object\/public\/site-images\/(.+)$/)
  return match?.[1] ?? null
}

/** Parse a DB value (JSON array or single URL) into an array of URLs */
function parseImageValue(value: string): string[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) {
      return parsed.filter((url: unknown) => typeof url === 'string' && (url as string).length > 0)
    }
  } catch {
    // Not JSON — treat as single URL
  }
  return value ? [value] : []
}

interface MultiImageUploaderProps {
  /** Setting key (e.g. 'home.hero_images') */
  settingKey: string
  /** Current value from DB (JSON array string or single URL) */
  currentValue: string
  /** Label displayed above the uploader */
  label: string
  /** Optional description */
  description?: string
  /** Recommended dimensions text */
  dimensions?: string
  /** Maximum number of images allowed */
  maxImages: number
  /** Display locale */
  locale?: Locale
  /** Callback when images are updated (receives JSON array string) */
  onImagesUpdated: (newValue: string) => void
}

export function MultiImageUploader({
  settingKey,
  currentValue,
  label,
  description,
  dimensions,
  maxImages,
  locale = 'zh',
  onImagesUpdated,
}: MultiImageUploaderProps) {
  const [imageUrls, setImageUrls] = useState<string[]>(() => parseImageValue(currentValue))
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const t = TEXT[locale]

  // Sync with external currentValue changes
  useEffect(() => {
    setImageUrls(parseImageValue(currentValue))
  }, [currentValue])

  /** Save the entire URL array to DB */
  const saveToDb = useCallback(
    async (urls: string[]) => {
      setIsSaving(true)
      setError(null)
      try {
        const value = urls.length > 0 ? JSON.stringify(urls) : ''
        await siteSettingsApi.upsert(settingKey, {
          value,
          type: 'images_array',
        })
        onImagesUpdated(value)
      } catch (err) {
        logger.error('Failed to save multi-image setting', { error: err, settingKey })
        setError(t.saveFailed)
        throw err
      } finally {
        setIsSaving(false)
      }
    },
    [settingKey, onImagesUpdated, t.saveFailed]
  )

  /** Upload a file to a specific slot (add or replace) */
  const handleUpload = useCallback(
    async (file: File, slotIndex: number) => {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!validTypes.includes(file.type)) {
        setError(t.invalidFormat)
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(t.fileTooLarge)
        return
      }

      setUploadingIndex(slotIndex)
      setError(null)

      try {
        // If replacing an existing image, delete old file from storage
        const oldUrl = imageUrls[slotIndex]
        if (oldUrl) {
          const oldPath = extractStoragePath(oldUrl)
          if (oldPath) {
            await siteSettingsApi.deleteImageFile(oldPath).catch((err: unknown) => {
              logger.warn('Failed to delete old image file', { error: err })
            })
          }
        }

        // 1. Get pre-signed upload URL
        const { data: uploadData } = await siteSettingsApi.getImageUploadUrl(
          settingKey,
          file.name,
          file.type
        )

        // 2. Upload directly to Supabase Storage
        const uploadResponse = await fetch(uploadData.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        })

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.statusText}`)
        }

        // 3. Update local state and save to DB
        const newUrls = [...imageUrls]
        if (slotIndex < newUrls.length) {
          // Replace existing
          newUrls[slotIndex] = uploadData.publicUrl
        } else {
          // Add new
          newUrls.push(uploadData.publicUrl)
        }

        setImageUrls(newUrls)
        await saveToDb(newUrls)
      } catch (err) {
        logger.error('Multi-image upload error', { error: err, settingKey, slotIndex })
        setError(err instanceof Error ? err.message : t.uploadFailed)
      } finally {
        setUploadingIndex(null)
      }
    },
    [settingKey, imageUrls, saveToDb, t]
  )

  /** Delete an image at a specific index */
  const handleDelete = useCallback(
    async (index: number) => {
      if (!confirm(t.confirmDelete)) return

      setDeletingIndex(index)
      setError(null)

      try {
        const url = imageUrls[index]

        // Remove from array
        const newUrls = imageUrls.filter((_, i) => i !== index)
        setImageUrls(newUrls)

        // Save updated array to DB
        await saveToDb(newUrls)

        // Delete file from storage (non-blocking)
        const filePath = extractStoragePath(url)
        if (filePath) {
          await siteSettingsApi.deleteImageFile(filePath).catch((err: unknown) => {
            logger.warn('Failed to delete image file from storage', { error: err })
          })
        }
      } catch (err) {
        // Revert on save failure
        setImageUrls(parseImageValue(currentValue))
        logger.error('Multi-image delete error', { error: err, settingKey, index })
        setError(err instanceof Error ? err.message : t.deleteFailed)
      } finally {
        setDeletingIndex(null)
      }
    },
    [imageUrls, currentValue, settingKey, saveToDb, t]
  )

  /** Swap two images (for reorder) */
  const handleSwap = useCallback(
    async (indexA: number, indexB: number) => {
      if (indexB < 0 || indexB >= imageUrls.length) return

      setError(null)
      const newUrls = [...imageUrls]
      ;[newUrls[indexA], newUrls[indexB]] = [newUrls[indexB], newUrls[indexA]]
      setImageUrls(newUrls)

      try {
        await saveToDb(newUrls)
      } catch {
        // Revert on failure
        setImageUrls(parseImageValue(currentValue))
      }
    },
    [imageUrls, currentValue, saveToDb]
  )

  const handleFileSelect = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUpload(file, index)
      e.target.value = '' // Reset for re-selection
    }
  }

  const handleDrop = (index: number) => (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file, index)
  }

  const canAddMore = imageUrls.length < maxImages
  const isDisabled = uploadingIndex !== null || deletingIndex !== null || isSaving

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      {/* Header */}
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-gray-800">{label}</h4>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        {dimensions && (
          <p className="text-xs text-blue-600 mt-0.5">{t.recommended}: {dimensions}</p>
        )}
        <p className="text-xs text-gray-400 mt-0.5">
          {imageUrls.length > 0
            ? t.imageSlot(imageUrls.length, maxImages)
            : t.imageSlot(0, maxImages)}
        </p>
      </div>

      {/* Image slots */}
      <div className="space-y-3">
        {imageUrls.map((url, index) => {
          const inputId = `multi-img-${settingKey.replace(/\./g, '-')}-${index}`
          const isThisUploading = uploadingIndex === index
          const isThisDeleting = deletingIndex === index

          return (
            <div
              key={`${url}-${index}`}
              className="relative rounded-lg overflow-hidden bg-gray-100 group"
            >
              {/* Image preview */}
              <img
                src={url}
                alt={`${label} ${index + 1}`}
                className="w-full h-40 object-cover"
                loading="lazy"
              />

              {/* Overlay controls */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Move up */}
                {index > 0 && (
                  <button
                    onClick={() => handleSwap(index, index - 1)}
                    disabled={isDisabled}
                    className="bg-white/90 hover:bg-white text-gray-700 p-1.5 rounded shadow-sm disabled:opacity-50"
                    aria-label={t.moveUp}
                    title={t.moveUp}
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Move down */}
                {index < imageUrls.length - 1 && (
                  <button
                    onClick={() => handleSwap(index, index + 1)}
                    disabled={isDisabled}
                    className="bg-white/90 hover:bg-white text-gray-700 p-1.5 rounded shadow-sm disabled:opacity-50"
                    aria-label={t.moveDown}
                    title={t.moveDown}
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Delete */}
                <button
                  onClick={() => handleDelete(index)}
                  disabled={isDisabled}
                  className="bg-red-500/80 hover:bg-red-600 text-white p-1.5 rounded shadow-sm disabled:opacity-50"
                  aria-label={`${t.deleteImage} ${index + 1}`}
                  title={t.deleteImage}
                >
                  {isThisDeleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Replace overlay (click to replace) */}
              <label
                htmlFor={inputId}
                className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-1.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {isThisUploading ? t.uploading : `${t.selectAction}`}
              </label>
              <input
                id={inputId}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileSelect(index)}
                disabled={isDisabled}
              />

              {/* Upload spinner overlay */}
              {isThisUploading && (
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
                </div>
              )}
            </div>
          )
        })}

        {/* Add new image slot */}
        {canAddMore && (
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-4 text-center transition-colors
              ${isDisabled ? 'border-gray-200 bg-gray-50 cursor-not-allowed' : 'border-gray-300 hover:border-green-400 cursor-pointer'}
            `}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop(imageUrls.length)}
            onClick={() => {
              if (!isDisabled) {
                document.getElementById(`multi-img-${settingKey.replace(/\./g, '-')}-new`)?.click()
              }
            }}
          >
            <input
              id={`multi-img-${settingKey.replace(/\./g, '-')}-new`}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileSelect(imageUrls.length)}
              disabled={isDisabled}
            />

            {uploadingIndex === imageUrls.length ? (
              <div className="flex items-center justify-center gap-2 py-2">
                <Loader2 className="w-5 h-5 text-green-500 animate-spin" />
                <span className="text-sm text-gray-600">{t.uploading}</span>
              </div>
            ) : (
              <div className="space-y-1 py-2">
                <Plus className="w-6 h-6 mx-auto text-gray-400" />
                <p className="text-sm text-gray-600">
                  {t.dragHint}<span className="text-green-600">{t.selectAction}</span>
                </p>
                <p className="text-xs text-gray-400">{t.formatHint}</p>
              </div>
            )}
          </div>
        )}

        {/* Max reached hint */}
        {!canAddMore && (
          <p className="text-xs text-amber-600 text-center">{t.maxReached(maxImages)}</p>
        )}
      </div>

      {/* Saving indicator */}
      {isSaving && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-600">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>{t.saving}</span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Setting key (for reference) */}
      <p className="mt-2 text-xs text-gray-400 font-mono">{settingKey}</p>
    </div>
  )
}
