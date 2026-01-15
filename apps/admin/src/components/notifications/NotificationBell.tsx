import { useState, useCallback } from 'react'
import { Bell } from 'lucide-react'
import { useNotifications } from '../../hooks/useNotifications'
import { NotificationCenter } from './NotificationCenter'
import type { Notification } from '../../services/api'

interface NotificationBellProps {
  onNotificationClick?: (notification: Notification) => void
}

export function NotificationBell({ onNotificationClick }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications()

  const handleOpen = useCallback(() => {
    setIsOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setIsOpen(false)
  }, [])

  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      onNotificationClick?.(notification)
      // 如果是訂單相關通知，可以導向訂單頁面
      // 這裡可以根據通知類型做不同的處理
    },
    [onNotificationClick]
  )

  return (
    <>
      <button
        onClick={handleOpen}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title="通知中心"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-xs font-medium text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationCenter
        isOpen={isOpen}
        onClose={handleClose}
        notifications={notifications}
        isLoading={isLoading}
        error={error}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onDelete={deleteNotification}
        onRefresh={refresh}
        onNotificationClick={handleNotificationClick}
      />
    </>
  )
}
