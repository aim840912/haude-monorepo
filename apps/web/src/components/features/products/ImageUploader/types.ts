/**
 * ImageUploader 型別定義
 */

export interface UploadedImage {
  id: string
  url?: string
  path?: string
  file?: File
  preview?: string
  storageUrl?: string
  position: number
  alt?: string
}

export interface ImageUploaderProps {
  /** 產品 ID（用於上傳路徑） */
  productId?: string
  /** 上傳成功回調 */
  onUploadSuccess?: (images: UploadedImage[]) => void
  /** 上傳錯誤回調 */
  onUploadError?: (error: string) => void
  /** 刪除成功回調 */
  onDeleteSuccess?: (deletedImage: UploadedImage) => void
  /** 檔案選擇回調（用於自定義上傳邏輯） */
  onFilesSelected?: (files: File[]) => void
  /** 最大檔案數 */
  maxFiles?: number
  /** 是否允許多選 */
  allowMultiple?: boolean
  /** 自訂類名 */
  className?: string
  /** 接受的檔案類型 */
  acceptedTypes?: string[]
  /** 最大檔案大小（bytes） */
  maxFileSize?: number
  /** 初始圖片 */
  initialImages?: UploadedImage[]
  /** 是否正在上傳 */
  isUploading?: boolean
  /** 上傳進度（0-100） */
  uploadProgress?: number
}

export interface SingleImageUploaderProps {
  /** 產品 ID */
  productId?: string
  /** 上傳成功回調 */
  onUploadSuccess?: (image: UploadedImage) => void
  /** 上傳錯誤回調 */
  onUploadError?: (error: string) => void
  /** 刪除回調 */
  onDelete?: () => void
  /** 檔案選擇回調 */
  onFileSelected?: (file: File) => void
  /** 初始圖片 URL */
  initialImage?: string
  /** 自訂類名 */
  className?: string
  /** 是否啟用刪除 */
  enableDelete?: boolean
  /** 是否正在上傳 */
  isUploading?: boolean
}
