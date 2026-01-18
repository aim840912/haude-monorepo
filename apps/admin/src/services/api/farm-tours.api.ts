import { api } from './client'
import type { UploadUrlResponse } from './products.api'

// ==================== Farm Tours API ====================

export const farmToursApi = {
  // 公開 API（取得所有活動）
  getAll: () => api.get('/farm-tours'),
  getById: (id: string) => api.get(`/farm-tours/${id}`),
  // 管理員 API
  getAllAdmin: () => api.get('/admin/farm-tours'),
  createDraft: () => api.post('/admin/farm-tours/draft'),
  create: (data: {
    name: string
    description: string
    date: string
    startTime: string
    endTime: string
    price: number
    maxParticipants: number
    location: string
    imageUrl?: string
    type: 'harvest' | 'workshop' | 'tour' | 'tasting'
    tags?: string[]
  }) => api.post('/admin/farm-tours', data),
  update: (
    id: string,
    data: {
      name?: string
      description?: string
      date?: string
      startTime?: string
      endTime?: string
      price?: number
      maxParticipants?: number
      location?: string
      imageUrl?: string
      status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
      type?: 'harvest' | 'workshop' | 'tour' | 'tasting'
      tags?: string[]
    }
  ) => api.put(`/admin/farm-tours/${id}`, data),
  delete: (id: string) => api.delete(`/admin/farm-tours/${id}`),
}

// ==================== Farm Tour Images API ====================

export interface FarmTourImage {
  id: string
  farmTourId: string
  storageUrl: string
  filePath: string
  altText?: string
  displayPosition: number
  size: 'thumbnail' | 'medium' | 'large'
  createdAt: string
  updatedAt: string
}

export const farmTourImagesApi = {
  // 取得農場體驗的所有圖片
  getImages: (farmTourId: string) =>
    api.get<FarmTourImage[]>(`/admin/farm-tours/${farmTourId}/images`),

  // 取得上傳 URL（用於前端直傳到 Supabase）
  getUploadUrl: (farmTourId: string, fileName: string) =>
    api.post<UploadUrlResponse>(`/admin/farm-tours/${farmTourId}/images/upload-url`, {
      fileName,
    }),

  // 新增圖片記錄（上傳完成後呼叫）
  addImage: (
    farmTourId: string,
    data: {
      storageUrl: string
      filePath: string
      altText?: string
      displayPosition?: number
      size?: 'thumbnail' | 'medium' | 'large'
    }
  ) => api.post<FarmTourImage>(`/admin/farm-tours/${farmTourId}/images`, data),

  // 更新圖片資訊
  updateImage: (
    farmTourId: string,
    imageId: string,
    data: {
      altText?: string
      displayPosition?: number
    }
  ) => api.put<FarmTourImage>(`/admin/farm-tours/${farmTourId}/images/${imageId}`, data),

  // 刪除圖片
  deleteImage: (farmTourId: string, imageId: string) =>
    api.delete(`/admin/farm-tours/${farmTourId}/images/${imageId}`),

  // 重新排序圖片
  reorderImages: (farmTourId: string, imageIds: string[]) =>
    api.put<FarmTourImage[]>(`/admin/farm-tours/${farmTourId}/images/reorder`, {
      imageIds,
    }),
}
