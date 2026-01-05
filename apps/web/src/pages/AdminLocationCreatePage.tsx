import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/sections'
import { LocationForm } from '@/components/features/location/admin/LocationForm'
import { locationsApi } from '@/services/api'
import { useToast } from '@/components/ui/feedback/toast'
import type { CreateLocationData } from '@/components/features/location/admin/LocationForm.types'

/**
 * 建立據點頁面
 */
export function AdminLocationCreatePage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: CreateLocationData) => {
    setIsSubmitting(true)
    try {
      await locationsApi.create(data)
      showToast({
        type: 'success',
        title: '建立成功',
        message: '據點已成功建立',
      })
      navigate('/admin/locations')
    } catch {
      showToast({
        type: 'error',
        title: '建立失敗',
        message: '據點建立失敗，請稍後再試',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate('/admin/locations')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="建立據點" subtitle="新增販售據點" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LocationForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  )
}
