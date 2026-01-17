/**
 * 首頁 (Server Component + ISR)
 *
 * 使用 ISR（增量靜態再生）優化：
 * - revalidate: 1800 秒（30 分鐘）重新驗證
 * - 首屏快速載入預渲染 HTML
 * - SEO 友善
 *
 * 客戶端互動邏輯由 HomePageClient 處理
 */

import { HomePageClient } from './HomePageClient'

// ISR 配置：每 30 分鐘重新驗證
export const revalidate = 1800

export default function HomePage() {
  return <HomePageClient />
}
