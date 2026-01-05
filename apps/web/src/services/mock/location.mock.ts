/**
 * 地點 Mock 資料和服務
 */

import type { Location } from '@/types/location'

// 生成唯一 ID
const generateId = (): string => `loc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Mock 地點資料（使用 let 以支援 CRUD）
let mockLocations: Location[] = [
  {
    id: 'loc-1',
    name: '梅山農場總部',
    title: '梅山農場 - 總部',
    address: '嘉義縣梅山鄉梅山路 123 號',
    landmark: '梅山公園旁',
    phone: '05-2621234',
    lineId: '@meishan-farm',
    hours: '週一至週日 08:00-18:00',
    closedDays: '除夕、初一',
    parking: '免費停車場，可容納 50 台車',
    publicTransport: '嘉義客運梅山站下車，步行約 5 分鐘',
    features: ['農產品直銷', '餐廳', '停車場', '無障礙設施'],
    specialties: ['高山茶', '梅子製品', '竹筍'],
    coordinates: {
      lat: 23.5878,
      lng: 120.5569,
    },
    image: 'https://placehold.co/400x300/3e2723/ffffff?text=Main+Farm',
    isMain: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'loc-2',
    name: '大湖採果園',
    title: '大湖農場 - 採果體驗區',
    address: '嘉義縣梅山鄉大湖路 456 號',
    landmark: '大湖水庫附近',
    phone: '05-2625678',
    lineId: '@meishan-dahu',
    hours: '週六、週日 09:00-17:00',
    closedDays: '平日（需預約）',
    parking: '路邊停車',
    publicTransport: '需自行開車前往',
    features: ['採果體驗', '農場導覽', '野餐區'],
    specialties: ['草莓', '番茄', '柑橘'],
    coordinates: {
      lat: 23.5912,
      lng: 120.5623,
    },
    image: 'https://placehold.co/400x300/2e7d32/ffffff?text=Dahu+Farm',
    isMain: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'loc-3',
    name: '梅山市集攤位',
    title: '梅山假日農夫市集',
    address: '嘉義縣梅山鄉中山路市場內 A12 攤位',
    landmark: '梅山市場入口左側',
    phone: '05-2621234',
    lineId: '@meishan-farm',
    hours: '週六 06:00-12:00',
    closedDays: '週日至週五',
    parking: '市場公共停車場',
    publicTransport: '梅山站下車，步行約 3 分鐘',
    features: ['農產品販售', '現場試吃'],
    specialties: ['當季蔬果', '手工醬料', '農特產品'],
    coordinates: {
      lat: 23.5856,
      lng: 120.5545,
    },
    image: 'https://placehold.co/400x300/d35400/ffffff?text=Market',
    isMain: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

/**
 * 地點 Mock API
 */
export const mockLocationApi = {
  /** 取得所有地點 */
  getAll: async (): Promise<Location[]> => {
    await delay(300)
    return [...mockLocations]
  },

  /** 取得單一地點 */
  getById: async (id: string): Promise<Location | null> => {
    await delay(200)
    return mockLocations.find(loc => loc.id === id) || null
  },

  /** 取得主要地點 */
  getMain: async (): Promise<Location | null> => {
    await delay(200)
    return mockLocations.find(loc => loc.isMain) || null
  },

  /** 建立據點 */
  create: async (
    data: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Location> => {
    await delay(300)
    const now = new Date().toISOString()
    const newLocation: Location = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }
    mockLocations = [newLocation, ...mockLocations]
    return newLocation
  },

  /** 更新據點 */
  update: async (
    id: string,
    data: Partial<Omit<Location, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Location | null> => {
    await delay(300)
    const index = mockLocations.findIndex(loc => loc.id === id)
    if (index === -1) return null

    const updatedLocation: Location = {
      ...mockLocations[index],
      ...data,
      updatedAt: new Date().toISOString(),
    }
    mockLocations = [
      ...mockLocations.slice(0, index),
      updatedLocation,
      ...mockLocations.slice(index + 1),
    ]
    return updatedLocation
  },

  /** 刪除據點 */
  delete: async (id: string): Promise<boolean> => {
    await delay(300)
    const index = mockLocations.findIndex(loc => loc.id === id)
    if (index === -1) return false

    mockLocations = [
      ...mockLocations.slice(0, index),
      ...mockLocations.slice(index + 1),
    ]
    return true
  },
}

// 模擬網路延遲
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
