import { useState } from 'react'
import { Plus, Search, Edit, Trash2, RefreshCw, MapPin, Phone, Clock, Star } from 'lucide-react'
import { useLocations, Location } from '../hooks/useLocations'
import { LocationEditModal } from '../components/LocationEditModal'
import { ConfirmDialog } from '../components/ConfirmDialog'

export function LocationsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [deletingLocation, setDeletingLocation] = useState<Location | null>(null)
  const { locations, isLoading, error, refetch, updateLocation, deleteLocation, isUpdating, isDeleting } = useLocations()

  // 過濾門市
  const filteredLocations = locations.filter((location) =>
    location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.address.toLowerCase().includes(searchQuery.toLowerCase())
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
        <h1 className="text-2xl font-bold text-gray-900">門市管理</h1>
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
            新增門市
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
            placeholder="搜尋門市名稱或地址..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Locations Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filteredLocations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? '找不到符合的門市' : '尚無門市資料'}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  門市名稱
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  地址
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  電話
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  營業時間
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
              {filteredLocations.map((location) => (
                <tr key={location.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{location.name}</span>
                      {location.isMain && (
                        <span title="主要門市">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        </span>
                      )}
                    </div>
                    {location.title && (
                      <span className="text-sm text-gray-500">{location.title}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-1 text-gray-600 max-w-xs">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="text-sm truncate" title={location.address}>
                        {location.address}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {location.phone ? (
                      <div className="flex items-center gap-1 text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm">{location.phone}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {location.hours ? (
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{location.hours}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        location.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {location.isActive ? '營業中' : '已關閉'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => setEditingLocation(location)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="編輯門市"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingLocation(location)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="刪除門市"
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

      {/* 門市數量統計 */}
      <div className="mt-4 text-sm text-gray-500">
        共 {filteredLocations.length} 個門市
        {searchQuery && ` (搜尋結果)`}
      </div>

      {/* 編輯門市 Modal */}
      {editingLocation && (
        <LocationEditModal
          location={editingLocation}
          isOpen={!!editingLocation}
          isUpdating={isUpdating}
          onClose={() => setEditingLocation(null)}
          onSave={updateLocation}
        />
      )}

      {/* 刪除確認 Dialog */}
      {deletingLocation && (
        <ConfirmDialog
          isOpen={!!deletingLocation}
          isLoading={isDeleting}
          title="確認刪除"
          message={`確定要刪除「${deletingLocation.name}」嗎？此操作無法復原。`}
          confirmText="確認刪除"
          cancelText="取消"
          variant="danger"
          onConfirm={async () => {
            const success = await deleteLocation(deletingLocation.id)
            if (success) {
              setDeletingLocation(null)
            }
          }}
          onCancel={() => setDeletingLocation(null)}
        />
      )}
    </div>
  )
}
