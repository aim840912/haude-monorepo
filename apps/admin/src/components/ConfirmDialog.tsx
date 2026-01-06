import { AlertTriangle, Loader2, X } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  isLoading: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  isLoading,
  title,
  message,
  confirmText = '確認',
  cancelText = '取消',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // 使用 mousedown 而非 click，避免拖曳到外面時意外關閉
  const handleBackdropMouseDown = (e: React.MouseEvent) => {
    // 只有直接點擊背景時才關閉（不是點擊 Modal 內容後拖出來）
    if (e.target === e.currentTarget && !isLoading) {
      onCancel()
    }
  }

  if (!isOpen) return null

  const variantStyles = {
    danger: {
      icon: 'bg-red-100 text-red-600',
      button: 'bg-red-600 hover:bg-red-700',
    },
    warning: {
      icon: 'bg-amber-100 text-amber-600',
      button: 'bg-amber-600 hover:bg-amber-700',
    },
  }

  const styles = variantStyles[variant]

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${styles.icon}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-gray-600">{message}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg disabled:opacity-50 ${styles.button}`}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? '處理中...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
