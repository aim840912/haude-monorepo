import { MaintenanceControl, BannerManager } from '@/components/system'

/**
 * 系統管理頁面
 *
 * 包含：
 * - 維護模式控制
 * - 系統公告管理
 */
export function SystemPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">系統管理</h1>
        <p className="mt-1 text-gray-500">管理網站維護模式和系統公告</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 維護模式控制 */}
        <div className="lg:col-span-1">
          <MaintenanceControl />
        </div>

        {/* 系統公告管理 */}
        <div className="lg:col-span-1">
          <BannerManager />
        </div>
      </div>
    </div>
  )
}
