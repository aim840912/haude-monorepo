'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ArrowLeft,
  Loader2,
  CheckCircle,
} from 'lucide-react'
import { useFarmTour, useFarmTourBooking } from '@/hooks/useFarmTours'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

interface FarmTourDetailPageProps {
  params: Promise<{ id: string }>
}

/**
 * 農場體驗詳情頁
 *
 * 功能：
 * - 顯示體驗活動詳細資訊
 * - 預約功能
 */
export default function FarmTourDetailPage({ params }: FarmTourDetailPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { tour, isLoading, error } = useFarmTour(id)
  // autoFetch: false 避免未登入時自動呼叫需要認證的 API
  const { createBooking, isSubmitting, error: bookingError } = useFarmTourBooking({ autoFetch: false })
  const [bookingSuccess, setBookingSuccess] = useState(false)

  const handleBook = async () => {
    if (!id) return

    // 未登入則跳轉登入頁，登入後返回此頁
    if (!isAuthenticated) {
      router.push(`/login?from=/farm-tours/${id}`)
      return
    }

    const result = await createBooking({
      tourId: id,
      participants: 1,
      contactName: '訪客',
      contactPhone: '0912345678',
    })
    if (result) {
      setBookingSuccess(true)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  if (error || !tour) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="text-red-600 mb-4">{error || '找不到此體驗活動'}</p>
          <Link href="/farm-tours" className="text-green-600 hover:underline">
            返回農場體驗列表
          </Link>
        </div>
      </div>
    )
  }

  const statusLabels = {
    upcoming: '即將開始',
    ongoing: '進行中',
    completed: '已結束',
    cancelled: '已取消',
  }

  const statusColors = {
    upcoming: 'bg-blue-100 text-blue-800',
    ongoing: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  const typeLabels = {
    harvest: '採收體驗',
    workshop: '手作工坊',
    tour: '農場導覽',
    tasting: '品嚐會',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 返回導航 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/farm-tours"
            className="inline-flex items-center text-gray-600 hover:text-green-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回農場體驗列表
          </Link>
        </div>
      </div>

      {/* 主要內容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* 左側：詳細資訊 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 圖片 */}
            {tour.imageUrl && (
              <div className="aspect-video bg-gray-200 rounded-xl overflow-hidden">
                <img
                  src={tour.imageUrl}
                  alt={tour.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* 標題和狀態 */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className={cn('px-3 py-1 rounded-full text-sm font-medium', statusColors[tour.status])}>
                  {statusLabels[tour.status]}
                </span>
                <span className="text-sm text-gray-500">{typeLabels[tour.type]}</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">{tour.name}</h1>
            </div>

            {/* 描述 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-medium text-gray-900 mb-4">活動介紹</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {tour.description}
              </p>
            </div>

            {/* 活動詳情 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-medium text-gray-900 mb-4">活動詳情</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-gray-600">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-500">日期</p>
                    <p className="font-medium">{tour.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Clock className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-500">時間</p>
                    <p className="font-medium">{tour.startTime} - {tour.endTime}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <MapPin className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-500">地點</p>
                    <p className="font-medium">{tour.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Users className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-500">人數</p>
                    <p className="font-medium">
                      {tour.currentParticipants} / {tour.maxParticipants} 人
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 右側：預約卡片 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-[calc(var(--header-height)+1rem)]">
              <div className="text-center mb-6">
                <p className="text-3xl font-bold text-green-600">
                  NT$ {tour.price.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">每人</p>
              </div>

              {/* 預約狀態訊息 */}
              {bookingSuccess && (
                <div className="mb-4 p-3 bg-green-50 rounded-lg flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span>預約成功！我們會盡快與您聯繫</span>
                </div>
              )}

              {bookingError && (
                <div className="mb-4 p-3 bg-red-50 rounded-lg text-red-700">
                  {bookingError}
                </div>
              )}

              {/* 預約按鈕 */}
              <button
                onClick={handleBook}
                disabled={isSubmitting || tour.status !== 'upcoming' || bookingSuccess}
                className={cn(
                  'w-full py-3 rounded-lg font-medium transition-colors',
                  tour.status === 'upcoming' && !bookingSuccess
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                )}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    預約中...
                  </span>
                ) : bookingSuccess ? (
                  '已預約'
                ) : tour.status !== 'upcoming' ? (
                  '無法預約'
                ) : !isAuthenticated ? (
                  '登入後預約'
                ) : (
                  '立即預約'
                )}
              </button>

              {/* 剩餘名額 */}
              {tour.status === 'upcoming' && (
                <p className="mt-3 text-center text-sm text-gray-500">
                  剩餘 {tour.maxParticipants - tour.currentParticipants} 個名額
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
