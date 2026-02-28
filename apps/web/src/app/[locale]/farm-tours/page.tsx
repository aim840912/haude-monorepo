/**
 * 觀光果園頁面 (Server Component)
 *
 * 靜態配置資料（facilities、faqs）在伺服器端傳入，客戶端互動由 FarmToursPageClient 處理。
 */

import { FarmToursPageClient } from './FarmToursPageClient'
// 靜態配置資料（網站內容，非動態 API 資料）
import {
  facilities,
  faqs,
  visitInfo,
  visitNotes,
} from '@/config/farm-tour.config'

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
