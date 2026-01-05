/**
 * 地點 Hooks
 */

import { useState, useEffect, useCallback } from 'react'
import { locationsApi } from '@/services/api'
import type { Location } from '@/types/location'

interface UseLocationsReturn {
  locations: Location[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * 取得所有地點
 */
export function useLocations(): UseLocationsReturn {
  const [locations, setLocations] = useState<Location[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLocations = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await locationsApi.getAll()
      setLocations(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入地點失敗')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLocations()
  }, [fetchLocations])

  return { locations, isLoading, error, refetch: fetchLocations }
}

interface UseLocationReturn {
  location: Location | null
  isLoading: boolean
  error: string | null
}

/**
 * 取得單一地點
 */
export function useLocation(locationId: string | undefined): UseLocationReturn {
  const [location, setLocation] = useState<Location | null>(null)
  const [isLoading, setIsLoading] = useState(!!locationId)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!locationId) return

    const fetchLocation = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const { data } = await locationsApi.getById(locationId)
        setLocation(data)
        if (!data) {
          setError('找不到指定的地點')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '載入失敗')
      } finally {
        setIsLoading(false)
      }
    }

    fetchLocation()
  }, [locationId])

  return { location, isLoading, error }
}

/**
 * 取得主要地點
 */
export function useMainLocation(): UseLocationReturn {
  const [location, setLocation] = useState<Location | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMainLocation = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const { data } = await locationsApi.getMain()
        setLocation(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '載入主要地點失敗')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMainLocation()
  }, [])

  return { location, isLoading, error }
}
