'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/ui/sections'
import { ProductForm } from '@/components/features/products/admin/ProductForm'
import { useProduct } from '@/hooks/useProducts'
import { productsApi } from '@/services/api'
import { useToast } from '@/components/ui/feedback/toast'
import type { UpdateProductData } from '@/types/product'

interface AdminProductEditPageProps {
  params: Promise<{ id: string }>
}

/**
 * 編輯產品頁面
 *
 * 功能：
 * - 載入現有產品資料
 * - 編輯產品資訊
 * - 上傳/更新產品圖片
 * - 儲存後導回列表頁
 */
export default function AdminProductEditPage({ params }: AdminProductEditPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { success, error: showError } = useToast()
  const { product, isLoading: isLoadingProduct, error: loadError } = useProduct(id)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: UpdateProductData, _images: File[]) => {
    if (!id) return

    setIsSubmitting(true)
    try {
      // 直接使用表單資料（已是 API 格式）
      const apiData = {
        name: data.name,
        description: data.description,
        category: data.category,
        price: data.price,
        priceUnit: data.priceUnit,
        unitQuantity: data.unitQuantity,
        originalPrice: data.originalPrice,
        isOnSale: data.isOnSale,
        saleEndDate: data.saleEndDate,
        stock: data.stock,
        isActive: data.isActive,
      }

      // 更新產品資料
      await productsApi.update(id, apiData)

      // TODO: 圖片上傳功能待後端 API 支援後實作

      success('儲存成功', '產品資料已更新')
      router.push('/admin/products')
    } catch (err) {
      console.error('更新產品失敗:', err)
      showError('儲存失敗', err instanceof Error ? err.message : '請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/admin/products')
  }

  // 載入中狀態
  if (isLoadingProduct) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader title="編輯產品" subtitle="載入中..." />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-tea" />
        </div>
      </div>
    )
  }

  // 錯誤狀態
  if (loadError || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader title="編輯產品" subtitle="發生錯誤" />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 mb-4">
              {loadError || '找不到該產品'}
            </p>
            <button
              onClick={() => router.push('/admin/products')}
              className="btn btn-secondary"
            >
              返回產品列表
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="編輯產品"
        subtitle={`編輯「${product.name}」的資訊`}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 返回按鈕 */}
        <button
          onClick={handleCancel}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回產品列表
        </button>

        <ProductForm
          mode="edit"
          initialData={product}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  )
}
