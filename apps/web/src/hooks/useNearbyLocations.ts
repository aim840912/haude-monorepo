import { useState, useEffect, useCallback } from 'react'
import type { Location } from '@/types/location'

interface GeoPosition {
  lat: number
  lng: number
}

interface UseNearbyLocationsOptions {
  /** 搜尋半徑（公里），預設 10 */
  radiusKm?: number
  /** 是否自動取得位置，預設 false */
  autoGetLocation?: boolean
}

interface UseNearbyLocationsReturn {
  /** 附近的據點列表（按距離排序） */
  nearbyLocations: (Location & { distance: number })[]
  /** 使用者當前位置 */
  userPosition: GeoPosition | null
  /** 是否正在取得位置 */
  isLoadingPosition: boolean
  /** 錯誤訊息 */
  error: string | null
  /** 手動取得位置 */
  requestLocation: () => void
  /** 清除位置 */
  clearLocation: () => void
}

/**
 * 計算兩點之間的距離（公里）
 * 使用 Haversine 公式
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // 地球半徑（公里）
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * GPS 附近據點搜尋 Hook
 *
 * 提供基於使用者位置的附近據點搜尋功能
 *
 * @example
 * ```tsx
 * const { nearbyLocations, requestLocation, isLoadingPosition } = useNearbyLocations({
 *   locations: allLocations,
 *   radiusKm: 20,
 * })
 *
 * // 使用者點擊「搜尋附近」按鈕
 * <button onClick={requestLocation} disabled={isLoadingPosition}>
 *   搜尋附近據點
 * </button>
 * ```
 */
export function useNearbyLocations(
  locations: Location[],
  options: UseNearbyLocationsOptions = {}
): UseNearbyLocationsReturn {
  const { radiusKm = 10, autoGetLocation = false } = options

  const [userPosition, setUserPosition] = useState<GeoPosition | null>(null)
  const [isLoadingPosition, setIsLoadingPosition] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('您的瀏覽器不支援定位功能')
      return
    }

    setIsLoadingPosition(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setIsLoadingPosition(false)
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('您已拒絕位置存取權限，請在瀏覽器設定中允許')
            break
          case err.POSITION_UNAVAILABLE:
            setError('無法取得您的位置資訊')
            break
          case err.TIMEOUT:
            setError('取得位置逾時，請重試')
            break
          default:
            setError('取得位置時發生錯誤')
        }
        setIsLoadingPosition(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000, // 快取 1 分鐘
      }
    )
  }, [])

  const clearLocation = useCallback(() => {
    setUserPosition(null)
    setError(null)
  }, [])

  // 自動取得位置
  useEffect(() => {
    if (autoGetLocation) {
      requestLocation()
    }
  }, [autoGetLocation, requestLocation])

  // 計算附近據點
  const nearbyLocations = userPosition
    ? locations
        .filter((loc) => loc.coordinates?.lat != null && loc.coordinates?.lng != null)
        .map((loc) => ({
          ...loc,
          distance: calculateDistance(
            userPosition.lat,
            userPosition.lng,
            loc.coordinates!.lat,
            loc.coordinates!.lng
          ),
        }))
        .filter((loc) => loc.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance)
    : []

  return {
    nearbyLocations,
    userPosition,
    isLoadingPosition,
    error,
    requestLocation,
    clearLocation,
  }
}
