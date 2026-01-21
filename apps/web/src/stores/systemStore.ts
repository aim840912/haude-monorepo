import { create } from 'zustand'
import type { SystemStatusResponse, SystemBanner, MaintenanceStatus } from '@haude/types'

interface SystemState {
  // 狀態
  status: 'ok' | 'degraded' | 'maintenance' | 'loading' | 'error'
  maintenance: MaintenanceStatus
  banners: SystemBanner[]
  lastUpdated: string | null
  error: string | null

  // 本地狀態（已關閉的公告 ID）
  dismissedBannerIds: Set<string>

  // Actions
  setStatus: (response: SystemStatusResponse) => void
  setError: (error: string) => void
  setLoading: () => void
  dismissBanner: (id: string) => void
  clearDismissed: () => void
}

export const useSystemStore = create<SystemState>((set) => ({
  status: 'loading',
  maintenance: {
    isMaintenanceMode: false,
    allowedRoles: ['ADMIN'],
  },
  banners: [],
  lastUpdated: null,
  error: null,
  dismissedBannerIds: new Set(),

  setStatus: (response) =>
    set({
      status: response.status,
      maintenance: response.maintenance,
      banners: response.banners,
      lastUpdated: response.timestamp,
      error: null,
    }),

  setError: (error) =>
    set({
      status: 'error',
      error,
    }),

  setLoading: () =>
    set({
      status: 'loading',
      error: null,
    }),

  dismissBanner: (id) =>
    set((state) => ({
      dismissedBannerIds: new Set([...state.dismissedBannerIds, id]),
    })),

  clearDismissed: () =>
    set({
      dismissedBannerIds: new Set(),
    }),
}))

/**
 * 取得未關閉的公告列表
 * 過濾掉使用者已關閉的公告
 */
export function getVisibleBanners(state: SystemState): SystemBanner[] {
  return state.banners.filter(
    (banner) =>
      // 未被關閉
      !state.dismissedBannerIds.has(banner.id) &&
      // 可關閉的才可能被關閉
      (banner.dismissible || !state.dismissedBannerIds.has(banner.id))
  )
}
