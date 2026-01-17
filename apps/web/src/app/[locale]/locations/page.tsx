/**
 * 販售據點頁面 (Server Component + ISR)
 *
 * 使用 ISR（增量靜態再生）優化：
 * - revalidate: 3600 秒（1 小時）重新驗證
 * - 首屏快速載入預渲染 HTML
 *
 * 客戶端互動邏輯由 LocationsPageClient 處理：
 * - 列表/地圖視圖切換
 * - GPS 附近據點搜尋
 */

import { LocationsPageClient } from './LocationsPageClient'

// ISR 配置：每 1 小時重新驗證
export const revalidate = 3600

export default function LocationsPage() {
  return <LocationsPageClient />
}
