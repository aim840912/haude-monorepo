import type { Location } from '@/types/location'

/**
 * 表單值類型
 */
export interface LocationFormValues {
  name: string
  title: string
  address: string
  landmark: string
  phone: string
  lineId: string
  hours: string
  closedDays: string
  parking: string
  publicTransport: string
  features: string
  specialties: string
  lat: string
  lng: string
  image: string
  imageFile?: File
  isMain: boolean
}

/**
 * 表單錯誤類型
 */
export interface LocationFormErrors {
  name?: string
  address?: string
  phone?: string
  hours?: string
}

/**
 * 表單 Props
 */
export interface LocationFormProps {
  mode: 'create' | 'edit'
  initialData?: Location
  onSubmit: (data: CreateLocationData) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

/**
 * 建立據點資料類型
 */
export type CreateLocationData = Omit<Location, 'id' | 'createdAt' | 'updatedAt'> & {
  imageFile?: File
}

/**
 * 表單預設值
 */
export const DEFAULT_FORM_VALUES: LocationFormValues = {
  name: '',
  title: '',
  address: '',
  landmark: '',
  phone: '',
  lineId: '',
  hours: '',
  closedDays: '',
  parking: '',
  publicTransport: '',
  features: '',
  specialties: '',
  lat: '',
  lng: '',
  image: '',
  isMain: false,
}
