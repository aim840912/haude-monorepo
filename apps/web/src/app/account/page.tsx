'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores/authStore'
import { User, ShoppingBag, Heart, MapPin, LogOut, ChevronRight } from 'lucide-react'

export default function AccountPage() {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/account')
    }
  }, [isAuthenticated, router])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    )
  }

  const menuItems = [
    {
      icon: ShoppingBag,
      label: '我的訂單',
      href: '/orders',
      description: '查看訂單狀態與歷史記錄',
    },
    {
      icon: Heart,
      label: '收藏商品',
      href: '/favorites',
      description: '瀏覽您收藏的商品',
    },
    {
      icon: MapPin,
      label: '收貨地址',
      href: '/account/addresses',
      description: '管理您的收貨地址',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* 用戶資訊卡片 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-green-600" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-500">{user.email}</p>
            </div>
          </div>
        </div>

        {/* 功能選單 */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                  index !== menuItems.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
            )
          })}
        </div>

        {/* 登出按鈕 */}
        <button
          onClick={handleLogout}
          className="w-full bg-white rounded-2xl shadow-sm p-4 flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">登出</span>
        </button>
      </div>
    </div>
  )
}
