import { useState } from 'react'
import { Plus, Search, Edit, Trash2, RefreshCw, Calendar, MapPin, Users } from 'lucide-react'
import { useFarmTours, FarmTour } from '../hooks/useFarmTours'
import { FarmTourEditModal } from '../components/FarmTourEditModal'
import { ConfirmDialog } from '../components/ConfirmDialog'

// 狀態標籤樣式
const statusStyles: Record<FarmTour['status'], string> = {
  upcoming: 'bg-blue-100 text-blue-800',
  ongoing: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
}

// 狀態中文名稱
const statusLabels: Record<FarmTour['status'], string> = {
  upcoming: '即將開始',
  ongoing: '進行中',
  completed: '已結束',
  cancelled: '已取消',
}

// 活動類型中文名稱
const typeLabels: Record<FarmTour['type'], string> = {
  harvest: '採收體驗',
  workshop: '手作工坊',
  tour: '農場導覽',
  tasting: '品茗體驗',
}

export function FarmToursPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [editingTour, setEditingTour] = useState<FarmTour | null>(null)
  const [deletingTour, setDeletingTour] = useState<FarmTour | null>(null)
  const [isCreatingDraft, setIsCreatingDraft] = useState(false)
  const { farmTours, isLoading, error, refetch, createDraft, updateFarmTour, deleteFarmTour, isUpdating, isDeleting } = useFarmTours()

  // 新增活動（先建立草稿取得 ID，讓圖片上傳可運作）
  const handleCreateNew = async () => {
    setIsCreatingDraft(true)
    const draft = await createDraft()
    setIsCreatingDraft(false)
    if (draft) {
      setEditingTour(draft) // 用草稿打開編輯 Modal
    }
  }

  // 過濾活動
  const filteredTours = farmTours.filter((tour) =>
    tour.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tour.location.toLowerCase().includes(searchQuery.toLowerCase())
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
        <h1 className="text-2xl font-bold text-gray-900">觀光果園管理</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={refetch}
            className="p-2 text-gray-600 hover:text-green-600 hover:bg-gray-100 rounded-lg"
            title="重新整理"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={handleCreateNew}
            disabled={isCreatingDraft}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {isCreatingDraft ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            新增活動
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
            placeholder="搜尋活動名稱或地點..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Farm Tours Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filteredTours.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? '找不到符合的活動' : '尚無觀光果園活動'}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  活動名稱
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  類型
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  日期時間
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  地點
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  報名狀況
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  價格
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
              {filteredTours.map((tour) => (
                <tr key={tour.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-gray-900">{tour.name}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {typeLabels[tour.type] || tour.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>{tour.date}</span>
                    </div>
                    <div className="text-sm text-gray-400">
                      {tour.startTime} - {tour.endTime}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-gray-500">
                      <MapPin className="w-4 h-4" />
                      <span>{tour.location}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span
                        className={
                          tour.currentParticipants >= tour.maxParticipants
                            ? 'text-red-600 font-medium'
                            : 'text-gray-900'
                        }
                      >
                        {tour.currentParticipants} / {tour.maxParticipants}
                      </span>
                    </div>
                    {tour.currentParticipants >= tour.maxParticipants && (
                      <span className="text-xs text-red-500">已額滿</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                    NT$ {tour.price?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        statusStyles[tour.status] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {statusLabels[tour.status] || tour.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => setEditingTour(tour)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="編輯活動"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingTour(tour)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="刪除活動"
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

      {/* 活動數量統計 */}
      <div className="mt-4 text-sm text-gray-500">
        共 {filteredTours.length} 個活動
        {searchQuery && ` (搜尋結果)`}
      </div>

      {/* 編輯/新增活動 Modal（草稿模式也使用編輯 Modal） */}
      {editingTour && (
        <FarmTourEditModal
          farmTour={editingTour}
          isOpen={!!editingTour}
          isLoading={isUpdating}
          onClose={() => {
            setEditingTour(null)
            refetch() // 刷新列表（如果草稿被刪除或保存）
          }}
          onUpdate={updateFarmTour}
          onDelete={deleteFarmTour}
        />
      )}

      {/* 刪除確認 Dialog */}
      {deletingTour && (
        <ConfirmDialog
          isOpen={!!deletingTour}
          isLoading={isDeleting}
          title="確認刪除"
          message={`確定要刪除「${deletingTour.name}」嗎？此操作無法復原。`}
          confirmText="確認刪除"
          cancelText="取消"
          variant="danger"
          onConfirm={async () => {
            const success = await deleteFarmTour(deletingTour.id)
            if (success) {
              setDeletingTour(null)
            }
          }}
          onCancel={() => setDeletingTour(null)}
        />
      )}
    </div>
  )
}
