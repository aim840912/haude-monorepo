'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/sections'
import { ScheduleForm } from '@/components/features/schedules/admin/ScheduleForm'
import { schedulesApi } from '@/services/api'
import { useToast } from '@/components/ui/feedback/toast'
import type { CreateScheduleData } from '@/components/features/schedules/admin/ScheduleForm.types'

/**
 * 建立日程頁面
 */
export default function AdminScheduleCreatePage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: CreateScheduleData) => {
    setIsSubmitting(true)
    try {
      await schedulesApi.create(data)
      showToast({
        type: 'success',
        title: '建立成功',
        message: '日程已成功建立',
      })
      router.push('/admin/schedules')
    } catch {
      showToast({
        type: 'error',
        title: '建立失敗',
        message: '日程建立失敗，請稍後再試',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/admin/schedules')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="建立日程" subtitle="新增活動日程" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ScheduleForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  )
}
