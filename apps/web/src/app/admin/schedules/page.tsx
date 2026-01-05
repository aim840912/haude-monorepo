'use client'

import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/sections'
import { AdminSchedulesTable } from '@/components/features/schedules/admin/AdminSchedulesTable'

/**
 * 日程管理頁面
 *
 * 功能：
 * - 顯示所有日程列表
 * - 新增、編輯、刪除日程
 */
export default function AdminSchedulesPage() {
  const router = useRouter()

  const handleCreate = () => {
    router.push('/admin/schedules/new')
  }

  const handleEdit = (id: string) => {
    router.push(`/admin/schedules/${id}/edit`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="日程管理" subtitle="新增、編輯、刪除活動日程" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 操作列 */}
        <div className="mb-6 flex justify-end">
          <button onClick={handleCreate} className="btn btn-primary">
            新增日程
          </button>
        </div>

        {/* 日程列表 */}
        <AdminSchedulesTable onEdit={handleEdit} />
      </div>
    </div>
  )
}
