import { useState, useEffect } from 'react'
import { Plus, Trash2, Info, AlertTriangle, AlertCircle, Wrench, ExternalLink } from 'lucide-react'
import { api } from '@/services/api/client'
import { useToast } from '@/components/ui/Toast'
import type { SystemBanner, SystemBannerType, CreateSystemBannerData } from '@haude/types'

const BANNER_TYPES: { value: SystemBannerType; label: string; icon: typeof Info }[] = [
  { value: 'info', label: '一般資訊', icon: Info },
  { value: 'warning', label: '警告', icon: AlertTriangle },
  { value: 'error', label: '錯誤', icon: AlertCircle },
  { value: 'maintenance', label: '維護', icon: Wrench },
]

/**
 * 系統公告管理元件
 *
 * 允許管理員新增、查看、刪除系統公告
 */
export function BannerManager() {
  const { success, error: showError } = useToast()
  const [banners, setBanners] = useState<SystemBanner[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<CreateSystemBannerData>({
    type: 'info',
    title: '',
    message: '',
    dismissible: true,
  })

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    try {
      const response = await api.get<SystemBanner[]>('/admin/system/banners')
      setBanners(response.data)
    } catch (err) {
      console.error('Failed to fetch banners:', err)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      showError('請輸入標題')
      return
    }

    setLoading(true)
    try {
      await api.post('/admin/system/banners', formData)
      success('公告已建立')
      setShowForm(false)
      setFormData({
        type: 'info',
        title: '',
        message: '',
        dismissible: true,
      })
      fetchBanners()
    } catch (err) {
      showError('建立失敗', err instanceof Error ? err.message : '請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此公告？')) return

    try {
      await api.delete(`/admin/system/banners/${id}`)
      success('公告已刪除')
      fetchBanners()
    } catch (err) {
      showError('刪除失敗', err instanceof Error ? err.message : '請稍後再試')
    }
  }

  const handleClearAll = async () => {
    if (!confirm('確定要清除所有公告？此操作無法復原。')) return

    try {
      await api.delete('/admin/system/banners')
      success('所有公告已清除')
      fetchBanners()
    } catch (err) {
      showError('清除失敗', err instanceof Error ? err.message : '請稍後再試')
    }
  }

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('zh-TW')
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">系統公告管理</h2>
        <div className="flex gap-2">
          {banners.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              清除全部
            </button>
          )}
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            新增公告
          </button>
        </div>
      </div>

      {/* 新增表單 */}
      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">類型</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as SystemBannerType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {BANNER_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">可關閉</label>
              <select
                value={formData.dismissible ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, dismissible: e.target.value === 'true' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="true">是</option>
                <option value="false">否</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">標題 *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="公告標題"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">內容</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="公告內容（選填）"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">過期時間</label>
              <input
                type="datetime-local"
                value={formData.expiresAt?.slice(0, 16) || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    expiresAt: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">連結文字</label>
              <input
                type="text"
                value={formData.link?.text || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    link: e.target.value ? { text: e.target.value, url: formData.link?.url || '' } : undefined,
                  })
                }
                placeholder="了解更多"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {formData.link?.text && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">連結 URL</label>
              <input
                type="url"
                value={formData.link?.url || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    link: formData.link ? { ...formData.link, url: e.target.value } : undefined,
                  })
                }
                placeholder="https://example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? '建立中...' : '建立公告'}
            </button>
          </div>
        </form>
      )}

      {/* 公告列表 */}
      {banners.length === 0 ? (
        <p className="text-center text-gray-500 py-8">目前沒有系統公告</p>
      ) : (
        <div className="space-y-3">
          {banners.map((banner) => {
            const typeConfig = BANNER_TYPES.find((t) => t.value === banner.type)
            const Icon = typeConfig?.icon || Info
            const isExpired = banner.expiresAt && new Date(banner.expiresAt) < new Date()

            return (
              <div
                key={banner.id}
                className={`flex items-start gap-3 p-4 border rounded-lg ${
                  isExpired ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-gray-200'
                }`}
              >
                <Icon className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{banner.title}</span>
                    <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                      {typeConfig?.label}
                    </span>
                    {isExpired && (
                      <span className="px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded">
                        已過期
                      </span>
                    )}
                    {!banner.dismissible && (
                      <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-600 rounded">
                        不可關閉
                      </span>
                    )}
                  </div>
                  {banner.message && (
                    <p className="mt-1 text-sm text-gray-600">{banner.message}</p>
                  )}
                  {banner.link && (
                    <a
                      href={banner.link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                      {banner.link.text}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <p className="mt-2 text-xs text-gray-400">
                    建立於 {formatDate(banner.createdAt)}
                    {banner.expiresAt && ` · 過期於 ${formatDate(banner.expiresAt)}`}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(banner.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="刪除公告"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
