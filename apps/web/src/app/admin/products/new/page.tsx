'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/ui/sections'
import { ProductForm } from '@/components/features/products/admin/ProductForm'
import { productsApi } from '@/services/api'
import { useToast } from '@/components/ui/feedback/toast'
import type { CreateProductData, UpdateProductData } from '@/types/product'

/**
 * 新增產品頁面
 *
 * 功能：
 * - 填寫產品資訊表單
 * - 上傳產品圖片
 * - 建立產品後導回列表頁
 */
export default function AdminProductCreatePage() {
  const router = useRouter()
  const { success, error: showError } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: CreateProductData | UpdateProductData, _images: File[]) => {
    setIsSubmitting(true)
    try {
      // 在 create 模式下，所有必填欄位都應該存在
      // 直接使用表單資料（已是 API 格式）
      const apiData = {
        name: data.name as string,
        description: data.description as string,
        category: data.category as string,
        price: data.price as number,
        priceUnit: data.priceUnit,
        unitQuantity: data.unitQuantity,
        originalPrice: data.originalPrice,
        isOnSale: data.isOnSale,
        saleEndDate: data.saleEndDate,
        stock: data.stock as number,
        isActive: data.isActive,
      }

      // 建立產品
      const response = await productsApi.create(apiData)
      const product = response.data

      // TODO: 圖片上傳功能待後端 API 支援後實作

      success('建立成功', `產品「${product.name}」已成功建立`)
      router.push('/admin/products')
    } catch (err) {
      console.error('建立產品失敗:', err)
      showError('建立失敗', err instanceof Error ? err.message : '請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/admin/products')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="新增產品" subtitle="填寫產品資訊以建立新產品" />

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
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  )
}
