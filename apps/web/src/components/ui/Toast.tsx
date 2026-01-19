'use client'

/**
 * Toast 通知系統
 *
 * 簡化版本 - 合併所有 Toast 相關元件
 *
 * 使用方式:
 * 1. 在根 layout 加入 <ToastProvider>
 * 2. 在任意 Client Component 中使用 useToast hook
 *
 * @example
 * const { success, error } = useToast()
 * success('操作成功', '您的訂單已送出')
 */

import React, { createContext, useState, useCallback, useContext, memo } from 'react'
import { cn } from '@/lib/utils/cn'

// ============================================================================
// Types
// ============================================================================

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading'

export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

export interface ToastAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  position?: ToastPosition
  duration?: number
  progress?: number
  persistent?: boolean
  actions?: ToastAction[]
}

export interface ToastContextType {
  toasts: Toast[]
  showToast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
  updateToast: (id: string, updates: Partial<Toast>) => void
  success: (title: string, message?: string, actions?: ToastAction[]) => void
  error: (title: string, message?: string, actions?: ToastAction[]) => void
  warning: (title: string, message?: string, actions?: ToastAction[]) => void
  info: (title: string, message?: string, actions?: ToastAction[]) => void
  loading: (title: string, message?: string, progress?: number) => string
}

// ============================================================================
// Context
// ============================================================================

const ToastContext = createContext<ToastContextType | undefined>(undefined)

// ============================================================================
// Style Utilities
// ============================================================================

const POSITION_CLASSES: Record<ToastPosition, string> = {
  'top-left': 'fixed top-4 left-4 z-50 space-y-2',
  'top-center': 'fixed top-4 left-1/2 -translate-x-1/2 z-50 space-y-2',
  'top-right': 'fixed top-4 right-4 z-50 space-y-2',
  'bottom-left': 'fixed bottom-4 left-4 z-50 space-y-2',
  'bottom-center': 'fixed bottom-4 left-1/2 -translate-x-1/2 z-50 space-y-2',
  'bottom-right': 'fixed bottom-4 right-4 z-50 space-y-2',
}

const TOAST_STYLES: Record<ToastType, string> = {
  success: 'bg-green-50 border-l-4 border-green-500',
  error: 'bg-red-50 border-l-4 border-red-500',
  warning: 'bg-yellow-50 border-l-4 border-yellow-500',
  info: 'bg-blue-50 border-l-4 border-blue-500',
  loading: 'bg-green-50 border-l-4 border-green-500',
}

const ICON_STYLES: Record<ToastType, string> = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
  loading: 'text-green-500',
}

const ICON_CONTENT: Record<ToastType, React.ReactNode> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ⓘ',
  loading: (
    <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-600 border-t-transparent" />
  ),
}

function groupToastsByPosition(toasts: Toast[]): Map<ToastPosition, Toast[]> {
  const grouped = new Map<ToastPosition, Toast[]>()
  toasts.forEach(toast => {
    const position = toast.position || 'bottom-right'
    if (!grouped.has(position)) {
      grouped.set(position, [])
    }
    grouped.get(position)!.push(toast)
  })
  return grouped
}

// ============================================================================
// Sub-Components (Internal)
// ============================================================================

const ToastIcon = memo(function ToastIcon({ type }: { type: ToastType }) {
  return (
    <div
      className={cn(
        'flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full font-bold text-sm',
        ICON_STYLES[type]
      )}
    >
      {ICON_CONTENT[type]}
    </div>
  )
})

const ToastCloseButton = memo(function ToastCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600 focus:outline-none"
    >
      <span className="sr-only">關閉</span>
      <span className="text-lg">×</span>
    </button>
  )
})

const ToastProgressBar = memo(function ToastProgressBar({ progress }: { progress: number }) {
  return (
    <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
      <div
        className="bg-green-600 h-1.5 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  )
})

const ToastActionButtons = memo(function ToastActionButtons({
  actions,
}: {
  actions: ToastAction[]
}) {
  if (actions.length === 0) return null
  return (
    <div className="mt-3 flex space-x-2">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.onClick}
          className={cn(
            'px-3 py-1 text-xs font-medium rounded-md transition-colors',
            action.variant === 'primary'
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          {action.label}
        </button>
      ))}
    </div>
  )
})

const ToastItem = memo(function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast
  onRemove: (id: string) => void
}) {
  const baseStyles =
    'flex flex-col p-4 rounded-lg shadow-lg max-w-sm w-full transition-all duration-300 transform'

  return (
    <div className={cn(baseStyles, TOAST_STYLES[toast.type])}>
      <div className="flex items-start space-x-3">
        <ToastIcon type={toast.type} />

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900">{toast.title}</h4>
          {toast.message && <p className="mt-1 text-sm text-gray-600">{toast.message}</p>}

          {toast.type === 'loading' && toast.progress !== undefined && (
            <ToastProgressBar progress={toast.progress} />
          )}

          {toast.actions && <ToastActionButtons actions={toast.actions} />}
        </div>

        {toast.type !== 'loading' && <ToastCloseButton onClose={() => onRemove(toast.id)} />}
      </div>
    </div>
  )
})

const ToastContainer = memo(function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[]
  onRemove: (id: string) => void
}) {
  if (toasts.length === 0) return null

  const toastsByPosition = groupToastsByPosition(toasts)

  return (
    <>
      {Array.from(toastsByPosition.entries()).map(([position, positionToasts]) => (
        <div key={position} className={POSITION_CLASSES[position]}>
          {positionToasts.map(toast => (
            <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
          ))}
        </div>
      ))}
    </>
  )
})

// ============================================================================
// Provider
// ============================================================================

interface ToastProviderProps {
  children: React.ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const updateToast = useCallback((id: string, updates: Partial<Toast>) => {
    setToasts(prev => prev.map(toast => (toast.id === id ? { ...toast, ...updates } : toast)))
  }, [])

  const showToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9)
      const newToast = { ...toast, id }

      setToasts(prev => {
        const updated = [...prev, newToast]
        return updated.slice(-5) // 限制最多 5 個 Toast
      })

      if (!newToast.persistent && newToast.type !== 'loading') {
        setTimeout(() => {
          removeToast(id)
        }, toast.duration || 5000)
      }

      return id
    },
    [removeToast]
  )

  const success = useCallback(
    (title: string, message?: string, actions?: ToastAction[]) => {
      showToast({ type: 'success', title, message, actions })
    },
    [showToast]
  )

  const error = useCallback(
    (title: string, message?: string, actions?: ToastAction[]) => {
      showToast({ type: 'error', title, message, actions, duration: 8000 })
    },
    [showToast]
  )

  const warning = useCallback(
    (title: string, message?: string, actions?: ToastAction[]) => {
      showToast({ type: 'warning', title, message, actions, duration: 7000 })
    },
    [showToast]
  )

  const info = useCallback(
    (title: string, message?: string, actions?: ToastAction[]) => {
      showToast({ type: 'info', title, message, actions })
    },
    [showToast]
  )

  const loading = useCallback(
    (title: string, message?: string, progress?: number) => {
      return showToast({
        type: 'loading',
        title,
        message,
        progress,
        persistent: true,
      })
    },
    [showToast]
  )

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        removeToast,
        updateToast,
        success,
        error,
        warning,
        info,
        loading,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

// ============================================================================
// Hook
// ============================================================================

export function useToast(): ToastContextType {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast 必須在 ToastProvider 內使用')
  }
  return context
}
