/**
 * 首頁 (Server Component)
 *
 * 客戶端互動邏輯由 HomePageClient 處理。
 * revalidate 已移除：此頁面沒有 server-side fetch，ISR 設定無效。
 */

import { HomePageClient } from './HomePageClient'

export default function HomePage() {
  return <HomePageClient />
}
