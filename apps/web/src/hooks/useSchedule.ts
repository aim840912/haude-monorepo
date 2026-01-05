/**
 * 日程 Hooks
 */

import { useState, useEffect, useCallback } from 'react'
import { schedulesApi } from '@/services/api'
import type { ScheduleItem } from '@/types/schedule'

interface UseScheduleReturn {
  schedules: ScheduleItem[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * 取得所有日程
 */
export function useSchedule(): UseScheduleReturn {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSchedules = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await schedulesApi.getAll()
      setSchedules(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入日程失敗')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  return { schedules, isLoading, error, refetch: fetchSchedules }
}

/**
 * 取得即將到來的日程
 */
export function useUpcomingSchedule(): UseScheduleReturn {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSchedules = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await schedulesApi.getUpcoming()
      setSchedules(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入日程失敗')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  return { schedules, isLoading, error, refetch: fetchSchedules }
}

interface UseScheduleCalendarReturn {
  schedules: ScheduleItem[]
  isLoading: boolean
  error: string | null
  currentMonth: { year: number; month: number }
  setMonth: (year: number, month: number) => void
  goToNextMonth: () => void
  goToPrevMonth: () => void
  goToToday: () => void
}

/**
 * 日曆日程管理
 */
export function useScheduleCalendar(): UseScheduleCalendarReturn {
  const now = new Date()
  const [currentMonth, setCurrentMonth] = useState({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  })
  const [schedules, setSchedules] = useState<ScheduleItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSchedules = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await schedulesApi.getByMonth(currentMonth.year, currentMonth.month)
      setSchedules(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入日程失敗')
    } finally {
      setIsLoading(false)
    }
  }, [currentMonth.year, currentMonth.month])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  const setMonth = useCallback((year: number, month: number) => {
    setCurrentMonth({ year, month })
  }, [])

  const goToNextMonth = useCallback(() => {
    setCurrentMonth(prev => {
      if (prev.month === 12) {
        return { year: prev.year + 1, month: 1 }
      }
      return { ...prev, month: prev.month + 1 }
    })
  }, [])

  const goToPrevMonth = useCallback(() => {
    setCurrentMonth(prev => {
      if (prev.month === 1) {
        return { year: prev.year - 1, month: 12 }
      }
      return { ...prev, month: prev.month - 1 }
    })
  }, [])

  const goToToday = useCallback(() => {
    const today = new Date()
    setCurrentMonth({
      year: today.getFullYear(),
      month: today.getMonth() + 1,
    })
  }, [])

  return {
    schedules,
    isLoading,
    error,
    currentMonth,
    setMonth,
    goToNextMonth,
    goToPrevMonth,
    goToToday,
  }
}
