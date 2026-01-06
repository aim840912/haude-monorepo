import { useState, useEffect, useCallback } from 'react'
import { schedulesApi } from '../services/api'

export interface Schedule {
  id: string
  title: string
  location: string
  date: string
  time: string
  status: 'upcoming' | 'ongoing' | 'completed'
  products: string[]
  description: string
  contact: string
  specialOffer?: string
  weatherNote?: string
  createdAt: string
  updatedAt: string
}

interface UseSchedulesReturn {
  schedules: Schedule[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useSchedules(): UseSchedulesReturn {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSchedules = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // 使用公開 API 取得所有行程
      const { data } = await schedulesApi.getAll()
      setSchedules(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : '載入擺攤行程失敗'
      setError(message)
      console.error('[useSchedules] API 錯誤:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  return {
    schedules,
    isLoading,
    error,
    refetch: fetchSchedules,
  }
}

interface UseScheduleReturn {
  schedule: Schedule | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useSchedule(scheduleId: string | undefined): UseScheduleReturn {
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [isLoading, setIsLoading] = useState(!!scheduleId)
  const [error, setError] = useState<string | null>(null)

  const fetchSchedule = useCallback(async () => {
    if (!scheduleId) return

    setIsLoading(true)
    setError(null)
    try {
      const { data } = await schedulesApi.getById(scheduleId)
      setSchedule(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : '載入行程失敗'
      setError(message)
      console.error('[useSchedule] API 錯誤:', err)
    } finally {
      setIsLoading(false)
    }
  }, [scheduleId])

  useEffect(() => {
    if (scheduleId) {
      fetchSchedule()
    }
  }, [scheduleId, fetchSchedule])

  return {
    schedule,
    isLoading,
    error,
    refetch: fetchSchedule,
  }
}
