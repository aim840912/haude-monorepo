import { useState, useEffect, useCallback } from 'react'
import { farmToursApi } from '../services/api'

export interface FarmTour {
  id: string
  name: string
  description: string
  date: string
  startTime: string
  endTime: string
  price: number
  maxParticipants: number
  currentParticipants: number
  location: string
  imageUrl?: string
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  type: 'harvest' | 'workshop' | 'tour' | 'tasting'
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export interface UpdateFarmTourData {
  name?: string
  description?: string
  date?: string
  startTime?: string
  endTime?: string
  price?: number
  maxParticipants?: number
  location?: string
  imageUrl?: string
  status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  type?: 'harvest' | 'workshop' | 'tour' | 'tasting'
  tags?: string[]
}

interface UseFarmToursReturn {
  farmTours: FarmTour[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  updateFarmTour: (id: string, data: UpdateFarmTourData) => Promise<boolean>
  deleteFarmTour: (id: string) => Promise<boolean>
  isUpdating: boolean
  isDeleting: boolean
}

export function useFarmTours(): UseFarmToursReturn {
  const [farmTours, setFarmTours] = useState<FarmTour[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchFarmTours = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // 使用管理員 API 取得所有活動
      const { data } = await farmToursApi.getAllAdmin()
      setFarmTours(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : '載入觀光果園活動失敗'
      setError(message)
      console.error('[useFarmTours] API 錯誤:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateFarmTour = useCallback(async (id: string, data: UpdateFarmTourData): Promise<boolean> => {
    setIsUpdating(true)
    try {
      await farmToursApi.update(id, data)
      await fetchFarmTours()
      return true
    } catch (err) {
      console.error('[useFarmTours] 更新失敗:', err)
      return false
    } finally {
      setIsUpdating(false)
    }
  }, [fetchFarmTours])

  const deleteFarmTour = useCallback(async (id: string): Promise<boolean> => {
    setIsDeleting(true)
    try {
      await farmToursApi.delete(id)
      await fetchFarmTours()
      return true
    } catch (err) {
      console.error('[useFarmTours] 刪除失敗:', err)
      return false
    } finally {
      setIsDeleting(false)
    }
  }, [fetchFarmTours])

  useEffect(() => {
    fetchFarmTours()
  }, [fetchFarmTours])

  return {
    farmTours,
    isLoading,
    error,
    refetch: fetchFarmTours,
    updateFarmTour,
    deleteFarmTour,
    isUpdating,
    isDeleting,
  }
}

interface UseFarmTourReturn {
  farmTour: FarmTour | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useFarmTour(tourId: string | undefined): UseFarmTourReturn {
  const [farmTour, setFarmTour] = useState<FarmTour | null>(null)
  const [isLoading, setIsLoading] = useState(!!tourId)
  const [error, setError] = useState<string | null>(null)

  const fetchFarmTour = useCallback(async () => {
    if (!tourId) return

    setIsLoading(true)
    setError(null)
    try {
      const { data } = await farmToursApi.getById(tourId)
      setFarmTour(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : '載入活動失敗'
      setError(message)
      console.error('[useFarmTour] API 錯誤:', err)
    } finally {
      setIsLoading(false)
    }
  }, [tourId])

  useEffect(() => {
    if (tourId) {
      fetchFarmTour()
    }
  }, [tourId, fetchFarmTour])

  return {
    farmTour,
    isLoading,
    error,
    refetch: fetchFarmTour,
  }
}
