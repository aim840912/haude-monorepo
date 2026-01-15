'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { List, Map as MapIcon, Navigation, Loader2 } from 'lucide-react'
import { LocationList } from '@/components/features/location'
import { LocationMap } from '@/components/features/map'
import { Breadcrumb } from '@/components/ui/navigation'
import { useLocations } from '@/hooks/useLocations'
import { useNearbyLocations } from '@/hooks/useNearbyLocations'
import type { Location } from '@/types/location'

type ViewMode = 'list' | 'map'

/**
 * 地點列表頁
 *
 * 功能：
 * - 列表/地圖視圖切換
 * - GPS 附近據點搜尋
 * - 點擊查看詳情
 */
export default function LocationsPage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const { locations, isLoading } = useLocations()

  // GPS 附近搜尋
  const {
    nearbyLocations,
    userPosition,
    isLoadingPosition,
    error: locationError,
    requestLocation,
    clearLocation,
  } = useNearbyLocations(locations, { radiusKm: 20 })

  const handleLocationClick = useCallback(
    (locationId: string) => {
      router.push(`/locations/${locationId}`)
    },
    [router]
  )

  const handleLocationSelect = useCallback((location: Location) => {
    setSelectedLocation(location)
  }, [])

  // 決定要顯示的據點列表
  const displayLocations = userPosition ? nearbyLocations : locations

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: '販售據點' }]} className="mb-6" />

        {/* 標題和控制列 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">販售據點</h1>
            {userPosition && (
              <p className="text-sm text-gray-500 mt-1">
                顯示 20 公里內的 {nearbyLocations.length} 個據點
                <button
                  onClick={clearLocation}
                  className="ml-2 text-green-600 hover:underline"
                >
                  顯示全部
                </button>
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* GPS 附近搜尋按鈕 */}
            <button
              onClick={requestLocation}
              disabled={isLoadingPosition}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                transition-colors ${
                  userPosition
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
            >
              {isLoadingPosition ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Navigation className="w-4 h-4" />
              )}
              {userPosition ? '已定位' : '搜尋附近'}
            </button>

            {/* 視圖切換 */}
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors
                  ${
                    viewMode === 'list'
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">列表</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors
                  ${
                    viewMode === 'map'
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <MapIcon className="w-4 h-4" />
                <span className="hidden sm:inline">地圖</span>
              </button>
            </div>
          </div>
        </div>

        {/* 錯誤提示 */}
        {locationError && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
            {locationError}
          </div>
        )}

        {/* 內容區域 */}
        {viewMode === 'list' ? (
          <LocationList onLocationClick={handleLocationClick} />
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* 地圖視圖 */}
            <div className="h-[500px] lg:h-[600px]">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                </div>
              ) : (
                <LocationMap
                  locations={displayLocations}
                  selectedLocation={selectedLocation}
                  onLocationSelect={handleLocationSelect}
                  center={
                    userPosition
                      ? [userPosition.lat, userPosition.lng]
                      : null
                  }
                />
              )}
            </div>

            {/* 選中據點資訊卡 */}
            {selectedLocation && (
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">
                      {selectedLocation.name}
                    </h3>
                    {selectedLocation.address && (
                      <p className="text-gray-600 text-sm mt-1">
                        {selectedLocation.address}
                      </p>
                    )}
                    {'distance' in selectedLocation && (
                      <p className="text-green-600 text-sm mt-1">
                        距離約 {(selectedLocation as Location & { distance: number }).distance.toFixed(1)} 公里
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleLocationClick(selectedLocation.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg
                      hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    查看詳情
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
