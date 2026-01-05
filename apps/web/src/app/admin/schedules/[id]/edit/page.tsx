'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/sections'
import { ScheduleForm } from '@/components/features/schedules/admin/ScheduleForm'
import { schedulesApi } from '@/services/api'
import { useToast } from '@/components/ui/feedback/toast'
import type { ScheduleItem } from '@/types/schedule'
import type { CreateScheduleData } from '@/components/features/schedules/admin/ScheduleForm.types'

interface AdminScheduleEditPageProps {
  params: Promise<{ id: string }>
}

/**
 * 編輯日程頁面
 */
export default function AdminScheduleEditPage({ params }: AdminScheduleEditPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { showToast } = useToast()

  const [schedule, setSchedule] = useState<ScheduleItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 載入日程資料
  useEffect(() => {
    const loadSchedule = async () => {
      if (!id) return

      setIsLoading(true)
      try {
        const { data } = await schedulesApi.getById(id)
        if (data) {
          setSchedule(data)
        } else {
          showToast({
            type: 'error',
            title: '找不到日程',
            message: '請確認日程是否存在',
          })
          router.push('/admin/schedules')
        }
      } finally {
        setIsLoading(false)
      }
    }
    loadSchedule()
  }, [id, router, showToast])

  const handleSubmit = async (data: CreateScheduleData) => {
    if (!id) return

    setIsSubmitting(true)
    try {
      await schedulesApi.update(id, data)
      showToast({
        type: 'success',
        title: '更新成功',
        message: '日程已成功更新',
      })
      router.push('/admin/schedules')
    } catch {
      showToast({
        type: 'error',
        title: '更新失敗',
        message: '日程更新失敗，請稍後再試',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/admin/schedules')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!schedule) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="編輯日程" subtitle={schedule.title} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ScheduleForm
          mode="edit"
          initialData={schedule}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  )
}
