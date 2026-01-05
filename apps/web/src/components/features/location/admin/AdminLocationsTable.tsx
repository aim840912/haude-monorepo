import { useState, useEffect } from 'react'
import { Pencil, Trash2, Loader2, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { locationsApi } from '@/services/api'
import type { Location } from '@/types/location'

interface AdminLocationsTableProps {
  onEdit: (id: string) => void
}

/**
 * 據點管理列表元件
 */
export function AdminLocationsTable({ onEdit }: AdminLocationsTableProps) {
  const [locations, setLocations] = useState<Location[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // 載入據點資料
  useEffect(() => {
    const loadLocations = async () => {
      setIsLoading(true)
      try {
        const { data } = await locationsApi.getAllAdmin()
        // 總部排在最前面
        const sorted = data.sort((a: Location, b: Location) => {
          if (a.isMain && !b.isMain) return -1
          if (!a.isMain && b.isMain) return 1
          return a.name.localeCompare(b.name)
        })
        setLocations(sorted)
      } finally {
        setIsLoading(false)
      }
    }
    loadLocations()
  }, [])

  // 處理刪除
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`確定要刪除「${name}」嗎？`)) {
      return
    }

    setDeletingId(id)
    try {
      await locationsApi.delete(id)
      setLocations(prev => prev.filter(loc => loc.id !== id))
    } catch (error) {
      console.error('刪除失敗:', error)
    } finally {
      setDeletingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (locations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
        尚無據點資料
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                據點名稱
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                地址
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                電話
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                營業時間
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                類型
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {locations.map(location => (
              <tr key={location.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{location.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">
                  {location.address}
                </td>
                <td className="px-4 py-3 text-gray-600">{location.phone}</td>
                <td className="px-4 py-3 text-gray-600 max-w-[150px] truncate">
                  {location.hours}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      location.isMain
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    )}
                  >
                    {location.isMain ? '總部' : '據點'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(location.id)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="編輯"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(location.id, location.name)}
                      disabled={deletingId === location.id}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="刪除"
                    >
                      {deletingId === location.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
