import { formatDistanceToNow } from '../../lib/formatTime'
import {
  Package,
  ShoppingCart,
  XCircle,
  CheckCircle,
  AlertCircle,
  Bell,
  Trash2,
} from 'lucide-react'
import type { Notification, NotificationType } from '../../services/api'

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead?: (id: string) => void
  onDelete?: (id: string) => void
  onClick?: (notification: Notification) => void
}

const typeConfig: Record<
  NotificationType,
  { icon: typeof Package; color: string; bgColor: string }
> = {
  LOW_STOCK: {
    icon: Package,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  NEW_ORDER: {
    icon: ShoppingCart,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  ORDER_CANCELLED: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  PAYMENT_SUCCESS: {
    icon: CheckCircle,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
  },
  PAYMENT_FAILED: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  SYSTEM: {
    icon: Bell,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
}: NotificationItemProps) {
  const config = typeConfig[notification.type]
  const Icon = config.icon

  const timeAgo = formatDistanceToNow(notification.createdAt)

  const handleClick = () => {
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id)
    }
    onClick?.(notification)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.(notification.id)
  }

  return (
    <div
      onClick={handleClick}
      className={`
        group flex gap-3 p-4 cursor-pointer transition-colors
        hover:bg-gray-50
        ${notification.isRead ? 'bg-white' : 'bg-blue-50/50'}
      `}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${config.bgColor}`}>
        <Icon className={`w-5 h-5 ${config.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4
            className={`text-sm font-medium ${
              notification.isRead ? 'text-gray-700' : 'text-gray-900'
            }`}
          >
            {notification.title}
          </h4>
          {!notification.isRead && (
            <span className="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full bg-blue-500" />
          )}
        </div>

        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
          {notification.message}
        </p>

        <p className="text-xs text-gray-400 mt-1">{timeAgo}</p>
      </div>

      {/* Delete button */}
      {onDelete && (
        <button
          onClick={handleDelete}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          title="刪除通知"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
