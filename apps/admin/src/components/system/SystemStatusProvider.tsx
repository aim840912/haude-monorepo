import { type ReactNode } from 'react'
import { useSystemStatus } from '@/hooks/useSystemStatus'
import { SystemBanner } from './SystemBanner'

interface SystemStatusProviderProps {
  children: ReactNode
}

/**
 * 系統狀態 Provider（Admin 版本）
 *
 * Admin 用戶是 ADMIN 角色，不會被維護模式阻擋
 * 這裡只負責：
 * 1. 啟動系統狀態輪詢
 * 2. 在頂部顯示系統公告
 */
export function SystemStatusProvider({ children }: SystemStatusProviderProps) {
  // 啟動輪詢
  useSystemStatus()

  return (
    <>
      {/* 系統公告欄 - 顯示在頁面頂部 */}
      <div className="fixed top-0 left-0 right-0 z-50 p-2">
        <SystemBanner />
      </div>
      {children}
    </>
  )
}
