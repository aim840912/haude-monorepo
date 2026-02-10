/**
 * 客戶評價區段
 * 3 欄卡片佈局，使用 Framer Motion stagger + tea-card hover
 * 裝飾性引號 SVG 旋轉淡入
 * + scroll-linked 視差卡片（中間最快、兩側較慢）
 */

'use client'

import { useRef } from 'react'
import { motion, useTransform } from 'framer-motion'
import { StarRating } from '@/components/features/reviews/StarRating'
import { BadgeCheck } from 'lucide-react'
import {
  fadeInUp,
  staggerContainer,
  staggerItem,
  scaleIn,
  viewportConfig,
} from '@/lib/motion'
import { useElementScroll } from '@/hooks/useElementScroll'

const testimonials = [
  {
    rating: 5,
    text: '第一次喝到這麼清甜的高山茶，完全不苦澀。送禮也很有面子，包裝很用心。',
    author: '林小姐',
    product: '阿里山金萱茶',
    verified: true,
  },
  {
    rating: 5,
    text: '紅肉李超好吃！果肉飽滿多汁，小朋友搶著吃。已經連續三年回購了。',
    author: '陳先生',
    product: '梅山紅肉李',
    verified: true,
  },
  {
    rating: 4,
    text: '農場體驗很棒，老闆很親切地介紹茶葉知識。買了現場烘焙的茶帶回家，香氣十足。',
    author: '王太太',
    product: '農場體驗',
    verified: true,
  },
]

export function TestimonialsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useElementScroll(sectionRef)

  // 3 張卡片各自不同的視差速度：兩側慢、中間快（不能用 .map 呼叫 hooks）
  const card0Y = useTransform(scrollYProgress, [0, 1], [15, -15])
  const card1Y = useTransform(scrollYProgress, [0, 1], [35, -35])
  const card2Y = useTransform(scrollYProgress, [0, 1], [15, -15])
  const cardYValues = [card0Y, card1Y, card2Y]

  return (
    <section ref={sectionRef} className="py-20 px-6 bg-[#f8f5f0] dark:bg-[#1a120d]">
      <motion.div
        variants={staggerContainer(0.15)}
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
        className="max-w-7xl mx-auto"
      >
        <motion.h2
          variants={fadeInUp}
          className="text-4xl md:text-5xl font-serif text-center text-[#3e2723] dark:text-[#d7ccc8] mb-4"
        >
          茶友回饋
        </motion.h2>
        <motion.p
          variants={fadeInUp}
          className="text-center text-[#5d4037] dark:text-[#bcaaa4] text-lg mb-12"
        >
          來自真實客戶的評價
        </motion.p>

        <motion.div
          variants={staggerContainer(0.2)}
          className="grid md:grid-cols-3 gap-8"
        >
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              variants={staggerItem}
              style={{ y: cardYValues[i] }}
              className="tea-card bg-white dark:bg-[#2d1f1a] rounded-2xl p-8 shadow-lg relative transform-gpu"
            >
              {/* 裝飾性引號 */}
              <motion.svg
                variants={scaleIn}
                className="absolute -top-3 -left-2 w-10 h-10 text-[#d4af37]/20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10H0z" />
              </motion.svg>

              <StarRating rating={t.rating} size="sm" />
              <p className="mt-4 text-gray-700 dark:text-gray-300 text-lg italic leading-relaxed">
                {`\u300C${t.text}\u300D`}
              </p>
              <div className="mt-6 flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#3e2723] dark:text-[#d7ccc8]">
                    {t.author}
                  </p>
                  <p className="text-sm text-gray-500">{t.product}</p>
                </div>
                {t.verified && (
                  <div className="flex items-center text-green-600 text-xs">
                    <BadgeCheck className="w-4 h-4 mr-1" />
                    已驗證購買
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
