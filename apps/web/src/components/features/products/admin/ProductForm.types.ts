import type { Product, CreateProductData, UpdateProductData } from '@haude/types'

/**
 * 產品表單欄位值
 * 數值欄位使用 number | '' 以支援空值狀態
 */
export interface ProductFormValues {
  name: string
  description: string
  category: string
  price: number | ''
  priceUnit: string
  unitQuantity: number | ''
  originalPrice: number | ''
  isOnSale: boolean
  saleEndDate: string
  stock: number | ''
  isActive: boolean
}

/**
 * 表單欄位錯誤訊息
 */
export interface ProductFormErrors {
  name?: string
  description?: string
  category?: string
  price?: string
  priceUnit?: string
  unitQuantity?: string
  originalPrice?: string
  saleEndDate?: string
  stock?: string
}

/**
 * ProductForm 元件 Props
 */
export interface ProductFormProps {
  /** 表單模式：新增或編輯 */
  mode: 'create' | 'edit'
  /** 編輯模式時的初始資料 */
  initialData?: Product
  /** 表單提交回調 */
  onSubmit: (
    data: CreateProductData | UpdateProductData,
    images: File[]
  ) => Promise<void>
  /** 取消回調 */
  onCancel: () => void
  /** 是否正在提交中 */
  isSubmitting?: boolean
}

/**
 * 預設表單值
 */
export const DEFAULT_FORM_VALUES: ProductFormValues = {
  name: '',
  description: '',
  category: '',
  price: '',
  priceUnit: '',
  unitQuantity: '',
  originalPrice: '',
  isOnSale: false,
  saleEndDate: '',
  stock: '',
  isActive: true,
}

/**
 * 產品類別選項
 */
export const PRODUCT_CATEGORIES = [
  { value: '蜂蜜', label: '蜂蜜' },
  { value: '茶葉', label: '茶葉' },
  { value: '農產品', label: '農產品' },
  { value: '手工藝品', label: '手工藝品' },
] as const

/**
 * 價格單位選項
 */
export const PRICE_UNITS = [
  { value: '', label: '無' },
  { value: '斤', label: '斤' },
  { value: '盒', label: '盒' },
  { value: '罐', label: '罐' },
  { value: '包', label: '包' },
  { value: '瓶', label: '瓶' },
] as const

/**
 * 表單區塊共用 Props
 */
export interface FormSectionProps {
  values: ProductFormValues
  setValue: <K extends keyof ProductFormValues>(field: K, value: ProductFormValues[K]) => void
  setFieldTouched: (field: string) => void
  getFieldError: (field: keyof ProductFormErrors) => string | undefined
}
