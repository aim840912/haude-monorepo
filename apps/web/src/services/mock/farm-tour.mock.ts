/**
 * 農場體驗 Mock 資料和服務
 */

import type { FarmTour, FarmTourBooking, CreateFarmTourBookingDto } from '@/types/farm-tour'
import type { Facility } from '@/components/features/farm-tour/FacilitiesSection'
import type { VisitInfoData, VisitNotesData } from '@/components/features/farm-tour/InfoSection'
import type { FAQItem } from '@/components/features/farm-tour/FAQSection'

// 計算未來日期
const getFutureDate = (daysFromNow: number): string => {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return date.toISOString().split('T')[0]
}

// Mock 農場體驗資料
export const mockFarmTours: FarmTour[] = [
  {
    id: 'tour-1',
    name: '春季採茶體驗',
    description: '親手採摘新鮮茶葉，體驗傳統製茶工藝，品嚐現泡好茶。適合全家大小一起參與的農村體驗活動。',
    date: getFutureDate(7),
    startTime: '09:00',
    endTime: '12:00',
    price: 500,
    maxParticipants: 20,
    currentParticipants: 12,
    location: '梅山茶園',
    imageUrl: 'https://placehold.co/600x400/2e7d32/ffffff?text=Tea+Picking',
    status: 'upcoming',
    type: 'harvest',
    tags: ['親子活動', '茶文化', '戶外體驗'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tour-2',
    name: '手作果醬工作坊',
    description: '使用當季新鮮水果，學習製作天然果醬。可帶回親手製作的成品，送禮自用兩相宜。',
    date: getFutureDate(14),
    startTime: '14:00',
    endTime: '17:00',
    price: 800,
    maxParticipants: 15,
    currentParticipants: 8,
    location: '大湖農場工坊',
    imageUrl: 'https://placehold.co/600x400/dc2626/ffffff?text=Jam+Workshop',
    status: 'upcoming',
    type: 'workshop',
    tags: ['DIY 體驗', '手作課程', '伴手禮'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tour-3',
    name: '有機農場導覽',
    description: '深入了解有機農業的理念與實踐，參觀農場各區域，認識農作物生長過程。',
    date: getFutureDate(21),
    startTime: '10:00',
    endTime: '12:00',
    price: 300,
    maxParticipants: 30,
    currentParticipants: 5,
    location: '綠野農場',
    imageUrl: 'https://placehold.co/600x400/16a34a/ffffff?text=Farm+Tour',
    status: 'upcoming',
    type: 'tour',
    tags: ['生態教育', '有機農業', '導覽解說'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tour-4',
    name: '農產品品嚐會',
    description: '品嚐當季最新鮮的農產品，由專人介紹各種農產的特色與最佳食用方式。',
    date: getFutureDate(28),
    startTime: '15:00',
    endTime: '17:00',
    price: 600,
    maxParticipants: 25,
    currentParticipants: 18,
    location: '梅山農會展售中心',
    imageUrl: 'https://placehold.co/600x400/f59e0b/ffffff?text=Tasting',
    status: 'upcoming',
    type: 'tasting',
    tags: ['美食體驗', '當季食材', '農產直銷'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

// Mock 預約資料
const mockBookings: FarmTourBooking[] = []

/**
 * 農場體驗 Mock API
 */
export const mockFarmTourApi = {
  /** 取得所有農場體驗 */
  getAll: async (): Promise<FarmTour[]> => {
    await delay(300)
    return [...mockFarmTours]
  },

  /** 取得單一農場體驗 */
  getById: async (id: string): Promise<FarmTour | null> => {
    await delay(200)
    return mockFarmTours.find(tour => tour.id === id) || null
  },

  /** 取得即將舉行的體驗 */
  getUpcoming: async (): Promise<FarmTour[]> => {
    await delay(300)
    return mockFarmTours.filter(tour => tour.status === 'upcoming')
  },

  /** 建立預約 */
  createBooking: async (data: CreateFarmTourBookingDto): Promise<FarmTourBooking> => {
    await delay(500)
    const tour = mockFarmTours.find(t => t.id === data.tourId)
    if (!tour) {
      throw new Error('找不到指定的農場體驗')
    }

    if (tour.currentParticipants + data.participants > tour.maxParticipants) {
      throw new Error('報名人數已滿')
    }

    const booking: FarmTourBooking = {
      id: `booking-${Date.now()}`,
      tourId: data.tourId,
      userId: 'mock-user-id',
      participants: data.participants,
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      notes: data.notes,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    // 更新體驗的報名人數
    tour.currentParticipants += data.participants
    mockBookings.push(booking)

    return booking
  },

  /** 取得使用者的預約 */
  getUserBookings: async (): Promise<FarmTourBooking[]> => {
    await delay(300)
    return [...mockBookings]
  },

  /** 取消預約 */
  cancelBooking: async (bookingId: string): Promise<void> => {
    await delay(300)
    const bookingIndex = mockBookings.findIndex(b => b.id === bookingId)
    if (bookingIndex === -1) {
      throw new Error('找不到指定的預約')
    }

    const booking = mockBookings[bookingIndex]
    const tour = mockFarmTours.find(t => t.id === booking.tourId)
    if (tour) {
      tour.currentParticipants -= booking.participants
    }

    mockBookings[bookingIndex].status = 'cancelled'
  },
}

// 模擬網路延遲
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ========== 觀光果園頁面 Mock 資料 ==========

/**
 * 農場設施 Mock 資料
 */
export const mockFacilities: Facility[] = [
  {
    name: '品茶亭',
    description: '傳統竹造涼亭，提供農場自產茶品品嚐',
    features: ['茶藝設備', '山景視野', '文化體驗'],
  },
  {
    name: '採果區域',
    description: '分區種植不同水果，依季節開放採摘體驗',
    features: ['紅肉李區', '季節水果', '有機栽培'],
  },
  {
    name: '停車場',
    description: '可容納30台汽車的免費停車空間',
    features: ['免費停車', '遊覽車位', '無障礙設施'],
  },
]

/**
 * 常見問題 Mock 資料
 */
export const mockFaqs: FAQItem[] = [
  {
    question: '農場的開放時間是？',
    answer: '週二至週日：09:00 - 17:00\n週一公休（國定假日正常開放）\n※ 體驗活動請提前電話預約',
    icon: 'clock',
  },
  {
    question: '如何前往農場？',
    answer:
      '自行開車：國道4號 → 台3線 → 東關路\n大眾運輸：台中客運 → 和平區 → 農場接駁\n團體包車：可協助安排遊覽車接駁',
    icon: 'car',
  },
  {
    question: '適合帶小孩嗎？',
    answer:
      '非常適合！我們的體驗活動專為親子設計，提供：\n• 安全的採果環境\n• 適合兒童的活動設計\n• 休息區和洗手設施\n• 專業導覽解說',
    icon: 'users',
  },
  {
    question: '費用包含哪些內容？',
    answer:
      '體驗費用包含：\n• 專業導覽解說\n• 採果體驗（可帶走一定數量）\n• 農場茶飲品嚐\n• 免費停車',
    icon: 'banknote',
  },
]

/**
 * 參觀資訊 Mock 資料
 */
export const mockVisitInfo: VisitInfoData = {
  address: '嘉義縣梅山鄉太和村一鄰八號',
  opening_hours: {
    weekdays: '週二至週日：09:00 - 17:00',
    closed: '週一公休（國定假日正常開放）',
    note: '* 體驗活動請電話詢問',
  },
  transportation: [
    { type: '自行開車', route: '國道4號→台3線→東關路' },
    { type: '大眾運輸', route: '台中客運→和平區→農場接駁' },
    { type: '團體包車', route: '可協助安排遊覽車接駁' },
  ],
  contact: {
    phone: '05-2561843',
    line: '@haudetea',
    email: 'tour@haudetea.com',
  },
}

/**
 * 參觀須知 Mock 資料
 */
export const mockVisitNotes: VisitNotesData = {
  important: ['體驗活動請來電詢問詳情', '團體參觀請來電洽詢', '如遇天候不佳，活動可能調整或取消'],
  recommended_items: [
    '舒適的運動鞋或登山鞋',
    '帽子和防曬用品',
    '水壺（農場有飲水機）',
    '相機記錄美好時光',
  ],
  special_services: [
    '免費農場導覽解說',
    '團體活動客製化規劃',
    '農產品宅配服務',
    '企業員工旅遊包套',
  ],
}
