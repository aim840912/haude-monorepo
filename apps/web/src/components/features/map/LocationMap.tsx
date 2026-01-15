'use client'

import dynamic from 'next/dynamic'
import type { LocationMapClientProps } from './LocationMapClient'

// 動態導入 Leaflet 元件，禁用 SSR
const LocationMapClient = dynamic(
  () => import('./LocationMapClient').then((mod) => mod.LocationMapClient),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">
        <div className="text-gray-400">載入地圖中...</div>
      </div>
    ),
  }
)

/**
 * 據點地圖元件
 *
 * 使用動態導入來避免 Leaflet 的 SSR 問題
 * 適用於：
 * - 據點列表頁面的地圖視圖
 * - 據點詳情頁的單點地圖
 * - 附近據點功能
 */
export function LocationMap(props: LocationMapClientProps) {
  return <LocationMapClient {...props} />
}
