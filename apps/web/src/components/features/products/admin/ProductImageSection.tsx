import { ImageUploader } from '../ImageUploader/ImageUploader'
import type { UploadedImage } from '../ImageUploader/types'

interface ProductImageSectionProps {
  onFilesSelected: (files: File[]) => void
  onDeleteSuccess: (image: UploadedImage) => void
  onUploadError: (error: string) => void
  imageError: string | null
}

/**
 * 產品圖片上傳區塊
 */
export function ProductImageSection({
  onFilesSelected,
  onDeleteSuccess,
  onUploadError,
  imageError,
}: ProductImageSectionProps) {
  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">產品圖片</h2>
      <p className="text-sm text-gray-500 mb-4">
        上傳產品圖片，第一張將作為主圖顯示。支援 JPG、PNG、WebP 格式，單檔最大 10MB。
      </p>

      <ImageUploader
        maxFiles={5}
        allowMultiple
        onFilesSelected={onFilesSelected}
        onDeleteSuccess={onDeleteSuccess}
        onUploadError={onUploadError}
      />

      {imageError && (
        <p className="mt-2 text-sm text-red-500">{imageError}</p>
      )}
    </section>
  )
}
