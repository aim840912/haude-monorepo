'use client'

import React, { useRef } from 'react'
import { motion, useTransform } from 'framer-motion'
import { useProducts } from '@/hooks/useProducts'
import { ProductCard } from '../ProductCard'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { LoadingState } from './LoadingState'
import { SectionHeader } from './SectionHeader'
import { ViewAllButton } from './ViewAllButton'
import {
  staggerContainer,
  staggerItem,
  fadeInUp,
  viewportConfig,
} from '@/lib/motion'
import { useElementScroll } from '@/hooks/useElementScroll'

interface ProductsSectionProps {
  /** 顯示數量限制 */
  limit?: number
  /** 標題 */
  title?: string
  /** 副標題 */
  subtitle?: string
}

/**
 * 產品區段元件
 *
 * 用於首頁展示精選產品，使用 Framer Motion stagger 入場動畫
 * + scroll-linked 視差漂浮（奇偶卡片不同速度）
 */
export function ProductsSection({
  limit = 3,
  title,
  subtitle,
}: ProductsSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const { products, isLoading, error, refetch } = useProducts()
  const { scrollYProgress } = useElementScroll(sectionRef)

  // 標題區微視差
  const headerY = useTransform(scrollYProgress, [0, 1], [20, -20])
  // 奇數卡片稍快、偶數稍慢
  const oddCardY = useTransform(scrollYProgress, [0, 1], [30, -30])
  const evenCardY = useTransform(scrollYProgress, [0, 1], [15, -15])

  // 限制顯示數量
  const displayProducts = products.slice(0, limit)

  // 始終渲染 section（確保 ref 附加），內容根據狀態切換
  return (
    <section
      ref={sectionRef}
      id="products"
      className="py-16 px-6 bg-white dark:bg-[#2d1f1a]"
    >
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <motion.div
          variants={staggerContainer(0.12)}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          className="max-w-7xl mx-auto"
        >
          <motion.div style={{ y: headerY }} className="transform-gpu">
            <SectionHeader
              title={title}
              subtitle={subtitle}
            />
          </motion.div>

          {displayProducts.length > 0 ? (
            <>
              <motion.div
                variants={staggerContainer(0.12)}
                className="flex flex-wrap justify-center gap-8 mb-12"
              >
                {displayProducts.map((product, i) => (
                  <motion.div
                    key={product.id}
                    variants={staggerItem}
                    style={{ y: i % 2 === 0 ? evenCardY : oddCardY }}
                    className="w-full sm:w-[calc(50%-1rem)] md:w-[calc(33.333%-1.5rem)] lg:w-[calc(25%-1.5rem)] max-w-sm transform-gpu"
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </motion.div>

              <motion.div variants={fadeInUp}>
                <ViewAllButton />
              </motion.div>
            </>
          ) : (
            <EmptyState />
          )}
        </motion.div>
      )}
    </section>
  )
}

ProductsSection.displayName = 'ProductsSection'
