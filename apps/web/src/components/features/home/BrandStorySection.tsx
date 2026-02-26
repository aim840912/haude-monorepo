/**
 * 品牌故事區段
 * 深棕背景 + 左文右圖佈局，創造沉浸式品牌敘事
 * 左欄從左滑入 + scroll-linked y 位移、右欄從右滑入 + scroll-linked scale
 * 年份徽章彈入 + 金色光暈 + scroll-linked rotate
 */

'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { motion, useTransform } from 'framer-motion'
import {
  fadeInLeft,
  fadeInRight,
  scaleIn,
  clipReveal,
  staggerContainer,
  viewportConfig,
} from '@/lib/motion'
import { useElementScroll } from '@/hooks/useElementScroll'

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1556881286-fc6915169721?w=800&h=1067&fit=crop'

interface BrandStorySectionProps {
  imageUrl?: string
}

export function BrandStorySection({ imageUrl }: BrandStorySectionProps) {
  const brandStoryImage = imageUrl || DEFAULT_IMAGE
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useElementScroll(sectionRef)

  // 左欄文字：微視差上移
  const textY = useTransform(scrollYProgress, [0, 1], [40, -40])
  // 右欄圖片：隨滾動微放大
  const imageScale = useTransform(scrollYProgress, [0, 1], [0.95, 1.05])
  // 年份徽章：微旋轉
  const badgeRotate = useTransform(scrollYProgress, [0, 1], [-5, 5])

  return (
    <section ref={sectionRef} className="py-24 px-6 bg-[#3e2723] text-white overflow-hidden">
      <motion.div
        variants={staggerContainer(0.2)}
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
        className="max-w-7xl mx-auto"
      >
        <div className="grid lg:grid-cols-5 gap-12 items-center">
          {/* 左欄：文字 (3/5) - 從左滑入 + 視差 y 位移 */}
          <motion.div
            variants={fadeInLeft}
            style={{ y: textY }}
            className="lg:col-span-3 transform-gpu"
          >
            <p className="text-[#d4af37] tracking-[0.3em] text-sm mb-4 uppercase">
              百年傳承
            </p>
            <h2 className="text-4xl md:text-5xl font-serif text-white mb-8 leading-tight">
              從梅山群峰
              <br />
              到您的茶杯
            </h2>
            <div className="space-y-4 text-white/80 text-lg leading-relaxed">
              <p>
                座落嘉義梅山海拔一千公尺的茶園，豪德製茶所以三代人的堅持，
                守護著這片土地最純粹的風味。
              </p>
              <p>
                我們相信好茶來自好土地。不使用化學農藥與肥料，
                讓茶樹在最自然的環境中生長，每一口都是山林的味道。
              </p>
            </div>
            <Link
              href="/about"
              className="inline-flex items-center mt-8 text-[#d4af37] hover:text-[#ffd54f] transition-colors text-lg"
            >
              了解我們的故事
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </motion.div>

          {/* 右欄：圖片 (2/5) - 從右滑入 + 視差 scale */}
          <motion.div
            variants={fadeInRight}
            className="lg:col-span-2 relative"
          >
            {/* 圖片 clipPath reveal + scroll-linked scale */}
            <motion.div
              variants={clipReveal}
              style={{ scale: imageScale }}
              className="relative aspect-[3/4] rounded-2xl overflow-hidden transform-gpu"
            >
              <Image
                src={brandStoryImage}
                alt="豪德製茶所梅山茶園"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </motion.div>
            {/* 年份徽章 - 彈入 + 金色光暈 + scroll-linked rotate */}
            <motion.div
              variants={scaleIn}
              style={{ rotate: badgeRotate }}
              className="absolute -bottom-4 -left-4 bg-[#d4af37] text-[#3e2723] px-6 py-3 rounded-xl shadow-lg animate-gold-glow transform-gpu"
            >
              <p className="text-sm font-medium">自然農法</p>
              <p className="text-2xl font-bold font-serif">三代傳承</p>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}
