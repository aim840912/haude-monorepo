import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import type { FarmTour, UpdateFarmTourData } from '../hooks/useFarmTours'

interface FarmTourEditModalProps {
  farmTour: FarmTour
  isOpen: boolean
  isUpdating: boolean
  onClose: () => void
  onSave: (id: string, data: UpdateFarmTourData) => Promise<boolean>
}

const typeOptions = [
  { value: 'harvest', label: '採收體驗' },
  { value: 'workshop', label: '手作工坊' },
  { value: 'tour', label: '農場導覽' },
  { value: 'tasting', label: '品茗體驗' },
] as const

const statusOptions = [
  { value: 'upcoming', label: '即將開始' },
  { value: 'ongoing', label: '進行中' },
  { value: 'completed', label: '已結束' },
  { value: 'cancelled', label: '已取消' },
] as const

export function FarmTourEditModal({
  farmTour,
  isOpen,
  isUpdating,
  onClose,
  onSave,
}: FarmTourEditModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    price: 0,
    maxParticipants: 0,
    location: '',
    type: 'tour' as FarmTour['type'],
    status: 'upcoming' as FarmTour['status'],
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (farmTour) {
      setFormData({
        name: farmTour.name || '',
        description: farmTour.description || '',
        date: farmTour.date || '',
        startTime: farmTour.startTime || '',
        endTime: farmTour.endTime || '',
        price: farmTour.price || 0,
        maxParticipants: farmTour.maxParticipants || 0,
        location: farmTour.location || '',
        type: farmTour.type || 'tour',
        status: farmTour.status || 'upcoming',
      })
      setError(null)
    }
  }, [farmTour])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.name.trim()) {
      setError('活動名稱不能為空')
      return
    }
    if (!formData.date) {
      setError('請選擇日期')
      return
    }
    if (formData.price < 0) {
      setError('價格不能為負數')
      return
    }
    if (formData.maxParticipants < 1) {
      setError('人數上限至少為 1')
      return
    }

    const success = await onSave(farmTour.id, {
      name: formData.name.trim(),
      description: formData.description.trim(),
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      price: formData.price,
      maxParticipants: formData.maxParticipants,
      location: formData.location.trim(),
      type: formData.type,
      status: formData.status,
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
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">編輯活動</h2>
          <button
            onClick={onClose}
            disabled={isUpdating}
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

          {/* 活動名稱 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              活動名稱 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={isUpdating}
            />
          </div>

          {/* 類型與狀態 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                活動類型
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as FarmTour['type'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isUpdating}
              >
                {typeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                狀態
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as FarmTour['status'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isUpdating}
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 日期與時間 */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isUpdating}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                開始時間
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isUpdating}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                結束時間
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isUpdating}
              />
            </div>
          </div>

          {/* 地點 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              地點
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={isUpdating}
            />
          </div>

          {/* 價格與人數 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                價格 (NT$)
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                min="0"
                disabled={isUpdating}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                人數上限
              </label>
              <input
                type="number"
                value={formData.maxParticipants}
                onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                min="1"
                disabled={isUpdating}
              />
            </div>
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              活動描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              disabled={isUpdating}
            />
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
