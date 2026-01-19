/**
 * 日程 Mock 資料和服務
 */

import type { ScheduleItem } from '@/types/schedule'

// 計算日期
const getDate = (daysFromNow: number): string => {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return date.toISOString().split('T')[0]
}

// 生成唯一 ID
const generateId = (): string => `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Mock 日程資料（使用 let 以支援 CRUD）
let mockScheduleItems: ScheduleItem[] = [
  {
    id: 'schedule-1',
    title: '梅山假日農夫市集',
    location: '梅山市場 A12 攤位',
    date: getDate(3), // 3 天後（週六）
    time: '06:00-12:00',
    status: 'upcoming',
    products: ['高山茶', '梅子醬', '竹筍乾'],
    description: '每週六固定擺攤，提供最新鮮的農產品直銷',
    contact: '05-2621234',
    specialOffer: '早鳥優惠：上午 8 點前購買享 9 折',
    weatherNote: '雨天照常營業',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'schedule-2',
    title: '春季採茶體驗活動',
    location: '梅山茶園',
    date: getDate(7),
    time: '09:00-12:00',
    status: 'upcoming',
    products: ['春茶', '茶葉禮盒'],
    description: '親手採摘春茶，體驗製茶工藝',
    contact: '05-2621234',
    weatherNote: '雨天延期，另行通知',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'schedule-3',
    title: '嘉義農產品展售會',
    location: '嘉義文化中心',
    date: getDate(14),
    time: '10:00-18:00',
    status: 'upcoming',
    products: ['全系列產品'],
    description: '年度大型農產品展售會，多項優惠活動',
    contact: '05-2621234',
    specialOffer: '滿額送精美小禮',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'schedule-4',
    title: '梅山假日農夫市集',
    location: '梅山市場 A12 攤位',
    date: getDate(10),
    time: '06:00-12:00',
    status: 'upcoming',
    products: ['當季蔬果', '手工醬料'],
    description: '每週六固定擺攤',
    contact: '05-2621234',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

/**
 * 日程 Mock API
 */
export const mockScheduleApi = {
  /** 取得所有日程 */
  getAll: async (): Promise<ScheduleItem[]> => {
    await delay(300)
    return [...mockScheduleItems]
  },

  /** 取得即將到來的日程 */
  getUpcoming: async (): Promise<ScheduleItem[]> => {
    await delay(300)
    const now = new Date()
    return mockScheduleItems
      .filter(item => new Date(item.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  },

  /** 取得單一日程 */
  getById: async (id: string): Promise<ScheduleItem | null> => {
    await delay(200)
    return mockScheduleItems.find(item => item.id === id) || null
  },

  /** 取得指定月份的日程 */
  getByMonth: async (year: number, month: number): Promise<ScheduleItem[]> => {
    await delay(300)
    return mockScheduleItems.filter(item => {
      const itemDate = new Date(item.date)
      return itemDate.getFullYear() === year && itemDate.getMonth() + 1 === month
    })
  },

  /** 建立日程 */
  create: async (
    data: Omit<ScheduleItem, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ScheduleItem> => {
    await delay(300)
    const now = new Date().toISOString()
    const newSchedule: ScheduleItem = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }
    mockScheduleItems = [newSchedule, ...mockScheduleItems]
    return newSchedule
  },

  /** 更新日程 */
  update: async (
    id: string,
    data: Partial<Omit<ScheduleItem, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<ScheduleItem | null> => {
    await delay(300)
    const index = mockScheduleItems.findIndex(item => item.id === id)
    if (index === -1) return null

    const updatedSchedule: ScheduleItem = {
      ...mockScheduleItems[index],
      ...data,
      updatedAt: new Date().toISOString(),
    }
    mockScheduleItems = [
      ...mockScheduleItems.slice(0, index),
      updatedSchedule,
      ...mockScheduleItems.slice(index + 1),
    ]
    return updatedSchedule
  },

  /** 刪除日程 */
  delete: async (id: string): Promise<boolean> => {
    await delay(300)
    const index = mockScheduleItems.findIndex(item => item.id === id)
    if (index === -1) return false

    mockScheduleItems = [
      ...mockScheduleItems.slice(0, index),
      ...mockScheduleItems.slice(index + 1),
    ]
    return true
  },
}

// 模擬網路延遲
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
