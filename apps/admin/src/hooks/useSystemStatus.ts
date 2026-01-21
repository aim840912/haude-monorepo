import { useEffect, useCallback, useRef } from 'react'
import { api } from '@/services/api/client'
import { useSystemStore } from '@/stores/systemStore'
import type { SystemStatusResponse } from '@haude/types'

const POLL_INTERVAL = 60000 // 60 秒

/**
 * 系統狀態輪詢 Hook（Admin 版本）
 *
 * Admin 用戶是 ADMIN 角色，可繞過維護模式
 * 因此這裡主要用於顯示系統公告
 */
export function useSystemStatus() {
  const { setStatus, setError, setLoading } = useSystemStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const response = await api.get<SystemStatusResponse>('/system/status')
      setStatus(response.data)
    } catch (error) {
      const currentStatus = useSystemStore.getState().status
      if (currentStatus === 'loading') {
        setError(error instanceof Error ? error.message : 'Failed to fetch system status')
      }
      console.warn('[SystemStatus] Failed to fetch:', error)
    }
  }, [setStatus, setError])

  useEffect(() => {
    setLoading()
    fetchStatus()

    intervalRef.current = setInterval(fetchStatus, POLL_INTERVAL)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchStatus, setLoading])

  const refresh = useCallback(() => {
    fetchStatus()
  }, [fetchStatus])

  return { refresh }
}
