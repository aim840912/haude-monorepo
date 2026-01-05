import type { ScheduleItem } from '@/types/schedule'

/**
 * 表單值類型
 */
export interface ScheduleFormValues {
  title: string
  location: string
  date: string
  time: string
  status: 'upcoming' | 'ongoing' | 'completed'
  products: string
  description: string
  contact: string
  specialOffer: string
  weatherNote: string
}

/**
 * 表單錯誤類型
 */
export interface ScheduleFormErrors {
  title?: string
  location?: string
  date?: string
  time?: string
  contact?: string
}

/**
 * 表單 Props
 */
export interface ScheduleFormProps {
  mode: 'create' | 'edit'
  initialData?: ScheduleItem
  onSubmit: (data: CreateScheduleData) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

/**
 * 建立日程資料類型
 */
export type CreateScheduleData = Omit<ScheduleItem, 'id' | 'createdAt' | 'updatedAt'>

/**
 * 表單預設值
 */
export const DEFAULT_FORM_VALUES: ScheduleFormValues = {
  title: '',
  location: '',
  date: '',
  time: '',
  status: 'upcoming',
  products: '',
  description: '',
  contact: '',
  specialOffer: '',
  weatherNote: '',
}

/**
 * 狀態選項
 */
export const STATUS_OPTIONS = [
  { value: 'upcoming', label: '即將開始' },
  { value: 'ongoing', label: '進行中' },
  { value: 'completed', label: '已結束' },
] as const
