import { useState, useCallback } from 'react'
import { Upload, X, Loader2, RefreshCw, Trash2 } from 'lucide-react'
import { siteSettingsApi } from '../services/api/site-settings.api'
import type { Locale } from '../pages/SiteImagesPage'
import logger from '../lib/logger'

const UPLOADER_TEXT = {
  zh: {
    recommended: '建議尺寸',
    updated: '已更新',
    deleteImage: '刪除圖片',
    uploading: '上傳中...',
    replaceHint: '點擊或拖曳以',
    replaceAction: '更換圖片',
    dragHint: '拖曳圖片至此，或',
    selectAction: '點擊選取',
    formatHint: 'JPG、PNG、WebP（最大 5MB）',
    invalidFormat: '僅接受 JPG、PNG、WebP 格式',
    fileTooLarge: '圖片大小不可超過 5MB',
    uploadFailed: '上傳失敗，請重試',
    confirmDelete: '確定要刪除這張圖片嗎？',
    deleteFailed: '刪除失敗，請重試',
  },
  en: {
    recommended: 'Recommended',
    updated: 'Updated',
    deleteImage: 'Delete image',
    uploading: 'Uploading...',
    replaceHint: 'Click or drag to ',
    replaceAction: 'replace image',
    dragHint: 'Drag image here, or ',
    selectAction: 'click to select',
    formatHint: 'JPG, PNG, WebP (max 5MB)',
    invalidFormat: 'Only JPG, PNG, WebP formats are accepted',
    fileTooLarge: 'Image size cannot exceed 5MB',
    uploadFailed: 'Upload failed, please try again',
    confirmDelete: 'Are you sure you want to delete this image?',
    deleteFailed: 'Delete failed, please try again',
  },
} as const

interface SiteImageUploaderProps {
  /** Setting key (e.g. 'home.hero_images') */
  settingKey: string
  /** Current image URL */
  currentUrl: string
  /** Label displayed above the uploader */
  label: string
  /** Optional description */
  description?: string
  /** Recommended dimensions text */
  dimensions?: string
  /** Display locale */
  locale?: Locale
  /** Callback when image is updated */
  onImageUpdated: (newUrl: string) => void
  /** Callback when image is deleted */
  onImageDeleted?: () => void
}

export function SiteImageUploader({
  settingKey,
  currentUrl,
  label,
  description,
  dimensions,
  locale = 'zh',
  onImageUpdated,
  onImageDeleted,
}: SiteImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const ut = UPLOADER_TEXT[locale]

  const handleUpload = useCallback(
    async (file: File) => {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!validTypes.includes(file.type)) {
        setError(ut.invalidFormat)
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(ut.fileTooLarge)
        return
      }

      setIsUploading(true)
      setError(null)

      try {
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

        // 3. Update setting value with new public URL
        await siteSettingsApi.upsert(settingKey, {
          value: uploadData.publicUrl,
          type: 'image',
        })

        // Update preview and notify parent
        setPreviewUrl(uploadData.publicUrl)
        onImageUpdated(uploadData.publicUrl)
      } catch (err) {
        logger.error('Site image upload error', { error: err, settingKey })
        setError(err instanceof Error ? err.message : ut.uploadFailed)
      } finally {
        setIsUploading(false)
      }
    },
    [settingKey, onImageUpdated, ut]
  )

  const handleDelete = useCallback(async () => {
    if (!confirm(ut.confirmDelete)) return

    setIsDeleting(true)
    setError(null)

    try {
      await siteSettingsApi.deleteImage(settingKey)
      setPreviewUrl(null)
      onImageDeleted?.()
    } catch (err) {
      logger.error('Site image delete error', { error: err, settingKey })
      setError(err instanceof Error ? err.message : ut.deleteFailed)
    } finally {
      setIsDeleting(false)
    }
  }, [settingKey, onImageDeleted, ut])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUpload(file)
      e.target.value = '' // Reset for re-selection
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  const displayUrl = previewUrl || currentUrl
  const inputId = `site-image-${settingKey.replace(/\./g, '-')}`

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white flex-shrink-0 w-80">
      {/* Header */}
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-gray-800">{label}</h4>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        {dimensions && (
          <p className="text-xs text-blue-600 mt-0.5">{ut.recommended}: {dimensions}</p>
        )}
      </div>

      {/* Current image preview */}
      {displayUrl && (
        <div className="mb-3 relative rounded-lg overflow-hidden bg-gray-100 max-h-48 group">
          <img
            src={displayUrl}
            alt={label}
            className="w-full h-48 object-cover"
            loading="lazy"
          />
          <div className="absolute top-2 right-2 flex items-center gap-1.5">
            {previewUrl && (
              <div className="bg-green-500 text-white text-xs px-2 py-0.5 rounded">
                {ut.updated}
              </div>
            )}
            <button
              onClick={handleDelete}
              disabled={isDeleting || isUploading}
              className="bg-red-500/80 hover:bg-red-600 text-white p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
              aria-label={`${ut.deleteImage} ${label}`}
              title={ut.deleteImage}
            >
              {isDeleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Upload area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-4 text-center transition-colors
          ${isUploading ? 'border-gray-300 bg-gray-50' : 'border-gray-300 hover:border-green-400 cursor-pointer'}
        `}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => !isUploading && document.getElementById(inputId)?.click()}
      >
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileSelect}
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="flex items-center justify-center gap-2 py-2">
            <Loader2 className="w-5 h-5 text-green-500 animate-spin" />
            <span className="text-sm text-gray-600">{ut.uploading}</span>
          </div>
        ) : displayUrl ? (
          <div className="flex items-center justify-center gap-2 py-1">
            <RefreshCw className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">
              {ut.replaceHint}<span className="text-green-600">{ut.replaceAction}</span>
            </span>
          </div>
        ) : (
          <div className="space-y-1 py-2">
            <Upload className="w-6 h-6 mx-auto text-gray-400" />
            <p className="text-sm text-gray-600">
              {ut.dragHint}<span className="text-green-600">{ut.selectAction}</span>
            </p>
            <p className="text-xs text-gray-400">{ut.formatHint}</p>
          </div>
        )}
      </div>

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
