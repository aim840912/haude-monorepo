'use client'

import { useEffect, useCallback, useRef } from 'react'
import { api } from '@/services/api'
import { useSystemStore } from '@/stores/systemStore'
import type { SystemStatusResponse } from '@haude/types'

const POLL_INTERVAL = 60000 // 60 秒

/**
 * 系統狀態輪詢 Hook
 *
 * 定期從 API 獲取系統狀態（維護模式、公告等）
 * 適用於根 layout，確保全站都能感知系統狀態變化
 */
export function useSystemStatus() {
  const { setStatus, setError, setLoading } = useSystemStore()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const response = await api.get<SystemStatusResponse>('/system/status')
      setStatus(response.data)
    } catch (error) {
      // 網路錯誤時不更新狀態，保留上次成功的狀態
      // 只有第一次載入失敗才設定錯誤
      const currentStatus = useSystemStore.getState().status
      if (currentStatus === 'loading') {
        setError(error instanceof Error ? error.message : 'Failed to fetch system status')
      }
      // 靜默失敗，不影響使用者體驗
      console.warn('[SystemStatus] Failed to fetch:', error)
    }
  }, [setStatus, setError])

  useEffect(() => {
    // 初始載入
    setLoading()
    fetchStatus()

    const start = () => {
      intervalRef.current = setInterval(fetchStatus, POLL_INTERVAL)
    }
    const stop = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        stop()
      } else {
        fetchStatus()
        start()
      }
    }

    start()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [fetchStatus, setLoading])

  // 提供手動刷新功能
  const refresh = useCallback(() => {
    fetchStatus()
  }, [fetchStatus])

  return { refresh }
}
