/**
 * 產品相關型別 - 前後端共用
 */

export interface ProductImage {
  id: string
  entityId?: string
  productId?: string
  storageUrl: string
  filePath?: string
  altText?: string | null
  displayPosition?: number
  size?: 'thumbnail' | 'medium' | 'large'
  width?: number | null
  height?: number | null
  fileSize?: number | null
  createdAt?: string
  updatedAt?: string
  module?: string
}

export interface Product {
  id: string
  name: string
  description: string
  category: string
  price: number
  priceUnit?: string
  unitQuantity?: number
  originalPrice?: number
  isOnSale?: boolean
  saleEndDate?: string
  stock: number
  reservedStock?: number
  availableStock?: number
  isActive: boolean
  isDraft?: boolean
  createdAt: string
  updatedAt: string
  images: ProductImage[]
}

export interface CreateProductData {
  name: string
  description: string
  category: string
  price: number
  priceUnit?: string
  unitQuantity?: number
  originalPrice?: number
  isOnSale?: boolean
  saleEndDate?: string
  stock: number
  isActive: boolean
}

export interface UpdateProductData {
  name?: string
  description?: string
  category?: string
  price?: number
  priceUnit?: string
  unitQuantity?: number
  originalPrice?: number
  isOnSale?: boolean
  saleEndDate?: string
  stock?: number
  isActive?: boolean
  isDraft?: boolean
}

export interface InventoryStatus {
  stock: number
  reserved: number
  available: number
  canPurchase: boolean
  reservedPercentage?: number
}
