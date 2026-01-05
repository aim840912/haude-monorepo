/**
 * 農場體驗相關型別定義
 */

export interface FarmTour {
  id: string
  name: string
  description: string
  /** 體驗日期 */
  date: string
  /** 開始時間 */
  startTime: string
  /** 結束時間 */
  endTime: string
  /** 價格 */
  price: number
  /** 最大人數 */
  maxParticipants: number
  /** 已報名人數 */
  currentParticipants: number
  /** 地點 */
  location: string
  /** 圖片 URL */
  imageUrl?: string
  /** 狀態 */
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  /** 體驗類型 */
  type: 'harvest' | 'workshop' | 'tour' | 'tasting'
  /** 特色標籤 */
  tags?: string[]
  /** 建立時間 */
  createdAt: string
  /** 更新時間 */
  updatedAt: string
}

export interface FarmTourBooking {
  id: string
  tourId: string
  userId: string
  /** 報名人數 */
  participants: number
  /** 聯絡人姓名 */
  contactName: string
  /** 聯絡電話 */
  contactPhone: string
  /** 備註 */
  notes?: string
  /** 預約狀態 */
  status: 'pending' | 'confirmed' | 'cancelled'
  /** 建立時間 */
  createdAt: string
}

export interface CreateFarmTourBookingDto {
  tourId: string
  participants: number
  contactName: string
  contactPhone: string
  notes?: string
}
