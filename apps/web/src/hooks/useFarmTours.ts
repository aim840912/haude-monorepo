/**
 * 農場體驗 Hooks
 */

import { useState, useEffect, useCallback } from 'react'
import { farmToursApi } from '@/services/api'
import type { FarmTour, FarmTourBooking, CreateFarmTourBookingDto } from '@/types/farm-tour'

interface UseFarmToursReturn {
  tours: FarmTour[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * 取得所有農場體驗
 */
export function useFarmTours(): UseFarmToursReturn {
  const [tours, setTours] = useState<FarmTour[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTours = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await farmToursApi.getAll()
      setTours(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入農場體驗失敗')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTours()
  }, [fetchTours])

  return { tours, isLoading, error, refetch: fetchTours }
}

interface UseFarmTourReturn {
  tour: FarmTour | null
  isLoading: boolean
  error: string | null
}

/**
 * 取得單一農場體驗
 */
export function useFarmTour(tourId: string | undefined): UseFarmTourReturn {
  const [tour, setTour] = useState<FarmTour | null>(null)
  const [isLoading, setIsLoading] = useState(!!tourId)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tourId) return

    const fetchTour = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const { data } = await farmToursApi.getById(tourId)
        setTour(data)
        if (!data) {
          setError('找不到指定的農場體驗')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '載入失敗')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTour()
  }, [tourId])

  return { tour, isLoading, error }
}

interface UseFarmTourBookingOptions {
  /** 是否自動載入預約列表，預設 true */
  autoFetch?: boolean
}

interface UseFarmTourBookingReturn {
  bookings: FarmTourBooking[]
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
  createBooking: (data: CreateFarmTourBookingDto) => Promise<FarmTourBooking | null>
  cancelBooking: (bookingId: string) => Promise<boolean>
  refetch: () => Promise<void>
}

/**
 * 農場體驗預約管理
 *
 * @param options.autoFetch - 是否自動載入預約列表（需要登入），預設 true
 *                           在詳情頁設為 false 避免未登入時觸發 401
 */
export function useFarmTourBooking(options: UseFarmTourBookingOptions = {}): UseFarmTourBookingReturn {
  const { autoFetch = true } = options
  const [bookings, setBookings] = useState<FarmTourBooking[]>([])
  const [isLoading, setIsLoading] = useState(autoFetch)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBookings = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await farmToursApi.getMyBookings()
      setBookings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入預約失敗')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (autoFetch) {
      fetchBookings()
    }
  }, [autoFetch, fetchBookings])

  const createBooking = useCallback(async (data: CreateFarmTourBookingDto): Promise<FarmTourBooking | null> => {
    setIsSubmitting(true)
    setError(null)
    try {
      const { data: booking } = await farmToursApi.createBooking(data)
      setBookings(prev => [...prev, booking])
      return booking
    } catch (err) {
      setError(err instanceof Error ? err.message : '預約失敗')
      return null
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const cancelBooking = useCallback(async (bookingId: string): Promise<boolean> => {
    setIsSubmitting(true)
    setError(null)
    try {
      await farmToursApi.cancelBooking(bookingId)
      setBookings(prev =>
        prev.map(b => (b.id === bookingId ? { ...b, status: 'cancelled' as const } : b))
      )
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : '取消預約失敗')
      return false
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  return {
    bookings,
    isLoading,
    isSubmitting,
    error,
    createBooking,
    cancelBooking,
    refetch: fetchBookings,
  }
}
