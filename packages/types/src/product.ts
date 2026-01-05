/**
 * 產品相關型別 - 前後端共用
 */

export interface ProductImage {
  id: string
  entity_id: string
  storage_url: string
  file_path: string
  alt_text?: string | null
  display_position: number
  size: 'thumbnail' | 'medium' | 'large'
  width?: number | null
  height?: number | null
  file_size?: number | null
  created_at: string
  updated_at: string
  module: string
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
  inventory: number
  reservedStock?: number
  availableStock?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  productImages: ProductImage[]
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
  inventory: number
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
  inventory?: number
  isActive?: boolean
}

export interface InventoryStatus {
  stock: number
  reserved: number
  available: number
  canPurchase: boolean
  reservedPercentage?: number
}
