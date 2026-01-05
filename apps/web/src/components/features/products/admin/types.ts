/**
 * Admin 產品篩選和表格的型別定義
 */

/**
 * 管理員產品篩選狀態
 */
export interface AdminFilterState {
  /** 搜尋關鍵字 */
  search: string
  /** 篩選的產品類別 */
  categories: string[]
  /** 庫存狀態篩選 */
  availability: 'all' | 'in_stock' | 'out_of_stock'
  /** 上架狀態篩選 */
  status: 'all' | 'active' | 'inactive'
  /** 價格區間 */
  priceRange: {
    min: number
    max: number
  }
  /** 排序方式 */
  sortBy:
    | 'name'
    | 'price_low'
    | 'price_high'
    | 'category'
    | 'inventory'
    | 'created_desc'
    | 'created_asc'
}

/**
 * AdminProductFilter 元件的 props
 */
export interface AdminProductFilterProps {
  /** 篩選條件變更時的回調函數 */
  onFilterChange: (filters: AdminFilterState) => void
  /** 可用的產品類別列表 */
  availableCategories: string[]
  /** 當前顯示的產品數量 */
  productCount?: number
  /** 總產品數量 */
  totalCount?: number
  /** 載入狀態 */
  loading?: boolean
}

/**
 * AdminProductsTable 元件的 props
 */
export interface AdminProductsTableProps {
  /** 刪除產品回調 */
  onDelete?: (id: string) => void
  /** 切換上架狀態回調 */
  onToggleActive?: (id: string, isActive: boolean) => void
  /** 編輯產品回調 */
  onEdit?: (id: string) => void
  /** 刷新觸發器 */
  refreshTrigger?: number
}

/**
 * 預設篩選狀態
 */
export const DEFAULT_ADMIN_FILTERS: AdminFilterState = {
  search: '',
  categories: [],
  availability: 'all',
  status: 'all',
  priceRange: { min: 0, max: 10000 },
  sortBy: 'created_desc',
}
