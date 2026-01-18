import { useState } from 'react'
import { Plus, Search, Edit, Trash2, RefreshCw } from 'lucide-react'
import { useProducts } from '../hooks/useProducts'
import { ProductEditModal } from '../components/ProductEditModal'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { getProductImageUrl } from '../config/placeholder.config'
import type { Product } from '@haude/types'

export function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isCreatingDraft, setIsCreatingDraft] = useState(false)
  const { products, isLoading, error, refetch, createDraft, updateProduct, deleteProduct, isUpdating, isDeleting } = useProducts()

  // 新增產品：先建立草稿再開啟編輯 Modal
  const handleCreateNew = async () => {
    setIsCreatingDraft(true)
    const draftProduct = await createDraft()
    setIsCreatingDraft(false)
    if (draftProduct) {
      setEditingProduct(draftProduct)
    }
  }

  // 過濾產品
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
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
        <h1 className="text-2xl font-bold text-gray-900">產品管理</h1>
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
            {isCreatingDraft ? '準備中...' : '新增產品'}
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
            placeholder="搜尋產品名稱..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? '找不到符合的產品' : '尚無產品資料'}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  圖片
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  產品名稱
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  分類
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  價格
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  庫存
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
              {filteredProducts.map((product) => {
                // 取得圖片 URL（型別已統一為 images）
                const imageUrl = getProductImageUrl(product.images || [], product.category)

                return (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-gray-900">{product.name}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {product.category || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                    NT$ {product.price?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={product.stock === 0 ? 'text-red-600' : 'text-gray-900'}>
                      {product.stock ?? '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        product.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {product.isActive ? '上架' : '下架'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => setEditingProduct(product)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="編輯產品"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingProduct(product)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="刪除產品"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        )}
      </div>

      {/* 產品數量統計 */}
      <div className="mt-4 text-sm text-gray-500">
        共 {filteredProducts.length} 個產品
        {searchQuery && ` (搜尋結果)`}
      </div>

      {/* 編輯/新增產品 Modal */}
      {editingProduct && (
        <ProductEditModal
          product={editingProduct}
          isOpen={!!editingProduct}
          isLoading={isUpdating}
          onClose={() => {
            setEditingProduct(null)
            refetch() // 重新載入產品列表
          }}
          onUpdate={updateProduct}
          onDelete={deleteProduct}
        />
      )}

      {/* 刪除確認 Dialog */}
      {deletingProduct && (
        <ConfirmDialog
          isOpen={!!deletingProduct}
          isLoading={isDeleting}
          title="確認刪除"
          message={
            deleteError
              ? deleteError
              : `確定要刪除「${deletingProduct.name}」嗎？此操作無法復原。`
          }
          confirmText={deleteError ? '重試' : '確認刪除'}
          cancelText="取消"
          variant="danger"
          onConfirm={async () => {
            setDeleteError(null)
            const result = await deleteProduct(deletingProduct.id)
            if (result.success) {
              setDeletingProduct(null)
            } else {
              setDeleteError(result.error || '刪除失敗')
            }
          }}
          onCancel={() => {
            setDeletingProduct(null)
            setDeleteError(null)
          }}
        />
      )}
    </div>
  )
}
