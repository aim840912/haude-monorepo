/**
 * 網站設定 Hooks
 *
 * 注意：目前後端尚未實作 /site-settings API，
 * 因此暫時停用 API 呼叫，直接使用預設值。
 * 當後端實作後，可移除 SITE_SETTINGS_API_ENABLED 檢查。
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { api } from '@/services/api'
import type { SiteSetting, SettingKey } from '@/types/siteSettings'

// 暫時停用 site-settings API（後端尚未實作）
const SITE_SETTINGS_API_ENABLED = false

interface UseSiteSettingsReturn {
  settings: Record<string, SiteSetting>
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

interface UseSiteSettingReturn {
  setting: SiteSetting | null
  loading: boolean
  error: string | null
}

/**
 * 批量取得網站設定
 * @param keys - 設定鍵陣列
 */
export function useSiteSettings(keys: (SettingKey | string)[]): UseSiteSettingsReturn {
  const [settings, setSettings] = useState<Record<string, SiteSetting>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 使用 useMemo 穩定 keys 的引用
  const stableKeys = useMemo(() => keys.join(','), [keys])

  const fetchSettings = useCallback(async () => {
    // API 尚未實作，直接使用預設值
    if (!SITE_SETTINGS_API_ENABLED) {
      setSettings({})
      setLoading(false)
      return
    }

    if (!stableKeys) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ keys: stableKeys })
      const { data } = await api.get<SiteSetting[]>(`/site-settings?${params}`)

      const settingsMap: Record<string, SiteSetting> = {}
      data.forEach((setting) => {
        settingsMap[setting.key] = setting
      })
      setSettings(settingsMap)
    } catch {
      // API 不可用時使用預設值
      console.warn('Site settings API not available, using defaults')
      setSettings({})
    } finally {
      setLoading(false)
    }
  }, [stableKeys])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return { settings, loading, error, refetch: fetchSettings }
}

/**
 * 取得單一網站設定
 * @param key - 設定鍵
 */
export function useSiteSetting(key: SettingKey | string): UseSiteSettingReturn {
  const { settings, loading, error } = useSiteSettings([key])
  return {
    setting: settings[key] || null,
    loading,
    error,
  }
}

/**
 * 取得首頁設定的便捷 hook
 */
export function useHomeSettings() {
  const keys = [
    'home.hero_images',
    'home.feature_card_1_image',
    'home.feature_card_2_image',
    'home.feature_card_3_image',
    'home.feature_card_4_image',
    'home.news.seasonal_recommendation.enabled',
    'home.news.seasonal_recommendation.title',
    'home.news.seasonal_recommendation.icon',
    'home.news.seasonal_recommendation.description',
    'home.news.seasonal_recommendation.link_url',
    'home.news.seasonal_recommendation.link_text',
    'home.news.farm_activity.enabled',
    'home.news.farm_activity.title',
    'home.news.farm_activity.icon',
    'home.news.farm_activity.description',
    'home.news.farm_activity.link_url',
    'home.news.farm_activity.link_text',
  ]

  return useSiteSettings(keys)
}
