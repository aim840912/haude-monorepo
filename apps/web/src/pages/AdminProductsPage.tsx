import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/sections'
import { AdminProductsTable } from '@/components/features/products/admin/AdminProductsTable'

/**
 * 產品管理頁面
 *
 * 功能：
 * - 顯示所有產品列表
 * - 搜尋、篩選、分頁
 * - 新增、編輯、上下架、刪除產品
 */
export function AdminProductsPage() {
  const navigate = useNavigate()

  const handleCreate = () => {
    navigate('/admin/products/create')
  }

  const handleEdit = (id: string) => {
    navigate(`/admin/products/${id}/edit`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="產品管理" subtitle="新增、編輯、刪除產品" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 操作列 */}
        <div className="mb-6 flex justify-end">
          <button onClick={handleCreate} className="btn btn-primary">
            新增產品
          </button>
        </div>

        {/* 產品列表 */}
        <AdminProductsTable onEdit={handleEdit} />
      </div>
    </div>
  )
}
