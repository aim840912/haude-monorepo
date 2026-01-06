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

interface UseFarmToursReturn {
  farmTours: FarmTour[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useFarmTours(): UseFarmToursReturn {
  const [farmTours, setFarmTours] = useState<FarmTour[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFarmTours = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // 使用公開 API 取得所有活動
      const { data } = await farmToursApi.getAll()
      setFarmTours(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : '載入觀光果園活動失敗'
      setError(message)
      console.error('[useFarmTours] API 錯誤:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFarmTours()
  }, [fetchFarmTours])

  return {
    farmTours,
    isLoading,
    error,
    refetch: fetchFarmTours,
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
