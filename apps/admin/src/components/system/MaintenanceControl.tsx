import { useState, useEffect } from 'react'
import { Power, Clock, MessageSquare, Users, AlertTriangle, CheckCircle } from 'lucide-react'
import { api } from '@/services/api/client'
import { useToast } from '@/components/ui/Toast'
import type { MaintenanceStatus, UpdateMaintenanceData } from '@haude/types'

/**
 * 維護模式控制面板
 *
 * 允許管理員：
 * 1. 啟用/停用維護模式
 * 2. 設定維護訊息
 * 3. 設定預計恢復時間
 * 4. 設定允許存取的角色
 */
export function MaintenanceControl() {
  const { success, error: showError } = useToast()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<MaintenanceStatus>({
    isMaintenanceMode: false,
    allowedRoles: ['ADMIN'],
  })
  const [formData, setFormData] = useState<UpdateMaintenanceData>({
    isMaintenanceMode: false,
    message: '',
    estimatedEndTime: '',
    allowedRoles: ['ADMIN'],
  })

  // 載入目前狀態
  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await api.get<MaintenanceStatus>('/admin/system/maintenance')
      setStatus(response.data)
      setFormData({
        isMaintenanceMode: response.data.isMaintenanceMode,
        message: response.data.message || '',
        estimatedEndTime: response.data.estimatedEndTime || '',
        allowedRoles: response.data.allowedRoles || ['ADMIN'],
      })
    } catch (err) {
      console.error('Failed to fetch maintenance status:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data: UpdateMaintenanceData = {
        isMaintenanceMode: formData.isMaintenanceMode,
        message: formData.message || undefined,
        estimatedEndTime: formData.estimatedEndTime || undefined,
        allowedRoles: formData.allowedRoles,
      }

      await api.post('/admin/system/maintenance', data)
      success(
        formData.isMaintenanceMode ? '維護模式已啟用' : '維護模式已停用',
        formData.isMaintenanceMode ? '一般用戶將看到維護頁面' : '網站已恢復正常運作'
      )
      fetchStatus()
    } catch (err) {
      showError('操作失敗', err instanceof Error ? err.message : '請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  const toggleRole = (role: 'ADMIN' | 'STAFF') => {
    const currentRoles = formData.allowedRoles || []
    if (currentRoles.includes(role)) {
      setFormData({
        ...formData,
        allowedRoles: currentRoles.filter((r) => r !== role),
      })
    } else {
      setFormData({
        ...formData,
        allowedRoles: [...currentRoles, role],
      })
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            status.isMaintenanceMode ? 'bg-amber-100' : 'bg-green-100'
          }`}
        >
          {status.isMaintenanceMode ? (
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          ) : (
            <CheckCircle className="w-5 h-5 text-green-600" />
          )}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">維護模式控制</h2>
          <p className="text-sm text-gray-500">
            目前狀態：
            <span
              className={`ml-1 font-medium ${
                status.isMaintenanceMode ? 'text-amber-600' : 'text-green-600'
              }`}
            >
              {status.isMaintenanceMode ? '維護中' : '正常運作'}
            </span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 維護模式開關 */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Power className="w-5 h-5 text-gray-600" />
            <div>
              <p className="font-medium text-gray-900">維護模式</p>
              <p className="text-sm text-gray-500">啟用後一般用戶將看到維護頁面</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isMaintenanceMode}
              onChange={(e) =>
                setFormData({ ...formData, isMaintenanceMode: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-[transform] peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* 維護訊息 */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <MessageSquare className="w-4 h-4" />
            維護訊息
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="輸入要顯示給用戶的維護訊息..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>

        {/* 預計恢復時間 */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Clock className="w-4 h-4" />
            預計恢復時間
          </label>
          <input
            type="datetime-local"
            value={formData.estimatedEndTime?.slice(0, 16) || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                estimatedEndTime: e.target.value ? new Date(e.target.value).toISOString() : '',
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* 允許存取的角色 */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Users className="w-4 h-4" />
            允許存取的角色
          </label>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allowedRoles?.includes('ADMIN')}
                onChange={() => toggleRole('ADMIN')}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">管理員</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allowedRoles?.includes('STAFF')}
                onChange={() => toggleRole('STAFF')}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">員工</span>
            </label>
          </div>
        </div>

        {/* 提交按鈕 */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '處理中...' : '儲存設定'}
          </button>
        </div>
      </form>
    </div>
  )
}
