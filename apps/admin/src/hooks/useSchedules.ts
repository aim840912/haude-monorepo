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

export interface UpdateScheduleData {
  title?: string
  location?: string
  date?: string
  time?: string
  status?: 'upcoming' | 'ongoing' | 'completed'
  products?: string[]
  description?: string
  contact?: string
  specialOffer?: string
  weatherNote?: string
}

interface UseSchedulesReturn {
  schedules: Schedule[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  updateSchedule: (id: string, data: UpdateScheduleData) => Promise<boolean>
  deleteSchedule: (id: string) => Promise<boolean>
  isUpdating: boolean
  isDeleting: boolean
}

export function useSchedules(): UseSchedulesReturn {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchSchedules = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // 使用管理員 API 取得所有行程
      const { data } = await schedulesApi.getAllAdmin()
      setSchedules(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : '載入擺攤行程失敗'
      setError(message)
      console.error('[useSchedules] API 錯誤:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateSchedule = useCallback(async (id: string, data: UpdateScheduleData): Promise<boolean> => {
    setIsUpdating(true)
    try {
      await schedulesApi.update(id, data)
      await fetchSchedules()
      return true
    } catch (err) {
      console.error('[useSchedules] 更新失敗:', err)
      return false
    } finally {
      setIsUpdating(false)
    }
  }, [fetchSchedules])

  const deleteSchedule = useCallback(async (id: string): Promise<boolean> => {
    setIsDeleting(true)
    try {
      await schedulesApi.delete(id)
      await fetchSchedules()
      return true
    } catch (err) {
      console.error('[useSchedules] 刪除失敗:', err)
      return false
    } finally {
      setIsDeleting(false)
    }
  }, [fetchSchedules])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  return {
    schedules,
    isLoading,
    error,
    refetch: fetchSchedules,
    updateSchedule,
    deleteSchedule,
    isUpdating,
    isDeleting,
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
