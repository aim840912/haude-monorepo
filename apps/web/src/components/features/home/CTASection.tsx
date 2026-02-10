/**
 * 訂閱 CTA 區段
 * 深棕背景 + email 訂閱表單 + 農場參觀連結
 * 使用 Framer Motion whileInView 入場動畫
 * + scroll-linked 裝飾性茶葉視差飄動
 */

'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { Mail, MapPin, Leaf } from 'lucide-react'
import { motion, useTransform } from 'framer-motion'
import {
  fadeInUp,
  staggerContainer,
  staggerItem,
  viewportConfig,
  spring,
} from '@/lib/motion'
import { useElementScroll } from '@/hooks/useElementScroll'

export function CTASection() {
  const [email, setEmail] = useState('')
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useElementScroll(sectionRef)

  // 3 片裝飾茶葉各自不同方向的視差位移
  const leaf1Y = useTransform(scrollYProgress, [0, 1], [30, -50])
  const leaf1X = useTransform(scrollYProgress, [0, 1], [0, 15])
  const leaf2Y = useTransform(scrollYProgress, [0, 1], [-20, 40])
  const leaf2X = useTransform(scrollYProgress, [0, 1], [0, -10])
  const leaf3Y = useTransform(scrollYProgress, [0, 1], [15, -35])

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    alert('感謝訂閱！此功能即將上線。')
    setEmail('')
  }

  return (
    <section ref={sectionRef} className="relative py-20 px-6 bg-[#3e2723] text-white overflow-hidden">
      {/* 裝飾性茶葉圖示 — scroll-linked 視差 */}
      <motion.div style={{ y: leaf1Y, x: leaf1X }} className="absolute top-12 left-[10%] transform-gpu">
        <Leaf className="w-12 h-12 text-white/5" />
      </motion.div>
      <motion.div style={{ y: leaf2Y, x: leaf2X }} className="absolute bottom-16 right-[8%] transform-gpu">
        <Leaf className="w-16 h-16 text-white/5" />
      </motion.div>
      <motion.div style={{ y: leaf3Y }} className="absolute top-1/3 right-[15%] transform-gpu">
        <Leaf className="w-10 h-10 text-white/5" />
      </motion.div>

      <motion.div
        variants={staggerContainer(0.15, 0.1)}
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
        className="max-w-4xl mx-auto text-center relative z-10"
      >
        <motion.h2
          variants={fadeInUp}
          className="text-4xl md:text-5xl font-serif mb-4"
        >
          體驗梅山的味道
        </motion.h2>
        <motion.p
          variants={staggerItem}
          className="text-white/70 text-lg mb-10 max-w-2xl mx-auto"
        >
          訂閱通訊，獲得季節限定優惠與農場最新動態
        </motion.p>

        {/* Email 訂閱 - 從下方滑入 */}
        <motion.form
          variants={staggerItem}
          onSubmit={handleSubscribe}
          className="flex flex-col sm:flex-row gap-3 justify-center mb-8"
        >
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="pl-12 pr-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 w-full sm:w-80 focus:outline-none focus:border-[#d4af37]"
            />
          </div>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={spring.snappy}
            className="tea-button bg-[#d35400] hover:bg-[#e67e22] text-white px-8 py-3 rounded-full font-medium transition-colors animate-pulse-glow"
          >
            訂閱
          </motion.button>
        </motion.form>

        {/* 農場參觀 CTA */}
        <motion.div variants={staggerItem}>
          <Link
            href="/farm-tours"
            className="inline-flex items-center text-[#d4af37] hover:text-[#ffd54f] transition-colors"
          >
            <MapPin className="w-5 h-5 mr-2" />
            或者，來農場走走吧
            <span className="ml-1">&rarr;</span>
          </Link>
        </motion.div>

        <motion.p
          variants={staggerItem}
          className="text-white/40 text-xs mt-6"
        >
          不發送垃圾郵件。隨時取消訂閱。
        </motion.p>
      </motion.div>
    </section>
  )
}
