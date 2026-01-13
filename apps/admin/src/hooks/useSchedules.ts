import { useState, useEffect, useCallback } from 'react'
import { schedulesApi } from '../services/api'
import logger from '../lib/logger'

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

export interface CreateScheduleData {
  title: string
  location: string
  date: string
  time: string
  products?: string[]
  description?: string
  contact?: string
  specialOffer?: string
  weatherNote?: string
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
  createSchedule: (data: CreateScheduleData) => Promise<boolean>
  updateSchedule: (id: string, data: UpdateScheduleData) => Promise<boolean>
  deleteSchedule: (id: string) => Promise<boolean>
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
}

export function useSchedules(): UseSchedulesReturn {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
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
      logger.error('[useSchedules] API 錯誤', { error: err })
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createSchedule = useCallback(async (data: CreateScheduleData): Promise<boolean> => {
    setIsCreating(true)
    try {
      await schedulesApi.create({
        ...data,
        products: data.products ?? [],
        description: data.description ?? '',
        contact: data.contact ?? '',
      })
      await fetchSchedules()
      return true
    } catch (err) {
      logger.error('[useSchedules] 新增失敗', { error: err })
      return false
    } finally {
      setIsCreating(false)
    }
  }, [fetchSchedules])

  const updateSchedule = useCallback(async (id: string, data: UpdateScheduleData): Promise<boolean> => {
    setIsUpdating(true)
    try {
      await schedulesApi.update(id, data)
      await fetchSchedules()
      return true
    } catch (err) {
      logger.error('[useSchedules] 更新失敗', { error: err })
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
      logger.error('[useSchedules] 刪除失敗', { error: err })
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
    createSchedule,
    updateSchedule,
    deleteSchedule,
    isCreating,
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
      logger.error('[useSchedule] API 錯誤', { error: err })
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
