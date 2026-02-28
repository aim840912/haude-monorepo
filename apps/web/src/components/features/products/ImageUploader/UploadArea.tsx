import { useRef, useCallback, useState } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UploadAreaProps {
  /** 是否正在上傳 */
  isUploading?: boolean
  /** 上傳進度（0-100） */
  uploadProgress?: number
  /** 是否允許多選 */
  allowMultiple?: boolean
  /** 最大檔案數 */
  maxFiles?: number
  /** 接受的檔案類型 */
  acceptedTypes?: string[]
  /** 檔案選擇回調 */
  onFileSelect: (files: FileList | null) => void
  /** 自訂類名 */
  className?: string
}

/**
 * 上傳區域元件
 *
 * 支援拖放和點擊選擇檔案
 */
export function UploadArea({
  isUploading = false,
  uploadProgress = 0,
  allowMultiple = false,
  maxFiles = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  onFileSelect,
  className = '',
}: UploadAreaProps) {
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }, [])

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      onFileSelect(e.dataTransfer.files)
    },
    [onFileSelect]
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileSelect(e.target.files)
    e.target.value = ''
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div
      className={cn(
        'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors',
        dragActive ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400',
        isUploading && 'pointer-events-none opacity-50',
        className
      )}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple={allowMultiple}
        accept={acceptedTypes.join(',')}
        onChange={handleInputChange}
        className="hidden"
      />

      <div className="space-y-4">
        <div className="mx-auto w-12 h-12 text-gray-400">
          <Upload className="w-full h-full" />
        </div>

        <div>
          <p className="text-lg font-medium text-gray-900">
            {dragActive ? '放開以上傳圖片' : '拖放圖片到這裡'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            或者{' '}
            <button
              type="button"
              onClick={openFileDialog}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              點擊選擇檔案
            </button>
          </p>
          <p className="text-xs text-gray-400 mt-2">
            支援 JPEG、PNG、WebP 格式，單檔最大 10MB
            {allowMultiple && ` (最多 ${maxFiles} 個檔案)`}
          </p>
        </div>
      </div>

      {/* 上傳進度 */}
      {isUploading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-green-600" />
            <div className="mt-2 text-sm text-gray-600">
              上傳中... {Math.round(uploadProgress)}%
            </div>
            <div className="w-32 bg-gray-200 rounded-full h-2 mt-2 mx-auto">
              <div
                className="bg-green-600 h-2 rounded-full transition-[width] duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
