/**
 * 觀光果園頁面 (Server Component + ISR)
 *
 * 使用 ISR（增量靜態再生）優化：
 * - revalidate: 3600 秒（1 小時）重新驗證
 * - 靜態配置資料（facilities、faqs）在伺服器端載入
 * - 首屏快速載入預渲染 HTML
 *
 * 客戶端互動邏輯由 FarmToursPageClient 處理
 */

import { FarmToursPageClient } from './FarmToursPageClient'
// 靜態配置資料（網站內容，非動態 API 資料）
import {
  facilities,
  faqs,
  visitInfo,
  visitNotes,
} from '@/config/farm-tour.config'

// ISR 配置：每 1 小時重新驗證
export const revalidate = 3600

export default function FarmToursPage() {
  return (
    <FarmToursPageClient
      facilities={facilities}
      faqs={faqs}
      visitInfo={visitInfo}
      visitNotes={visitNotes}
    />
  )
}
