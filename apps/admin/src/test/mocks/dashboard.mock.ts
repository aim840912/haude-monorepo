/**
 * Dashboard Mock 工廠
 *
 * 提供型別安全的儀表板資料 mock
 */

/**
 * 儀表板統計資料
 */
export interface DashboardStats {
  totalOrders: number
  totalRevenue: number
  totalProducts: number
  totalUsers: number
  pendingOrders: number
  lowStockProducts: number
}

/**
 * 建立 DashboardStats mock
 */
export function createMockDashboardStats(
  overrides: Partial<DashboardStats> = {}
): DashboardStats {
  return {
    totalOrders: 150,
    totalRevenue: 250000,
    totalProducts: 50,
    totalUsers: 200,
    pendingOrders: 10,
    lowStockProducts: 5,
    ...overrides,
  }
}

/**
 * 銷售趨勢資料點
 */
export interface SalesTrendPoint {
  date: string
  revenue: number
  orders: number
}

/**
 * 建立銷售趨勢 mock（最近 7 天）
 */
export function createMockSalesTrend(days: number = 7): SalesTrendPoint[] {
  const now = new Date()
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(now)
    date.setDate(date.getDate() - (days - 1 - i))
    return {
      date: date.toISOString().split('T')[0],
      revenue: Math.floor(Math.random() * 50000) + 10000,
      orders: Math.floor(Math.random() * 20) + 5,
    }
  })
}

/**
 * 熱銷產品
 */
export interface TopProduct {
  id: string
  name: string
  totalSold: number
  revenue: number
}

/**
 * 建立熱銷產品 mock
 */
export function createMockTopProducts(count: number = 5): TopProduct[] {
  const products = ['阿里山高山茶', '烏龍茶', '紅茶禮盒', '茶具組', '有機綠茶']
  return Array.from({ length: count }, (_, i) => ({
    id: `prod-${i + 1}`,
    name: products[i % products.length],
    totalSold: Math.floor(Math.random() * 100) + 10,
    revenue: Math.floor(Math.random() * 50000) + 5000,
  }))
}
