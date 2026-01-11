import { useState, useEffect, useCallback } from 'react'
import { locationsApi } from '../services/api'
import logger from '../lib/logger'

export interface Location {
  id: string
  name: string
  title?: string
  address: string
  landmark?: string
  phone?: string
  lineId?: string
  hours?: string
  closedDays?: string
  parking?: string
  publicTransport?: string
  features: string[]
  specialties: string[]
  lat?: number
  lng?: number
  image?: string
  isMain: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface UpdateLocationData {
  name?: string
  title?: string
  address?: string
  landmark?: string
  phone?: string
  lineId?: string
  hours?: string
  closedDays?: string
  parking?: string
  publicTransport?: string
  features?: string[]
  specialties?: string[]
  lat?: number
  lng?: number
  image?: string
  isMain?: boolean
  isActive?: boolean
}

interface UseLocationsReturn {
  locations: Location[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  updateLocation: (id: string, data: UpdateLocationData) => Promise<boolean>
  deleteLocation: (id: string) => Promise<boolean>
  isUpdating: boolean
  isDeleting: boolean
}

export function useLocations(): UseLocationsReturn {
  const [locations, setLocations] = useState<Location[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchLocations = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await locationsApi.getAllAdmin()
      setLocations(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : '載入門市據點失敗'
      setError(message)
      logger.error('[useLocations] API 錯誤', { error: err })
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateLocation = useCallback(async (id: string, data: UpdateLocationData): Promise<boolean> => {
    setIsUpdating(true)
    try {
      await locationsApi.update(id, data)
      await fetchLocations()
      return true
    } catch (err) {
      logger.error('[useLocations] 更新失敗', { error: err })
      return false
    } finally {
      setIsUpdating(false)
    }
  }, [fetchLocations])

  const deleteLocation = useCallback(async (id: string): Promise<boolean> => {
    setIsDeleting(true)
    try {
      await locationsApi.delete(id)
      await fetchLocations()
      return true
    } catch (err) {
      logger.error('[useLocations] 刪除失敗', { error: err })
      return false
    } finally {
      setIsDeleting(false)
    }
  }, [fetchLocations])

  useEffect(() => {
    fetchLocations()
  }, [fetchLocations])

  return {
    locations,
    isLoading,
    error,
    refetch: fetchLocations,
    updateLocation,
    deleteLocation,
    isUpdating,
    isDeleting,
  }
}
