// 產品圖片結構 - API 回傳格式 (camelCase)
export interface ProductImage {
  id: string
  productId?: string // 產品 ID (API 回傳)
  storageUrl: string // 圖片 URL
  filePath?: string // 儲存路徑
  altText?: string | null // 替代文字
  displayPosition?: number // 排序位置
  size?: 'thumbnail' | 'medium' | 'large'
  createdAt?: string
  updatedAt?: string
}

// 產品主介面 - API 回傳格式
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
  stock: number // 實際庫存
  reservedStock?: number // 保留庫存（已確認但未完成的詢價單）
  availableStock?: number // 可用庫存 = stock - reservedStock
  isActive: boolean
  createdAt: string
  updatedAt: string
  images: ProductImage[] // 產品圖片
}

// 產品建立資料 (送給 API)
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
  stock: number // API 使用 stock
  isActive: boolean
}

// 產品更新資料 (送給 API)
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
  stock?: number // API 使用 stock
  isActive?: boolean
}

// 庫存狀態介面
export interface InventoryStatus {
  stock: number // 實際庫存
  reserved: number // 保留庫存
  available: number // 可用庫存 = stock - reserved
  canPurchase: boolean // 是否可購買
  reservedPercentage?: number // 保留比例（可選）
}

export interface ProductService {
  getProducts(): Promise<Product[]>
  getAllProducts?(): Promise<Product[]> // 管理員用：獲取所有產品（包含下架）
  addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>
  updateProduct(
    id: string,
    product: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Product>
  deleteProduct(id: string): Promise<void>
  getProductById(id: string): Promise<Product | null>
  searchProducts(query: string): Promise<Product[]>
  getInventoryStatus?(productId: string): Promise<InventoryStatus> // 獲取庫存狀態
}
