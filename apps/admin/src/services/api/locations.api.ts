import { api } from './client'
import type { UploadUrlResponse } from './products.api'

// ==================== Locations API ====================
// 門市據點管理

export const locationsApi = {
  // 公開 API
  getAll: () => api.get('/locations'),
  getMain: () => api.get('/locations/main'),
  getById: (id: string) => api.get(`/locations/${id}`),
  // 管理員 API
  getAllAdmin: () => api.get('/admin/locations'),
  createDraft: () => api.post('/admin/locations/draft'),
  create: (data: {
    name: string
    address: string
    title?: string
    landmark?: string
    phone?: string
    lineId?: string
    hours?: string
    closedDays?: string
    parking?: string
    publicTransport?: string
    features?: string[]
    specialties?: string[]
    lat?: number
    lng?: number
    image?: string
    isMain?: boolean
    isActive?: boolean
  }) => api.post('/admin/locations', data),
  update: (
    id: string,
    data: {
      name?: string
      address?: string
      title?: string
      landmark?: string
      phone?: string
      lineId?: string
      hours?: string
      closedDays?: string
      parking?: string
      publicTransport?: string
      features?: string[]
      specialties?: string[]
      lat?: number
      lng?: number
      image?: string
      isMain?: boolean
      isActive?: boolean
    }
  ) => api.put(`/admin/locations/${id}`, data),
  delete: (id: string) => api.delete(`/admin/locations/${id}`),
}

// ==================== Location Images API ====================

export interface LocationImage {
  id: string
  locationId: string
  storageUrl: string
  filePath: string
  altText?: string
  displayPosition: number
  size: 'thumbnail' | 'medium' | 'large'
  createdAt: string
  updatedAt: string
}

export const locationImagesApi = {
  // 取得據點的所有圖片
  getImages: (locationId: string) =>
    api.get<LocationImage[]>(`/admin/locations/${locationId}/images`),

  // 取得上傳 URL（用於前端直傳到 Supabase）
  getUploadUrl: (locationId: string, fileName: string) =>
    api.post<UploadUrlResponse>(`/admin/locations/${locationId}/images/upload-url`, {
      fileName,
    }),

  // 新增圖片記錄（上傳完成後呼叫）
  addImage: (
    locationId: string,
    data: {
      storageUrl: string
      filePath: string
      altText?: string
      displayPosition?: number
      size?: 'thumbnail' | 'medium' | 'large'
    }
  ) => api.post<LocationImage>(`/admin/locations/${locationId}/images`, data),

  // 更新圖片資訊
  updateImage: (
    locationId: string,
    imageId: string,
    data: {
      altText?: string
      displayPosition?: number
    }
  ) => api.put<LocationImage>(`/admin/locations/${locationId}/images/${imageId}`, data),

  // 刪除圖片
  deleteImage: (locationId: string, imageId: string) =>
    api.delete(`/admin/locations/${locationId}/images/${imageId}`),

  // 重新排序圖片
  reorderImages: (locationId: string, imageIds: string[]) =>
    api.put<LocationImage[]>(`/admin/locations/${locationId}/images/reorder`, {
      imageIds,
    }),
}
