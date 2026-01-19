import { useState, useEffect, useCallback } from 'react'
import { membersApi, MemberLevel, AdminMember, MemberDetail, LevelHistoryItem, PointHistoryItem } from '../services/api'
import logger from '../lib/logger'

interface UseMembersOptions {
  level?: MemberLevel
  search?: string
  limit?: number
  offset?: number
}

interface UseMembersReturn {
  members: AdminMember[]
  total: number
  hasMore: boolean
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  adjustLevel: (id: string, level: MemberLevel, reason?: string) => Promise<boolean>
  adjustPoints: (id: string, points: number, reason?: string) => Promise<boolean>
  isUpdating: boolean
}

export function useMembers(options?: UseMembersOptions): UseMembersReturn {
  const [members, setMembers] = useState<AdminMember[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchMembers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await membersApi.getAll(options)
      setMembers(data.items)
      setTotal(data.total)
      setHasMore(data.hasMore)
    } catch (err) {
      const message = err instanceof Error ? err.message : '載入會員失敗'
      setError(message)
      logger.error('[useMembers] API 錯誤', { error: err })
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 使用解構的 options 欄位避免物件參考變化導致不必要的重新渲染
  }, [options?.level, options?.search, options?.limit, options?.offset])

  const adjustLevel = useCallback(async (id: string, level: MemberLevel, reason?: string): Promise<boolean> => {
    setIsUpdating(true)
    try {
      await membersApi.adjustLevel(id, { level, reason })
      await fetchMembers()
      return true
    } catch (err) {
      logger.error('[useMembers] 調整等級失敗', { error: err })
      return false
    } finally {
      setIsUpdating(false)
    }
  }, [fetchMembers])

  const adjustPoints = useCallback(async (id: string, points: number, reason?: string): Promise<boolean> => {
    setIsUpdating(true)
    try {
      await membersApi.adjustPoints(id, { points, reason })
      await fetchMembers()
      return true
    } catch (err) {
      logger.error('[useMembers] 調整積分失敗', { error: err })
      return false
    } finally {
      setIsUpdating(false)
    }
  }, [fetchMembers])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  return {
    members,
    total,
    hasMore,
    isLoading,
    error,
    refetch: fetchMembers,
    adjustLevel,
    adjustPoints,
    isUpdating,
  }
}

// 單一會員詳情 hook
interface UseMemberDetailReturn {
  member: MemberDetail | null
  levelHistory: LevelHistoryItem[]
  pointsHistory: PointHistoryItem[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  loadMoreLevelHistory: () => Promise<void>
  loadMorePointsHistory: () => Promise<void>
  hasMoreLevelHistory: boolean
  hasMorePointsHistory: boolean
}

export function useMemberDetail(memberId: string | undefined): UseMemberDetailReturn {
  const [member, setMember] = useState<MemberDetail | null>(null)
  const [levelHistory, setLevelHistory] = useState<LevelHistoryItem[]>([])
  const [pointsHistory, setPointsHistory] = useState<PointHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(!!memberId)
  const [error, setError] = useState<string | null>(null)
  const [hasMoreLevelHistory, setHasMoreLevelHistory] = useState(false)
  const [hasMorePointsHistory, setHasMorePointsHistory] = useState(false)

  const fetchMember = useCallback(async () => {
    if (!memberId) return

    setIsLoading(true)
    setError(null)
    try {
      const [memberRes, levelHistoryRes, pointsHistoryRes] = await Promise.all([
        membersApi.getById(memberId),
        membersApi.getLevelHistory(memberId, { limit: 10 }),
        membersApi.getPointsHistory(memberId, { limit: 10 }),
      ])

      setMember(memberRes.data)
      setLevelHistory(levelHistoryRes.data.items)
      setHasMoreLevelHistory(levelHistoryRes.data.hasMore)
      setPointsHistory(pointsHistoryRes.data.items)
      setHasMorePointsHistory(pointsHistoryRes.data.hasMore)
    } catch (err) {
      const message = err instanceof Error ? err.message : '載入會員詳情失敗'
      setError(message)
      logger.error('[useMemberDetail] API 錯誤', { error: err })
    } finally {
      setIsLoading(false)
    }
  }, [memberId])

  const loadMoreLevelHistory = useCallback(async () => {
    if (!memberId || !hasMoreLevelHistory) return

    try {
      const { data } = await membersApi.getLevelHistory(memberId, {
        limit: 10,
        offset: levelHistory.length,
      })
      setLevelHistory((prev) => [...prev, ...data.items])
      setHasMoreLevelHistory(data.hasMore)
    } catch (err) {
      logger.error('[useMemberDetail] 載入更多等級歷史失敗', { error: err })
    }
  }, [memberId, levelHistory.length, hasMoreLevelHistory])

  const loadMorePointsHistory = useCallback(async () => {
    if (!memberId || !hasMorePointsHistory) return

    try {
      const { data } = await membersApi.getPointsHistory(memberId, {
        limit: 10,
        offset: pointsHistory.length,
      })
      setPointsHistory((prev) => [...prev, ...data.items])
      setHasMorePointsHistory(data.hasMore)
    } catch (err) {
      logger.error('[useMemberDetail] 載入更多積分歷史失敗', { error: err })
    }
  }, [memberId, pointsHistory.length, hasMorePointsHistory])

  useEffect(() => {
    if (memberId) {
      fetchMember()
    }
  }, [memberId, fetchMember])

  return {
    member,
    levelHistory,
    pointsHistory,
    isLoading,
    error,
    refetch: fetchMember,
    loadMoreLevelHistory,
    loadMorePointsHistory,
    hasMoreLevelHistory,
    hasMorePointsHistory,
  }
}
