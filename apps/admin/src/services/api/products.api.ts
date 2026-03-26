import { api } from './client'

// ==================== Products API ====================

export const productsApi = {
  getAll: () => api.get('/products'),
  getAllAdmin: () => api.get('/admin/products'),
  getById: (id: string) => api.get(`/products/${id}`),
  createDraft: () => api.post('/admin/products/draft'),
  create: (data: {
    name: string
    description?: string
    price: number
    category?: string
    inventory?: number
    priceUnit?: string
  }) => api.post('/admin/products', data),
  update: (
    id: string,
    data: {
      name?: string
      description?: string
      price?: number
      category?: string
      stock?: number
      isActive?: boolean
      isDraft?: boolean
      priceUnit?: string
    }
  ) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
}

// ==================== Product Images API ====================

export interface ProductImage {
  id: string
  productId: string
  storageUrl: string
  filePath: string
  altText?: string
  displayPosition: number
  size: 'thumbnail' | 'medium' | 'large'
  createdAt: string
  updatedAt: string
}

export interface UploadUrlResponse {
  uploadUrl: string
  filePath: string
  publicUrl: string
}

export const productImagesApi = {
  // 取得產品的所有圖片
  getImages: (productId: string) =>
    api.get<ProductImage[]>(`/admin/products/${productId}/images`),

  // 取得上傳 URL（用於前端直傳到 Supabase）
  getUploadUrl: (productId: string, fileName: string) =>
    api.post<UploadUrlResponse>(`/admin/products/${productId}/images/upload-url`, {
      fileName,
    }),

  // 新增圖片記錄（上傳完成後呼叫）
  addImage: (
    productId: string,
    data: {
      storageUrl: string
      filePath: string
      altText?: string
      displayPosition?: number
      size?: 'thumbnail' | 'medium' | 'large'
    }
  ) => api.post<ProductImage>(`/admin/products/${productId}/images`, data),

  // 更新圖片資訊
  updateImage: (
    productId: string,
    imageId: string,
    data: {
      altText?: string
      displayPosition?: number
    }
  ) => api.put<ProductImage>(`/admin/products/${productId}/images/${imageId}`, data),

  // 刪除圖片
  deleteImage: (productId: string, imageId: string) =>
    api.delete(`/admin/products/${productId}/images/${imageId}`),

  // 重新排序圖片
  reorderImages: (productId: string, imageIds: string[]) =>
    api.put<ProductImage[]>(`/admin/products/${productId}/images/reorder`, {
      imageIds,
    }),
}
