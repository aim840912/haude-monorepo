import { useState, useEffect } from 'react'
import { Pencil, Trash2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { schedulesApi } from '@/services/api'
import type { ScheduleItem } from '@/types/schedule'
import logger from '@/lib/logger'

interface AdminSchedulesTableProps {
  onEdit: (id: string) => void
}

/**
 * 日程管理列表元件
 */
export function AdminSchedulesTable({ onEdit }: AdminSchedulesTableProps) {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // 載入日程資料
  useEffect(() => {
    const loadSchedules = async () => {
      setIsLoading(true)
      try {
        const { data } = await schedulesApi.getAllAdmin()
        // 依日期排序（最新在前）
        const sorted = data.sort(
          (a: ScheduleItem, b: ScheduleItem) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        setSchedules(sorted)
      } finally {
        setIsLoading(false)
      }
    }
    loadSchedules()
  }, [])

  // 處理刪除
  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`確定要刪除「${title}」嗎？`)) {
      return
    }

    setDeletingId(id)
    try {
      await schedulesApi.delete(id)
      setSchedules(prev => prev.filter(s => s.id !== id))
    } catch (error) {
      logger.error('刪除失敗', { error })
    } finally {
      setDeletingId(null)
    }
  }

  // 取得狀態標籤樣式
  const getStatusBadge = (status: ScheduleItem['status']) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium'
    switch (status) {
      case 'upcoming':
        return cn(baseClasses, 'bg-blue-100 text-blue-700')
      case 'ongoing':
        return cn(baseClasses, 'bg-green-100 text-green-700')
      case 'completed':
        return cn(baseClasses, 'bg-gray-100 text-gray-700')
    }
  }

  // 取得狀態文字
  const getStatusText = (status: ScheduleItem['status']) => {
    switch (status) {
      case 'upcoming':
        return '即將開始'
      case 'ongoing':
        return '進行中'
      case 'completed':
        return '已結束'
    }
  }

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (schedules.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
        尚無日程資料
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
                活動標題
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                日期
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                時間
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                地點
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                狀態
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {schedules.map(schedule => (
              <tr key={schedule.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className="font-medium text-gray-900">{schedule.title}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {formatDate(schedule.date)}
                </td>
                <td className="px-4 py-3 text-gray-600">{schedule.time}</td>
                <td className="px-4 py-3 text-gray-600">{schedule.location}</td>
                <td className="px-4 py-3">
                  <span className={getStatusBadge(schedule.status)}>
                    {getStatusText(schedule.status)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(schedule.id)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="編輯"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(schedule.id, schedule.title)}
                      disabled={deletingId === schedule.id}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="刪除"
                    >
                      {deletingId === schedule.id ? (
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
