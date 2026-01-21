import { MaintenanceControl } from '../components/system/MaintenanceControl'
import { BannerManager } from '../components/system/BannerManager'

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">系統設定</h1>

      {/* 維護模式控制 */}
      <MaintenanceControl />

      {/* 系統公告管理 */}
      <BannerManager />
    </div>
  )
}
