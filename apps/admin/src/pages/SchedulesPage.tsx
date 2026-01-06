import { useState } from 'react'
import { Plus, Search, Edit, Trash2, RefreshCw, Calendar, MapPin, Phone } from 'lucide-react'
import { useSchedules, Schedule } from '../hooks/useSchedules'
import { ScheduleEditModal } from '../components/ScheduleEditModal'
import { ConfirmDialog } from '../components/ConfirmDialog'

// 狀態標籤樣式
const statusStyles: Record<Schedule['status'], string> = {
  upcoming: 'bg-blue-100 text-blue-800',
  ongoing: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
}

// 狀態中文名稱
const statusLabels: Record<Schedule['status'], string> = {
  upcoming: '即將開始',
  ongoing: '進行中',
  completed: '已結束',
}

export function SchedulesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [deletingSchedule, setDeletingSchedule] = useState<Schedule | null>(null)
  const { schedules, isLoading, error, refetch, updateSchedule, deleteSchedule, isUpdating, isDeleting } = useSchedules()

  // 過濾行程
  const filteredSchedules = schedules.filter(
    (schedule) =>
      schedule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={refetch}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          <RefreshCw className="w-4 h-4" />
          重試
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">擺攤行程管理</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={refetch}
            className="p-2 text-gray-600 hover:text-green-600 hover:bg-gray-100 rounded-lg"
            title="重新整理"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Plus className="w-5 h-5" />
            新增行程
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋行程名稱或地點..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Schedules Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filteredSchedules.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? '找不到符合的行程' : '尚無擺攤行程'}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  行程名稱
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  日期時間
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  地點
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  聯絡方式
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  販售產品
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  狀態
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSchedules.map((schedule) => (
                <tr key={schedule.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{schedule.title}</div>
                    {schedule.specialOffer && (
                      <div className="text-sm text-orange-600">{schedule.specialOffer}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>{schedule.date}</span>
                    </div>
                    <div className="text-sm text-gray-400">{schedule.time}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-gray-500">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="line-clamp-2">{schedule.location}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-gray-500">
                      <Phone className="w-4 h-4" />
                      <span>{schedule.contact}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {schedule.products.slice(0, 3).map((product, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 text-xs bg-green-50 text-green-700 rounded"
                        >
                          {product}
                        </span>
                      ))}
                      {schedule.products.length > 3 && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                          +{schedule.products.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        statusStyles[schedule.status] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {statusLabels[schedule.status] || schedule.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => setEditingSchedule(schedule)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="編輯行程"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingSchedule(schedule)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="刪除行程"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 行程數量統計 */}
      <div className="mt-4 text-sm text-gray-500">
        共 {filteredSchedules.length} 個行程
        {searchQuery && ` (搜尋結果)`}
      </div>

      {/* 編輯行程 Modal */}
      {editingSchedule && (
        <ScheduleEditModal
          schedule={editingSchedule}
          isOpen={!!editingSchedule}
          isUpdating={isUpdating}
          onClose={() => setEditingSchedule(null)}
          onSave={updateSchedule}
        />
      )}

      {/* 刪除確認 Dialog */}
      {deletingSchedule && (
        <ConfirmDialog
          isOpen={!!deletingSchedule}
          isLoading={isDeleting}
          title="確認刪除"
          message={`確定要刪除「${deletingSchedule.title}」嗎？此操作無法復原。`}
          confirmText="確認刪除"
          cancelText="取消"
          variant="danger"
          onConfirm={async () => {
            const success = await deleteSchedule(deletingSchedule.id)
            if (success) {
              setDeletingSchedule(null)
            }
          }}
          onCancel={() => setDeletingSchedule(null)}
        />
      )}
    </div>
  )
}
