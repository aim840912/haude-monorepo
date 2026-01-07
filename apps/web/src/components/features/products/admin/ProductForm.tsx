import { useState, useCallback, useMemo } from 'react'
import { ArrowLeft, Save, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ImageUploader } from '../ImageUploader/ImageUploader'
import type { UploadedImage } from '../ImageUploader/types'
import type { CreateProductData, UpdateProductData } from '@/types/product'
import {
  type ProductFormProps,
  type ProductFormValues,
  type ProductFormErrors,
  DEFAULT_FORM_VALUES,
  PRODUCT_CATEGORIES,
  PRICE_UNITS,
} from './ProductForm.types'

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
  const getFieldError = (field: keyof ProductFormErrors) => {
    return touched.has(field) ? errors[field] : undefined
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 基本資訊區塊 */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">基本資訊</h2>
        <div className="space-y-4">
          {/* 產品名稱 */}
          <div>
            <label htmlFor="name" className="label">
              產品名稱 <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={values.name}
              onChange={e => setValue('name', e.target.value)}
              onBlur={() => setFieldTouched('name')}
              className={cn('input', getFieldError('name') && 'border-red-500')}
              placeholder="請輸入產品名稱"
            />
            {getFieldError('name') && (
              <p className="mt-1 text-sm text-red-500">{getFieldError('name')}</p>
            )}
          </div>

          {/* 類別選擇 */}
          <div>
            <label htmlFor="category" className="label">
              產品類別 <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              value={values.category}
              onChange={e => setValue('category', e.target.value)}
              onBlur={() => setFieldTouched('category')}
              className={cn('input', getFieldError('category') && 'border-red-500')}
            >
              <option value="">請選擇類別</option>
              {PRODUCT_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            {getFieldError('category') && (
              <p className="mt-1 text-sm text-red-500">{getFieldError('category')}</p>
            )}
          </div>

          {/* 產品描述 */}
          <div>
            <label htmlFor="description" className="label">
              產品描述
            </label>
            <textarea
              id="description"
              value={values.description}
              onChange={e => setValue('description', e.target.value)}
              className="input min-h-[100px]"
              placeholder="請輸入產品描述（選填）"
              rows={4}
            />
          </div>
        </div>
      </section>

      {/* 價格與庫存區塊 */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">價格與庫存</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 售價 */}
          <div>
            <label htmlFor="price" className="label">
              售價 (NT$) <span className="text-red-500">*</span>
            </label>
            <input
              id="price"
              type="number"
              value={values.price}
              onChange={e => setValue('price', e.target.value === '' ? '' : Number(e.target.value))}
              onBlur={() => setFieldTouched('price')}
              className={cn('input', getFieldError('price') && 'border-red-500')}
              placeholder="0"
              min="0"
              step="1"
            />
            {getFieldError('price') && (
              <p className="mt-1 text-sm text-red-500">{getFieldError('price')}</p>
            )}
          </div>

          {/* 庫存 */}
          <div>
            <label htmlFor="inventory" className="label">
              庫存數量 <span className="text-red-500">*</span>
            </label>
            <input
              id="inventory"
              type="number"
              value={values.inventory}
              onChange={e => setValue('inventory', e.target.value === '' ? '' : Number(e.target.value))}
              onBlur={() => setFieldTouched('inventory')}
              className={cn('input', getFieldError('inventory') && 'border-red-500')}
              placeholder="0"
              min="0"
              step="1"
            />
            {getFieldError('inventory') && (
              <p className="mt-1 text-sm text-red-500">{getFieldError('inventory')}</p>
            )}
          </div>

          {/* 價格單位 */}
          <div>
            <label htmlFor="priceUnit" className="label">
              價格單位
            </label>
            <select
              id="priceUnit"
              value={values.priceUnit}
              onChange={e => setValue('priceUnit', e.target.value)}
              className="input"
            >
              {PRICE_UNITS.map(unit => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </select>
          </div>

          {/* 單位數量 */}
          <div>
            <label htmlFor="unitQuantity" className="label">
              單位數量
            </label>
            <input
              id="unitQuantity"
              type="number"
              value={values.unitQuantity}
              onChange={e => setValue('unitQuantity', e.target.value === '' ? '' : Number(e.target.value))}
              className="input"
              placeholder="如: 600 (克)"
              min="0"
            />
          </div>
        </div>
      </section>

      {/* 促銷設定區塊 */}
      <section className="bg-white rounded-lg shadow-sm">
        <button
          type="button"
          onClick={() => setShowPromotion(!showPromotion)}
          className="w-full p-6 flex items-center justify-between text-left"
        >
          <h2 className="text-lg font-semibold text-gray-900">促銷設定</h2>
          {showPromotion ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {showPromotion && (
          <div className="px-6 pb-6 space-y-4 border-t border-gray-100 pt-4">
            {/* 促銷開關 */}
            <div className="flex items-center gap-3">
              <input
                id="isOnSale"
                type="checkbox"
                checked={values.isOnSale}
                onChange={e => setValue('isOnSale', e.target.checked)}
                className="w-4 h-4 text-primary-green border-gray-300 rounded focus:ring-primary-green"
              />
              <label htmlFor="isOnSale" className="text-sm font-medium text-gray-700">
                啟用促銷活動
              </label>
            </div>

            {values.isOnSale && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-7">
                {/* 原價 */}
                <div>
                  <label htmlFor="originalPrice" className="label">
                    原價 (NT$) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="originalPrice"
                    type="number"
                    value={values.originalPrice}
                    onChange={e => setValue('originalPrice', e.target.value === '' ? '' : Number(e.target.value))}
                    onBlur={() => setFieldTouched('originalPrice')}
                    className={cn('input', getFieldError('originalPrice') && 'border-red-500')}
                    placeholder="0"
                    min="0"
                    step="1"
                  />
                  {getFieldError('originalPrice') && (
                    <p className="mt-1 text-sm text-red-500">{getFieldError('originalPrice')}</p>
                  )}
                </div>

                {/* 促銷結束日期 */}
                <div>
                  <label htmlFor="saleEndDate" className="label">
                    促銷結束日期 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="saleEndDate"
                    type="date"
                    value={values.saleEndDate}
                    onChange={e => setValue('saleEndDate', e.target.value)}
                    onBlur={() => setFieldTouched('saleEndDate')}
                    className={cn('input', getFieldError('saleEndDate') && 'border-red-500')}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {getFieldError('saleEndDate') && (
                    <p className="mt-1 text-sm text-red-500">{getFieldError('saleEndDate')}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 圖片上傳區塊 */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">產品圖片</h2>
        <p className="text-sm text-gray-500 mb-4">
          上傳產品圖片，第一張將作為主圖顯示。支援 JPG、PNG、WebP 格式，單檔最大 10MB。
        </p>

        <ImageUploader
          maxFiles={5}
          allowMultiple
          onFilesSelected={handleFilesSelected}
          onDeleteSuccess={handleImageDelete}
          onUploadError={handleImageError}
        />

        {imageError && (
          <p className="mt-2 text-sm text-red-500">{imageError}</p>
        )}
      </section>

      {/* 上架狀態 */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">上架狀態</h2>
            <p className="text-sm text-gray-500">
              {values.isActive ? '產品已上架，顧客可以看到此產品' : '產品已下架，顧客無法看到此產品'}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={values.isActive}
              onChange={e => setValue('isActive', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
          </label>
        </div>
      </section>

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
