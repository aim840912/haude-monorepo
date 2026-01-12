'use client'

import { useRouter } from 'next/navigation'
import { LocationList } from '@/components/features/location'
import { PageHeader } from '@/components/ui/sections'

/**
 * 地點列表頁
 *
 * 功能：
 * - 顯示所有販售地點
 * - 點擊查看詳情
 */
export default function LocationsPage() {
  const router = useRouter()

  const handleLocationClick = (locationId: string) => {
    router.push(`/locations/${locationId}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="販售據點" subtitle="找到離您最近的販售地點" />

      {/* 主要內容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LocationList onLocationClick={handleLocationClick} />
      </div>
    </div>
  )
}
