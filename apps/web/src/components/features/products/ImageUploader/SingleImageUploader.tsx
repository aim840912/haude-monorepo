import { useState, useCallback, useRef } from 'react'
import { SafeImage } from '@/components/ui/SafeImage'
import { Upload, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SingleImageUploaderProps } from './types'

// 移到元件外部避免 useCallback 依賴問題
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return '不支援的檔案格式'
  }
  if (file.size > MAX_FILE_SIZE) {
    return '檔案過大（最大 10MB）'
  }
  return null
}

/**
 * 單圖片上傳器元件
 *
 * 用於單一圖片上傳場景，如頭像、封面圖等
 */
export function SingleImageUploader({
  onUploadSuccess,
  onUploadError,
  onDelete,
  onFileSelected,
  initialImage,
  className,
  enableDelete = true,
  isUploading = false,
}: SingleImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(initialImage || null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    (file: File) => {
      const error = validateFile(file)
      if (error) {
        onUploadError?.(error)
        return
      }

      const previewUrl = URL.createObjectURL(file)
      setPreview(previewUrl)
      onFileSelected?.(file)
      onUploadSuccess?.({
        id: `temp-${Date.now()}`,
        file,
        preview: previewUrl,
        position: 0,
      })
    },
    [onFileSelected, onUploadSuccess, onUploadError]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragActive(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const handleDelete = () => {
    if (preview && !initialImage) {
      URL.revokeObjectURL(preview)
    }
    setPreview(null)
    onDelete?.()
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={cn('relative', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleInputChange}
        className="hidden"
      />

      {preview ? (
        // 有圖片時顯示預覽
        <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
          <SafeImage src={preview} alt="預覽" fill className="object-cover" sizes="100vw" />

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={openFileDialog}
              className="p-2 bg-white rounded-full text-gray-600 hover:text-gray-800"
              title="更換圖片"
            >
              <Upload className="w-5 h-5" />
            </button>
            {enableDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-2 bg-white rounded-full text-red-600 hover:text-red-700"
                title="刪除"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Loading overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          )}
        </div>
      ) : (
        // 無圖片時顯示上傳區域
        <div
          className={cn(
            'aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors',
            dragActive ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400',
            isUploading && 'pointer-events-none opacity-50'
          )}
          onClick={openFileDialog}
          onDragEnter={e => {
            e.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={e => {
            e.preventDefault()
            setDragActive(false)
          }}
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">點擊或拖放上傳</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
