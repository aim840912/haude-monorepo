import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Edit, Trash2, RefreshCw, Tag, Calendar, Percent, DollarSign } from 'lucide-react'
import { discountsApi, type DiscountCode } from '../services/api'
import { ConfirmDialog } from '../components/ConfirmDialog'

interface DiscountFormData {
  code: string
  description: string
  discountType: 'PERCENTAGE' | 'FIXED'
  discountValue: number
  minOrderAmount: number | ''
  maxDiscount: number | ''
  usageLimit: number | ''
  perUserLimit: number
  startDate: string
  endDate: string
  isActive: boolean
}

const defaultFormData: DiscountFormData = {
  code: '',
  description: '',
  discountType: 'PERCENTAGE',
  discountValue: 10,
  minOrderAmount: '',
  maxDiscount: '',
  usageLimit: '',
  perUserLimit: 1,
  startDate: '',
  endDate: '',
  isActive: true,
}

export function DiscountsPage() {
  const [discounts, setDiscounts] = useState<DiscountCode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDiscount, setEditingDiscount] = useState<DiscountCode | null>(null)
  const [deletingDiscount, setDeletingDiscount] = useState<DiscountCode | null>(null)
  const [formData, setFormData] = useState<DiscountFormData>(defaultFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchDiscounts = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const { data } = await discountsApi.getAll()
      setDiscounts(data)
    } catch (err) {
      console.error('取得折扣碼失敗:', err)
      setError('無法載入折扣碼資料')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDiscounts()
  }, [fetchDiscounts])

  // 過濾折扣碼
  const filteredDiscounts = discounts.filter((d) =>
    d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  )

  // 開啟新增 Modal
  const handleOpenCreate = () => {
    setEditingDiscount(null)
    setFormData(defaultFormData)
    setIsModalOpen(true)
  }

  // 開啟編輯 Modal
  const handleOpenEdit = (discount: DiscountCode) => {
    setEditingDiscount(discount)
    setFormData({
      code: discount.code,
      description: discount.description || '',
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      minOrderAmount: discount.minOrderAmount ?? '',
      maxDiscount: discount.maxDiscount ?? '',
      usageLimit: discount.usageLimit ?? '',
      perUserLimit: discount.perUserLimit,
      startDate: discount.startDate ? discount.startDate.split('T')[0] : '',
      endDate: discount.endDate ? discount.endDate.split('T')[0] : '',
      isActive: discount.isActive,
    })
    setIsModalOpen(true)
  }

  // 提交表單
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.code.trim()) return

    setIsSubmitting(true)
    try {
      const payload = {
        code: formData.code.toUpperCase().trim(),
        description: formData.description.trim() || undefined,
        discountType: formData.discountType,
        discountValue: formData.discountValue,
        minOrderAmount: formData.minOrderAmount === '' ? undefined : Number(formData.minOrderAmount),
        maxDiscount: formData.maxDiscount === '' ? undefined : Number(formData.maxDiscount),
        usageLimit: formData.usageLimit === '' ? undefined : Number(formData.usageLimit),
        perUserLimit: formData.perUserLimit,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        isActive: formData.isActive,
      }

      if (editingDiscount) {
        await discountsApi.update(editingDiscount.id, payload)
      } else {
        await discountsApi.create(payload)
      }

      setIsModalOpen(false)
      fetchDiscounts()
    } catch (err) {
      console.error('儲存折扣碼失敗:', err)
      alert('儲存失敗，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 刪除折扣碼
  const handleDelete = async () => {
    if (!deletingDiscount) return

    setIsDeleting(true)
    try {
      await discountsApi.delete(deletingDiscount.id)
      setDeletingDiscount(null)
      fetchDiscounts()
    } catch (err) {
      console.error('刪除折扣碼失敗:', err)
      alert('刪除失敗，請稍後再試')
    } finally {
      setIsDeleting(false)
    }
  }

  // 格式化日期顯示
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('zh-TW')
  }

  // 格式化折扣顯示
  const formatDiscount = (discount: DiscountCode) => {
    if (discount.discountType === 'PERCENTAGE') {
      return `${discount.discountValue}% 折扣`
    }
    return `NT$ ${discount.discountValue} 折抵`
  }

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
          onClick={fetchDiscounts}
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
        <h1 className="text-2xl font-bold text-gray-900">折扣碼管理</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDiscounts}
            className="p-2 text-gray-600 hover:text-green-600 hover:bg-gray-100 rounded-lg"
            title="重新整理"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            新增折扣碼
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
            placeholder="搜尋折扣碼或描述..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Discounts Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filteredDiscounts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? '找不到符合的折扣碼' : '尚無折扣碼資料'}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  折扣碼
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  類型 / 折扣
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  使用次數
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  有效期間
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
              {filteredDiscounts.map((discount) => (
                <tr key={discount.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-green-600" />
                      <span className="font-mono font-medium text-gray-900">{discount.code}</span>
                    </div>
                    {discount.description && (
                      <p className="text-sm text-gray-500 mt-1">{discount.description}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {discount.discountType === 'PERCENTAGE' ? (
                        <Percent className="w-4 h-4 text-blue-500" />
                      ) : (
                        <DollarSign className="w-4 h-4 text-green-500" />
                      )}
                      <span className="text-gray-900">{formatDiscount(discount)}</span>
                    </div>
                    {discount.minOrderAmount && (
                      <p className="text-xs text-gray-500 mt-1">
                        滿 NT$ {discount.minOrderAmount.toLocaleString()} 可用
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                    {discount.usageCount} / {discount.usageLimit ?? '無限'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(discount.startDate)}</span>
                      <span>~</span>
                      <span>{formatDate(discount.endDate)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        discount.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {discount.isActive ? '啟用中' : '已停用'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(discount)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="編輯"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingDiscount(discount)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="刪除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingDiscount ? '編輯折扣碼' : '新增折扣碼'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* 折扣碼 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  折扣碼 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="例：WELCOME2024"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono"
                  required
                  disabled={!!editingDiscount}
                />
                {editingDiscount && (
                  <p className="text-xs text-gray-500 mt-1">折扣碼建立後無法修改</p>
                )}
              </div>

              {/* 描述 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  描述
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="例：新會員首購優惠"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* 折扣類型和數值 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    折扣類型 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountType: e.target.value as 'PERCENTAGE' | 'FIXED',
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="PERCENTAGE">百分比折扣</option>
                    <option value="FIXED">固定金額折抵</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    折扣值 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.discountValue}
                      onChange={(e) =>
                        setFormData({ ...formData, discountValue: Number(e.target.value) })
                      }
                      min={1}
                      max={formData.discountType === 'PERCENTAGE' ? 100 : undefined}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                      {formData.discountType === 'PERCENTAGE' ? '%' : 'NT$'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 最低訂單金額和最高折扣 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    最低訂單金額
                  </label>
                  <input
                    type="number"
                    value={formData.minOrderAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minOrderAmount: e.target.value === '' ? '' : Number(e.target.value),
                      })
                    }
                    placeholder="無限制"
                    min={0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    最高折扣金額
                  </label>
                  <input
                    type="number"
                    value={formData.maxDiscount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxDiscount: e.target.value === '' ? '' : Number(e.target.value),
                      })
                    }
                    placeholder="無限制"
                    min={0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* 使用次數限制 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    總使用次數限制
                  </label>
                  <input
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        usageLimit: e.target.value === '' ? '' : Number(e.target.value),
                      })
                    }
                    placeholder="無限制"
                    min={1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    每人使用次數
                  </label>
                  <input
                    type="number"
                    value={formData.perUserLimit}
                    onChange={(e) =>
                      setFormData({ ...formData, perUserLimit: Number(e.target.value) })
                    }
                    min={1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* 有效期間 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    開始日期
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    結束日期
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* 狀態 */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  啟用此折扣碼
                </label>
              </div>

              {/* 按鈕 */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={isSubmitting}
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? '儲存中...' : editingDiscount ? '更新' : '建立'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deletingDiscount}
        title="刪除折扣碼"
        message={`確定要刪除折扣碼「${deletingDiscount?.code}」嗎？此操作無法復原。`}
        confirmText="刪除"
        cancelText="取消"
        onConfirm={handleDelete}
        onCancel={() => setDeletingDiscount(null)}
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  )
}
