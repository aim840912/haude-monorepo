/**
 * 農場特色區域
 * 使用 Framer Motion whileInView 自管理滾動觸發動畫
 */

'use client'

import { motion } from 'framer-motion'
import { FeatureCards } from './FeatureCards'
import { fadeInUp, staggerContainer, viewportConfig } from '@/lib/motion'

interface FeaturesSectionProps {
  activeFeature: number
  onFeatureClick: (index: number) => void
  featureImages: string[]
}

export function FeaturesSection({
  activeFeature,
  onFeatureClick,
  featureImages,
}: FeaturesSectionProps) {
  return (
    <section className="py-24 px-6 bg-[#f8f5f0]">
      <motion.div
        variants={staggerContainer(0.15)}
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
        className="max-w-7xl mx-auto"
      >
        <motion.h2
          variants={fadeInUp}
          className="text-4xl md:text-5xl font-serif text-center text-[#3e2723] mb-6 tracking-wider"
        >
          農場特色
        </motion.h2>
        <motion.p
          variants={fadeInUp}
          className="text-center text-[#5d4037] text-lg mb-16 max-w-2xl mx-auto"
        >
          以自然農法為本，結合現代技術與傳統智慧，打造永續經營的生態農場
        </motion.p>

        {/* 核心特色卡片 */}
        <FeatureCards
          activeFeature={activeFeature}
          onFeatureClick={onFeatureClick}
          featureImages={featureImages}
        />
      </motion.div>
    </section>
  )
}
