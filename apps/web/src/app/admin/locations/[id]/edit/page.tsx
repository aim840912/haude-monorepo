'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/sections'
import { LocationForm } from '@/components/features/location/admin/LocationForm'
import { locationsApi } from '@/services/api'
import { useToast } from '@/components/ui/feedback/toast'
import type { Location } from '@/types/location'
import type { CreateLocationData } from '@/components/features/location/admin/LocationForm.types'

interface AdminLocationEditPageProps {
  params: Promise<{ id: string }>
}

/**
 * 編輯據點頁面
 */
export default function AdminLocationEditPage({ params }: AdminLocationEditPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { showToast } = useToast()

  const [location, setLocation] = useState<Location | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 載入據點資料
  useEffect(() => {
    const loadLocation = async () => {
      if (!id) return

      setIsLoading(true)
      try {
        const { data } = await locationsApi.getById(id)
        if (data) {
          setLocation(data)
        } else {
          showToast({
            type: 'error',
            title: '找不到據點',
            message: '請確認據點是否存在',
          })
          router.push('/admin/locations')
        }
      } finally {
        setIsLoading(false)
      }
    }
    loadLocation()
  }, [id, router, showToast])

  const handleSubmit = async (data: CreateLocationData) => {
    if (!id) return

    setIsSubmitting(true)
    try {
      await locationsApi.update(id, data)
      showToast({
        type: 'success',
        title: '更新成功',
        message: '據點已成功更新',
      })
      router.push('/admin/locations')
    } catch {
      showToast({
        type: 'error',
        title: '更新失敗',
        message: '據點更新失敗，請稍後再試',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/admin/locations')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!location) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="編輯據點" subtitle={location.name} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LocationForm
          mode="edit"
          initialData={location}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  )
}
