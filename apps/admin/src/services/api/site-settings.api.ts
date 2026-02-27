import { api } from './client'

// ==================== Site Settings API ====================

export interface SiteSetting {
  id: string
  key: string
  value: string
  type: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface SiteImageUploadUrlResponse {
  uploadUrl: string
  filePath: string
  publicUrl: string
}

export const siteSettingsApi = {
  // Get all site settings (admin)
  getAll: () => api.get<SiteSetting[]>('/admin/site-settings'),

  // Get settings by keys (public, comma-separated)
  getByKeys: (keys: string[]) =>
    api.get<SiteSetting[]>(`/site-settings?keys=${keys.join(',')}`),

  // Update or create a setting
  upsert: (key: string, data: { value: string; type?: string; description?: string }) =>
    api.put<SiteSetting>(`/admin/site-settings/${key}`, data),

  // Get pre-signed upload URL for image
  getImageUploadUrl: (key: string, fileName: string, contentType?: string) =>
    api.post<SiteImageUploadUrlResponse>('/admin/site-settings/images/upload-url', {
      key,
      fileName,
      contentType,
    }),

  // Delete a site image (removes from storage + DB)
  deleteImage: (key: string) =>
    api.delete<{ deleted: boolean; key: string }>(
      `/admin/site-settings/images/${encodeURIComponent(key)}`
    ),

  // Delete a single image file from Storage (does not touch DB setting)
  deleteImageFile: (filePath: string) =>
    api.delete<void>('/admin/site-settings/images/file', {
      data: { filePath },
    }),
}
