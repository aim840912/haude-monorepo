import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/sections'
import { AdminLocationsTable } from '@/components/features/location/admin/AdminLocationsTable'

/**
 * 據點管理頁面
 *
 * 功能：
 * - 顯示所有據點列表
 * - 新增、編輯、刪除據點
 */
export function AdminLocationsPage() {
  const navigate = useNavigate()

  const handleCreate = () => {
    navigate('/admin/locations/create')
  }

  const handleEdit = (id: string) => {
    navigate(`/admin/locations/${id}/edit`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="據點管理" subtitle="新增、編輯、刪除販售據點" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 操作列 */}
        <div className="mb-6 flex justify-end">
          <button onClick={handleCreate} className="btn btn-primary">
            新增據點
          </button>
        </div>

        {/* 據點列表 */}
        <AdminLocationsTable onEdit={handleEdit} />
      </div>
    </div>
  )
}
