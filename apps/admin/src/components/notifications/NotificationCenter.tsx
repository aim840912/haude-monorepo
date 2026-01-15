import { useEffect } from 'react'
import { X, CheckCheck, RefreshCw, Loader2, Bell } from 'lucide-react'
import { NotificationItem } from './NotificationItem'
import type { Notification } from '../../services/api'

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
  notifications: Notification[]
  isLoading: boolean
  error: string | null
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onDelete: (id: string) => void
  onRefresh: () => void
  onNotificationClick?: (notification: Notification) => void
}

export function NotificationCenter({
  isOpen,
  onClose,
  notifications,
  isLoading,
  error,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onRefresh,
  onNotificationClick,
}: NotificationCenterProps) {
  // ESC 鍵關閉
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      // 防止背景滾動
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const unreadNotifications = notifications.filter((n) => !n.isRead)
  const hasUnread = unreadNotifications.length > 0

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">通知中心</h2>
          <div className="flex items-center gap-2">
            {hasUnread && (
              <button
                onClick={onMarkAllAsRead}
                className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="全部標記為已讀"
              >
                <CheckCheck className="w-4 h-4" />
                <span className="hidden sm:inline">全部已讀</span>
              </button>
            )}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="重新整理"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="關閉"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && notifications.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <p>{error}</p>
              <button
                onClick={onRefresh}
                className="mt-2 text-green-600 hover:underline"
              >
                重試
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Bell className="w-12 h-12 mb-2 opacity-50" />
              <p>目前沒有通知</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={onMarkAsRead}
                  onDelete={onDelete}
                  onClick={onNotificationClick}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 text-center text-sm text-gray-500">
            共 {notifications.length} 則通知
            {hasUnread && ` (${unreadNotifications.length} 則未讀)`}
          </div>
        )}
      </div>
    </>
  )
}
