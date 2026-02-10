import React from 'react'
import { Leaf } from 'lucide-react'
import { motion } from 'framer-motion'
import { fadeInUp } from '@/lib/motion'

interface SectionHeaderProps {
  /** 標題 */
  title?: string
  /** 副標題 */
  subtitle?: string
  /** 特色說明 */
  feature?: string
}

/**
 * 區段標題元件
 *
 * 用於首頁各區段的標題顯示，動畫由父層 Framer Motion stagger 管理
 */
export const SectionHeader = React.memo<SectionHeaderProps>(({
  title = '經典產品',
  subtitle = '精選來自梅山的優質農產品',
  feature = '100% 有機無毒栽培',
}) => {
  return (
    <motion.div variants={fadeInUp} className="text-center mb-16">
      <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
        {title}
      </h2>
      <p className="text-gray-600 text-lg mb-2">{subtitle}</p>
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <Leaf className="w-4 h-4 text-green-600" />
        <span>{feature}</span>
      </div>
    </motion.div>
  )
})

SectionHeader.displayName = 'SectionHeader'
