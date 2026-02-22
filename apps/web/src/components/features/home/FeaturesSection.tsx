/**
 * 農場特色區域
 * 標題裝飾（英文副標 + 金色分隔線）+ 飄浮茶葉 scroll-linked 視差
 * + FeatureCards 卡片視差效果
 */

'use client'

import { useRef } from 'react'
import { motion, useTransform } from 'framer-motion'
import { Leaf } from 'lucide-react'
import { FeatureCards } from './FeatureCards'
import { fadeInUp, staggerContainer, viewportConfig } from '@/lib/motion'
import { useElementScroll } from '@/hooks/useElementScroll'

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
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useElementScroll(sectionRef)

  // 3 片裝飾茶葉各自不同方向的視差位移
  const leaf1Y = useTransform(scrollYProgress, [0, 1], [30, -50])
  const leaf1X = useTransform(scrollYProgress, [0, 1], [0, 15])
  const leaf2Y = useTransform(scrollYProgress, [0, 1], [-20, 40])
  const leaf2X = useTransform(scrollYProgress, [0, 1], [0, -10])
  const leaf3Y = useTransform(scrollYProgress, [0, 1], [15, -35])

  return (
    <section ref={sectionRef} className="relative py-24 px-6 bg-[#f8f5f0] overflow-hidden">
      {/* 裝飾性茶葉圖示 — scroll-linked 視差 */}
      <motion.div style={{ y: leaf1Y, x: leaf1X }} className="absolute top-12 left-[10%] transform-gpu">
        <Leaf className="w-12 h-12 text-[#3e2723]/5" />
      </motion.div>
      <motion.div style={{ y: leaf2Y, x: leaf2X }} className="absolute bottom-16 right-[8%] transform-gpu">
        <Leaf className="w-16 h-16 text-[#3e2723]/[0.08]" />
      </motion.div>
      <motion.div style={{ y: leaf3Y }} className="absolute top-1/3 right-[15%] transform-gpu">
        <Leaf className="w-10 h-10 text-[#3e2723]/5" />
      </motion.div>

      <motion.div
        variants={staggerContainer(0.15)}
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
        className="max-w-7xl mx-auto relative z-10"
      >
        {/* 英文副標 */}
        <motion.p
          variants={fadeInUp}
          className="text-xs tracking-[0.3em] uppercase text-[#d4af37] text-center mb-3"
        >
          FARM HIGHLIGHTS
        </motion.p>

        {/* 金色裝飾分隔線 + 菱形點綴 */}
        <motion.div variants={fadeInUp} className="flex items-center justify-center gap-3 mb-6">
          <span className="block w-12 h-px bg-[#d4af37]/40" />
          <span className="block w-2 h-2 rotate-45 border border-[#d4af37]/60" />
          <span className="block w-12 h-px bg-[#d4af37]/40" />
        </motion.div>

        <motion.h2
          variants={fadeInUp}
          className="text-4xl md:text-5xl font-serif-display text-center text-[#3e2723] mb-6 tracking-wider"
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
          scrollYProgress={scrollYProgress}
        />
      </motion.div>
    </section>
  )
}
