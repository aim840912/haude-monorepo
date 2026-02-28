import { useState, useEffect, useCallback, useRef } from 'react'
import { notificationsApi, Notification } from '../services/api'
import { logger } from '../lib/logger'

interface UseNotificationsOptions {
  /** 輪詢間隔（毫秒），預設 30 秒 */
  pollingInterval?: number
  /** 是否自動開始輪詢，預設 true */
  autoPolling?: boolean
}

interface UseNotificationsReturn {
  /** 通知列表 */
  notifications: Notification[]
  /** 未讀數量 */
  unreadCount: number
  /** 載入狀態 */
  isLoading: boolean
  /** 錯誤訊息 */
  error: string | null
  /** 重新取得通知 */
  refresh: () => Promise<void>
  /** 標記單一通知為已讀 */
  markAsRead: (id: string) => Promise<void>
  /** 標記所有通知為已讀 */
  markAllAsRead: () => Promise<void>
  /** 刪除通知 */
  deleteNotification: (id: string) => Promise<void>
  /** 開始輪詢 */
  startPolling: () => void
  /** 停止輪詢 */
  stopPolling: () => void
}

export function useNotifications(
  options: UseNotificationsOptions = {}
): UseNotificationsReturn {
  const { pollingInterval = 30000, autoPolling = true } = options

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const isPollingRef = useRef(false)

  // 取得通知列表
  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await notificationsApi.getAll({ limit: 50 })
      setNotifications(data.notifications)
      setError(null)
    } catch (err) {
      logger.error('Failed to fetch notifications', { error: err instanceof Error ? err.message : String(err) })
      setError('無法載入通知')
    }
  }, [])

  // 取得未讀數量
  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await notificationsApi.getUnreadCount()
      setUnreadCount(data.count)
    } catch (err) {
      logger.error('Failed to fetch unread count', { error: err instanceof Error ? err.message : String(err) })
    }
  }, [])

  // 重新取得所有資料
  const refresh = useCallback(async () => {
    setIsLoading(true)
    await Promise.all([fetchNotifications(), fetchUnreadCount()])
    setIsLoading(false)
  }, [fetchNotifications, fetchUnreadCount])

  // 標記單一通知為已讀
  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationsApi.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      logger.error('Failed to mark notification as read', { error: err instanceof Error ? err.message : String(err) })
      throw err
    }
  }, [])

  // 標記所有通知為已讀
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllAsRead()
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      )
      setUnreadCount(0)
    } catch (err) {
      logger.error('Failed to mark all notifications as read', { error: err instanceof Error ? err.message : String(err) })
      throw err
    }
  }, [])

  // 刪除通知
  const deleteNotification = useCallback(async (id: string) => {
    try {
      await notificationsApi.delete(id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      // 如果刪除的是未讀通知，減少未讀數量
      setNotifications((prev) => {
        const notification = notifications.find((n) => n.id === id)
        if (notification && !notification.isRead) {
          setUnreadCount((count) => Math.max(0, count - 1))
        }
        return prev.filter((n) => n.id !== id)
      })
    } catch (err) {
      logger.error('Failed to delete notification', { error: err instanceof Error ? err.message : String(err) })
      throw err
    }
  }, [notifications])

  // 開始輪詢
  const startPolling = useCallback(() => {
    if (isPollingRef.current) return

    isPollingRef.current = true
    pollingRef.current = setInterval(() => {
      fetchUnreadCount()
    }, pollingInterval)

    logger.debug('Notification polling started', { interval: pollingInterval })
  }, [fetchUnreadCount, pollingInterval])

  // 停止輪詢
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
    isPollingRef.current = false
    logger.debug('Notification polling stopped')
  }, [])

  // 初始化載入
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh()
  }, [refresh])

  // 自動輪詢（含 Page Visibility 守衛：tab hidden 時停止輪詢，恢復時重啟）
  useEffect(() => {
    if (!autoPolling) return

    startPolling()

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        stopPolling()
      } else {
        startPolling()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      stopPolling()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [autoPolling, startPolling, stopPolling])

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    startPolling,
    stopPolling,
  }
}
