'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  MapPin,
  Phone,
  Clock,
  Car,
  Train,
  ArrowLeft,
  MessageCircle,
  Navigation,
} from 'lucide-react'
import { PLACEHOLDER_IMAGES } from '@/config/placeholder.config'

// 圖片資料型別
export interface LocationImageData {
  id: string
  storageUrl: string
  altText?: string
  displayPosition: number
}

// 地點資料型別（從 Server Component 傳入）
export interface LocationData {
  id: string
  name: string
  title?: string
  address: string
  landmark?: string
  phone?: string
  lineId?: string
  hours?: string
  closedDays?: string
  parking?: string
  publicTransport?: string
  features?: string[]
  specialties?: string[]
  coordinates?: {
    lat: number
    lng: number
  }
  image?: string
  images?: LocationImageData[]
  isMain?: boolean
}

interface LocationDetailClientProps {
  location: LocationData
}

/**
 * 地點詳情頁 - 客戶端元件
 *
 * 處理導航連結和聯絡功能
 */
export function LocationDetailClient({ location }: LocationDetailClientProps) {
  // Google Maps 導航連結
  const googleMapsUrl = location.coordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${location.coordinates.lat},${location.coordinates.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 返回導航 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/locations"
            className="inline-flex items-center text-gray-600 hover:text-green-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回販售據點列表
          </Link>
        </div>
      </div>

      {/* 主要內容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* 左側：詳細資訊 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 圖片 */}
            <div className="aspect-video bg-gray-200 rounded-xl overflow-hidden relative">
              <Image
                src={location.images?.[0]?.storageUrl || location.image || PLACEHOLDER_IMAGES.location(location.id)}
                alt={location.images?.[0]?.altText || location.name}
                fill
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover"
              />
            </div>

            {/* 標題 */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                {location.isMain && (
                  <span className="px-3 py-1 bg-green-500 text-white text-sm font-medium rounded-full">
                    總部
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900">{location.name}</h1>
              {location.title && (
                <p className="text-lg text-gray-600 mt-1">{location.title}</p>
              )}
            </div>

            {/* 地址與導航 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-medium text-gray-900 mb-4">地址資訊</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-700">{location.address}</p>
                    {location.landmark && (
                      <p className="text-gray-500 text-sm mt-1">（{location.landmark}）</p>
                    )}
                  </div>
                </div>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Navigation className="w-4 h-4" />
                  開啟 Google Maps 導航
                </a>
              </div>
            </div>

            {/* 營業資訊 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-medium text-gray-900 mb-4">營業資訊</h2>
              <div className="space-y-4">
                {location.hours && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">營業時間</p>
                      <p className="text-gray-700">{location.hours}</p>
                    </div>
                  </div>
                )}
                {location.closedDays && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">公休日</p>
                      <p className="text-gray-700">{location.closedDays}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 交通資訊 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-medium text-gray-900 mb-4">交通資訊</h2>
              <div className="space-y-4">
                {location.parking && (
                  <div className="flex items-start gap-3">
                    <Car className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">停車資訊</p>
                      <p className="text-gray-700">{location.parking}</p>
                    </div>
                  </div>
                )}
                {location.publicTransport && (
                  <div className="flex items-start gap-3">
                    <Train className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">大眾運輸</p>
                      <p className="text-gray-700">{location.publicTransport}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 特色與專長 */}
            {((location.features && location.features.length > 0) ||
              (location.specialties && location.specialties.length > 0)) && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-medium text-gray-900 mb-4">特色服務</h2>
                <div className="space-y-4">
                  {location.features && location.features.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">據點特色</p>
                      <div className="flex flex-wrap gap-2">
                        {location.features.map((feature, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {location.specialties && location.specialties.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">販售商品</p>
                      <div className="flex flex-wrap gap-2">
                        {location.specialties.map((specialty, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-amber-100 text-amber-700 text-sm rounded-full"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 右側：聯絡資訊卡片 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-[calc(var(--header-height)+1rem)]">
              <h3 className="text-lg font-medium text-gray-900 mb-4">聯絡我們</h3>

              <div className="space-y-4">
                {location.phone && (
                  <a
                    href={`tel:${location.phone}`}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Phone className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-500">電話</p>
                      <p className="text-green-700 font-medium">{location.phone}</p>
                    </div>
                  </a>
                )}

                {location.lineId && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-500">Line ID</p>
                      <p className="text-gray-700 font-medium">{location.lineId}</p>
                    </div>
                  </div>
                )}
              </div>

              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Navigation className="w-5 h-5" />
                導航至此地點
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
