import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import type { Schedule, CreateScheduleData, UpdateScheduleData } from '../hooks/useSchedules'

interface ScheduleEditModalProps {
  schedule: Schedule | null  // null = 新增模式
  isOpen: boolean
  isLoading: boolean
  onClose: () => void
  onCreate?: (data: CreateScheduleData) => Promise<boolean>
  onUpdate?: (id: string, data: UpdateScheduleData) => Promise<boolean>
}

const statusOptions = [
  { value: 'upcoming', label: '即將開始' },
  { value: 'ongoing', label: '進行中' },
  { value: 'completed', label: '已結束' },
] as const

export function ScheduleEditModal({
  schedule,
  isOpen,
  isLoading,
  onClose,
  onCreate,
  onUpdate,
}: ScheduleEditModalProps) {
  const isEditMode = schedule !== null

  const [formData, setFormData] = useState({
    title: '',
    location: '',
    date: '',
    time: '',
    status: 'upcoming' as Schedule['status'],
    products: [] as string[],
    description: '',
    contact: '',
    specialOffer: '',
    weatherNote: '',
  })
  const [productsInput, setProductsInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isEditMode && schedule) {
      // 編輯模式：載入現有行程資料
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        title: schedule.title || '',
        location: schedule.location || '',
        date: schedule.date || '',
        time: schedule.time || '',
        status: schedule.status || 'upcoming',
        products: schedule.products || [],
        description: schedule.description || '',
        contact: schedule.contact || '',
        specialOffer: schedule.specialOffer || '',
        weatherNote: schedule.weatherNote || '',
      })
      setProductsInput((schedule.products || []).join(', '))
      setError(null)
    } else {
      // 新增模式：重置為空表單
      setFormData({
        title: '',
        location: '',
        date: '',
        time: '',
        status: 'upcoming',
        products: [],
        description: '',
        contact: '',
        specialOffer: '',
        weatherNote: '',
      })
      setProductsInput('')
      setError(null)
    }
  }, [schedule, isEditMode])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.title.trim()) {
      setError('行程名稱不能為空')
      return
    }
    if (!formData.date) {
      setError('請選擇日期')
      return
    }
    if (!formData.location.trim()) {
      setError('地點不能為空')
      return
    }

    // 解析產品列表
    const products = productsInput
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0)

    let success = false

    if (isEditMode && schedule && onUpdate) {
      // 編輯模式
      success = await onUpdate(schedule.id, {
        title: formData.title.trim(),
        location: formData.location.trim(),
        date: formData.date,
        time: formData.time,
        status: formData.status,
        products,
        description: formData.description.trim(),
        contact: formData.contact.trim(),
        specialOffer: formData.specialOffer.trim() || undefined,
        weatherNote: formData.weatherNote.trim() || undefined,
      })
    } else if (!isEditMode && onCreate) {
      // 新增模式
      success = await onCreate({
        title: formData.title.trim(),
        location: formData.location.trim(),
        date: formData.date,
        time: formData.time,
        products,
        description: formData.description.trim(),
        contact: formData.contact.trim(),
        specialOffer: formData.specialOffer.trim() || undefined,
        weatherNote: formData.weatherNote.trim() || undefined,
      })
    }

    if (success) {
      onClose()
    } else {
      setError(isEditMode ? '更新失敗，請稍後再試' : '新增失敗，請稍後再試')
    }
  }

  const handleBackdropMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditMode ? '編輯行程' : '新增行程'}
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* 行程名稱 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              行程名稱 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          {/* 日期與時間 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                時間
              </label>
              <input
                type="text"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                placeholder="例：09:00 - 17:00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* 地點 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              地點 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          {/* 聯絡方式與狀態 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                聯絡方式
              </label>
              <input
                type="text"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                placeholder="例：0912-345-678"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                狀態
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Schedule['status'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isLoading}
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 販售產品 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              販售產品
            </label>
            <input
              type="text"
              value={productsInput}
              onChange={(e) => setProductsInput(e.target.value)}
              placeholder="以逗號分隔，例：高山茶, 烏龍茶, 紅茶"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-gray-500">多個產品請用逗號分隔</p>
          </div>

          {/* 特別優惠 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              特別優惠
            </label>
            <input
              type="text"
              value={formData.specialOffer}
              onChange={(e) => setFormData({ ...formData, specialOffer: e.target.value })}
              placeholder="例：現場購買享 9 折優惠"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          {/* 天氣備註 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              天氣備註
            </label>
            <input
              type="text"
              value={formData.weatherNote}
              onChange={(e) => setFormData({ ...formData, weatherNote: e.target.value })}
              placeholder="例：雨天照常營業"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              行程描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? '儲存中...' : isEditMode ? '儲存變更' : '新增行程'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
