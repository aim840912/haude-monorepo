import { useState, useCallback, useMemo } from 'react'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import type { UploadedImage } from '../ImageUploader/types'
import type { CreateProductData, UpdateProductData } from '@/types/product'
import {
  type ProductFormProps,
  type ProductFormValues,
  type ProductFormErrors,
  DEFAULT_FORM_VALUES,
} from './ProductForm.types'
import { ProductBasicInfoSection } from './ProductBasicInfoSection'
import { ProductPricingSection } from './ProductPricingSection'
import { ProductPromotionSection } from './ProductPromotionSection'
import { ProductImageSection } from './ProductImageSection'
import { ProductStatusSection } from './ProductStatusSection'

/**
 * 產品表單元件
 *
 * 支援新增和編輯兩種模式：
 * - create: 建立新產品
 * - edit: 編輯現有產品
 */
export function ProductForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ProductFormProps) {
  // 表單值
  const [values, setValues] = useState<ProductFormValues>(() => {
    if (mode === 'edit' && initialData) {
      return {
        name: initialData.name,
        description: initialData.description || '',
        category: initialData.category,
        price: initialData.price,
        priceUnit: initialData.priceUnit || '',
        unitQuantity: initialData.unitQuantity ?? '',
        originalPrice: initialData.originalPrice ?? '',
        isOnSale: initialData.isOnSale ?? false,
        saleEndDate: initialData.saleEndDate ?? '',
        inventory: initialData.stock,
        isActive: initialData.isActive,
      }
    }
    return DEFAULT_FORM_VALUES
  })

  // 驗證錯誤
  const [errors, setErrors] = useState<ProductFormErrors>({})
  // 已觸碰的欄位
  const [touched, setTouched] = useState<Set<string>>(new Set())
  // 選擇的圖片檔案
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  // 促銷區塊展開狀態
  const [showPromotion, setShowPromotion] = useState(initialData?.isOnSale ?? false)
  // 圖片上傳錯誤
  const [imageError, setImageError] = useState<string | null>(null)

  // 更新欄位值
  const setValue = useCallback(
    <K extends keyof ProductFormValues>(field: K, value: ProductFormValues[K]) => {
      setValues(prev => ({ ...prev, [field]: value }))
      // 清除該欄位的錯誤
      if (errors[field as keyof ProductFormErrors]) {
        setErrors(prev => ({ ...prev, [field]: undefined }))
      }
    },
    [errors]
  )

  // 標記欄位為已觸碰
  const setFieldTouched = useCallback((field: string) => {
    setTouched(prev => new Set(prev).add(field))
  }, [])

  // 驗證邏輯
  const validate = useCallback((): ProductFormErrors => {
    const newErrors: ProductFormErrors = {}

    // 名稱驗證
    if (!values.name.trim()) {
      newErrors.name = '請輸入產品名稱'
    } else if (values.name.trim().length < 2) {
      newErrors.name = '產品名稱至少需要 2 個字元'
    }

    // 類別驗證
    if (!values.category) {
      newErrors.category = '請選擇產品類別'
    }

    // 價格驗證
    if (values.price === '' || values.price === undefined) {
      newErrors.price = '請輸入售價'
    } else if (Number(values.price) <= 0) {
      newErrors.price = '售價必須大於 0'
    }

    // 庫存驗證
    if (values.inventory === '' || values.inventory === undefined) {
      newErrors.inventory = '請輸入庫存數量'
    } else if (Number(values.inventory) < 0) {
      newErrors.inventory = '庫存不可為負數'
    }

    // 促銷驗證
    if (values.isOnSale) {
      if (!values.originalPrice || Number(values.originalPrice) <= 0) {
        newErrors.originalPrice = '請輸入原價'
      } else if (Number(values.originalPrice) <= Number(values.price)) {
        newErrors.originalPrice = '原價必須大於售價'
      }

      if (!values.saleEndDate) {
        newErrors.saleEndDate = '請選擇促銷結束日期'
      }
    }

    return newErrors
  }, [values])

  // 是否有錯誤
  const hasErrors = useMemo(() => {
    const currentErrors = validate()
    return Object.keys(currentErrors).length > 0
  }, [validate])

  // 處理提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 標記所有欄位為已觸碰
    const allFields = Object.keys(values) as (keyof ProductFormValues)[]
    setTouched(new Set(allFields))

    // 驗證
    const validationErrors = validate()
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    // 準備提交資料
    const submitData: CreateProductData | UpdateProductData = {
      name: values.name.trim(),
      description: values.description.trim(),
      category: values.category,
      price: Number(values.price),
      priceUnit: values.priceUnit || undefined,
      unitQuantity: values.unitQuantity ? Number(values.unitQuantity) : undefined,
      originalPrice: values.isOnSale && values.originalPrice
        ? Number(values.originalPrice)
        : undefined,
      isOnSale: values.isOnSale,
      saleEndDate: values.isOnSale ? values.saleEndDate : undefined,
      stock: Number(values.inventory), // 內部表單用 inventory，API 用 stock
      isActive: values.isActive,
    }

    await onSubmit(submitData, selectedImages)
  }

  // 處理圖片選擇
  const handleFilesSelected = useCallback((files: File[]) => {
    setSelectedImages(prev => [...prev, ...files])
    setImageError(null)
  }, [])

  // 處理圖片刪除
  const handleImageDelete = useCallback((deletedImage: UploadedImage) => {
    if (deletedImage.file) {
      setSelectedImages(prev => prev.filter(f => f !== deletedImage.file))
    }
  }, [])

  // 處理圖片錯誤
  const handleImageError = useCallback((error: string) => {
    setImageError(error)
  }, [])

  // 取得欄位錯誤（僅在已觸碰時顯示）
  const getFieldError = useCallback(
    (field: keyof ProductFormErrors) => {
      return touched.has(field) ? errors[field] : undefined
    },
    [touched, errors]
  )

  // 共用 props
  const sectionProps = {
    values,
    setValue,
    setFieldTouched,
    getFieldError,
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 基本資訊區塊 */}
      <ProductBasicInfoSection {...sectionProps} />

      {/* 價格與庫存區塊 */}
      <ProductPricingSection {...sectionProps} />

      {/* 促銷設定區塊 */}
      <ProductPromotionSection
        {...sectionProps}
        showPromotion={showPromotion}
        setShowPromotion={setShowPromotion}
      />

      {/* 圖片上傳區塊 */}
      <ProductImageSection
        onFilesSelected={handleFilesSelected}
        onDeleteSuccess={handleImageDelete}
        onUploadError={handleImageError}
        imageError={imageError}
      />

      {/* 上架狀態 */}
      <ProductStatusSection isActive={values.isActive} setValue={setValue} />

      {/* 操作按鈕 */}
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="btn btn-secondary order-2 sm:order-1"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          取消
        </button>
        <button
          type="submit"
          disabled={isSubmitting || hasErrors}
          className="btn btn-primary order-1 sm:order-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {mode === 'create' ? '建立中...' : '儲存中...'}
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {mode === 'create' ? '建立產品' : '儲存變更'}
            </>
          )}
        </button>
      </div>
    </form>
  )
}
