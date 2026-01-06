import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import type { User, UpdateUserData, UserRole } from '../hooks/useUsers'

interface UserStatusModalProps {
  user: User
  isOpen: boolean
  isUpdating: boolean
  onClose: () => void
  onSave: (id: string, data: UpdateUserData) => Promise<boolean>
}

const roleOptions: { value: UserRole; label: string; description: string }[] = [
  { value: 'USER', label: '一般會員', description: '下單、報名活動' },
  { value: 'VIP', label: 'VIP 會員', description: '專屬折扣、優先報名' },
  { value: 'STAFF', label: '員工', description: '查看訂單、管理行程' },
  { value: 'ADMIN', label: '管理員', description: '完整後台權限' },
]

export function UserStatusModal({
  user,
  isOpen,
  isUpdating,
  onClose,
  onSave,
}: UserStatusModalProps) {
  const [formData, setFormData] = useState({
    isActive: true,
    role: 'USER' as UserRole,
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setFormData({
        isActive: user.isActive,
        role: user.role,
      })
      setError(null)
    }
  }, [user])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // 檢查是否有變更
    if (formData.isActive === user.isActive && formData.role === user.role) {
      onClose()
      return
    }

    const success = await onSave(user.id, {
      isActive: formData.isActive,
      role: formData.role,
    })

    if (success) {
      onClose()
    } else {
      setError('更新失敗，請稍後再試')
    }
  }

  const handleBackdropMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isUpdating) {
      onClose()
    }
  }

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
          <h2 className="text-lg font-semibold text-gray-900">編輯會員</h2>
          <button
            onClick={onClose}
            disabled={isUpdating}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* 會員資訊 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">會員名稱</div>
            <div className="font-medium text-gray-900">{user.name}</div>
            <div className="mt-2 text-sm text-gray-500">Email</div>
            <div className="font-medium text-gray-900">{user.email}</div>
            {user.phone && (
              <>
                <div className="mt-2 text-sm text-gray-500">電話</div>
                <div className="font-medium text-gray-900">{user.phone}</div>
              </>
            )}
          </div>

          {/* 角色選擇 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              會員角色
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              disabled={isUpdating}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} - {option.description}
                </option>
              ))}
            </select>
          </div>

          {/* 狀態切換 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              帳號狀態
            </label>
            <div className="flex gap-3">
              <label
                className={`flex-1 flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  formData.isActive
                    ? 'bg-green-50 border-green-500 text-green-700'
                    : 'border-gray-200 hover:bg-gray-50'
                } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="status"
                  checked={formData.isActive}
                  onChange={() => setFormData({ ...formData, isActive: true })}
                  disabled={isUpdating}
                  className="sr-only"
                />
                <span className="font-medium">啟用</span>
              </label>
              <label
                className={`flex-1 flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  !formData.isActive
                    ? 'bg-gray-100 border-gray-500 text-gray-700'
                    : 'border-gray-200 hover:bg-gray-50'
                } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="status"
                  checked={!formData.isActive}
                  onChange={() => setFormData({ ...formData, isActive: false })}
                  disabled={isUpdating}
                  className="sr-only"
                />
                <span className="font-medium">停用</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isUpdating}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
              {isUpdating ? '儲存中...' : '儲存變更'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
