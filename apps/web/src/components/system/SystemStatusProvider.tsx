'use client'

import { type ReactNode } from 'react'
import { useSystemStore } from '@/stores/systemStore'
import { useSystemStatus } from '@/hooks/useSystemStatus'
import { useAuthStore } from '@/stores/authStore'
import { MaintenancePage } from './MaintenancePage'

interface SystemStatusProviderProps {
  children: ReactNode
}

/**
 * 系統狀態 Provider
 *
 * 負責：
 * 1. 啟動系統狀態輪詢
 * 2. 維護模式攔截（非授權角色顯示維護頁面）
 */
export function SystemStatusProvider({ children }: SystemStatusProviderProps) {
  const { refresh } = useSystemStatus()
  const { status, maintenance } = useSystemStore()
  const user = useAuthStore((state) => state.user)

  // 檢查是否處於維護模式
  const isMaintenanceMode = maintenance.isMaintenanceMode

  // 檢查使用者是否有權限繞過維護模式
  const canBypassMaintenance = (() => {
    if (!isMaintenanceMode) return true
    if (!user) return false

    const allowedRoles = maintenance.allowedRoles ?? ['ADMIN']
    return allowedRoles.includes(user.role as 'ADMIN' | 'STAFF')
  })()

  // 維護模式且無權限繞過時，顯示維護頁面
  if (isMaintenanceMode && !canBypassMaintenance) {
    return <MaintenancePage maintenance={maintenance} onRefresh={refresh} />
  }

  // 初始載入中時，不阻擋渲染（避免閃爍）
  // 只有確認是維護模式才會攔截
  return <>{children}</>
}
