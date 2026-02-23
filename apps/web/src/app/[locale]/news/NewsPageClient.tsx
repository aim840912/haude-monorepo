'use client'

/**
 * Latest News page — Client Component
 *
 * Hero banner + 6 placeholder news cards in responsive grid
 * Uses IntersectionObserver for scroll animation (same pattern as AboutPageClient)
 */

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { Calendar, Tag } from 'lucide-react'

// Hero image (tea garden scene)
const HERO_IMAGE =
  'https://images.unsplash.com/photo-1587049352851-8d4e89133924?w=1920&h=800&fit=crop'

// Category color mapping
const categoryColors: Record<string, { bg: string; text: string }> = {
  harvest: { bg: 'bg-[#e8f5e9]', text: 'text-[#2e7d32]' },
  product: { bg: 'bg-[#fff3e0]', text: 'text-[#d35400]' },
  event: { bg: 'bg-[#efebe9]', text: 'text-[#5d4037]' },
  market: { bg: 'bg-[#e3f2fd]', text: 'text-[#1565c0]' },
}

// Placeholder news data
const newsItems = [
  {
    id: 1,
    date: '2026-02-18',
    categoryKey: 'harvest',
    categoryLabel: '採茶季',
    title: '春茶採收正式啟動',
    summary:
      '梅山海拔千尺茶園迎來今年春茶季，經過冬季休眠，茶芽飽滿翠綠。預計三月中旬開放限量預購，敬請期待。',
    image:
      'https://images.unsplash.com/photo-1563822249548-9a72b6353cd1?w=600&h=400&fit=crop',
  },
  {
    id: 2,
    date: '2026-02-10',
    categoryKey: 'product',
    categoryLabel: '新品上市',
    title: '蜜香紅茶限定禮盒上架',
    summary:
      '嚴選小綠葉蟬咬過的茶菁，以獨特蜜香工法製成。搭配手工竹編禮盒，送禮自用兩相宜。',
    image:
      'https://images.unsplash.com/photo-1558160074-4d93e8e073a1?w=600&h=400&fit=crop',
  },
  {
    id: 3,
    date: '2026-02-05',
    categoryKey: 'event',
    categoryLabel: '農場活動',
    title: '親子採茶體驗日開放報名',
    summary:
      '三月份特別企劃！帶著孩子走進茶園，親手採摘春茶、體驗手揉茶葉，認識茶從產地到茶杯的完整旅程。',
    image:
      'https://images.unsplash.com/photo-1518568814500-bf0f8d125f46?w=600&h=400&fit=crop',
  },
  {
    id: 4,
    date: '2026-01-28',
    categoryKey: 'market',
    categoryLabel: '市集行程',
    title: '三月份擺攤行程公告',
    summary:
      '三月我們將在嘉義文化夜市、台中審計新村、台北希望廣場與大家見面。現場提供免費試飲，歡迎來找我們聊茶。',
    image:
      'https://images.unsplash.com/photo-1556881286-fc6915169721?w=600&h=400&fit=crop',
  },
  {
    id: 5,
    date: '2026-01-20',
    categoryKey: 'harvest',
    categoryLabel: '採茶季',
    title: '冬片茶完售感謝',
    summary:
      '今年冬片茶在上架三天內全數售罄，感謝各位茶友的支持。我們已開始準備春茶，品質更勝以往，請拭目以待。',
    image:
      'https://images.unsplash.com/photo-1587049352851-8d4e89133924?w=600&h=400&fit=crop',
  },
  {
    id: 6,
    date: '2026-01-15',
    categoryKey: 'event',
    categoryLabel: '農場活動',
    title: '製茶師體驗工作坊回顧',
    summary:
      '上月舉辦的手工製茶體驗大獲好評！學員在製茶師傅指導下完成萎凋、揉捻、烘焙全程，帶走自己親手做的茶。',
    image:
      'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=600&h=400&fit=crop',
  },
]

export function NewsPageClient() {
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -80px 0px' }
    )

    const elements = document.querySelectorAll('.animate-on-scroll')
    elements.forEach((el) => observerRef.current?.observe(el))

    return () => observerRef.current?.disconnect()
  }, [])

  return (
    <div className="min-h-screen">
      {/* ===== Hero Banner ===== */}
      <section className="relative h-[50vh] min-h-[360px] flex items-center justify-center overflow-hidden">
        <Image
          src={HERO_IMAGE}
          alt="豪德製茶所最新動態"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-[#3e2723]/70" />
        {/* Title */}
        <div className="relative z-10 text-center px-6">
          <p className="text-[#d4af37] tracking-[0.3em] text-sm mb-4 uppercase animate-fade-in">
            Latest News
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-white mb-4 animate-fade-in animation-delay-150">
            最新動態
          </h1>
          <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto animate-fade-in animation-delay-300">
            掌握豪德製茶所的第一手消息
          </p>
        </div>
      </section>

      {/* ===== News Cards Grid ===== */}
      <section className="py-20 md:py-28 px-6 bg-[#faf8f5] dark:bg-[#2d1f1a]">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16 animate-on-scroll">
            <p className="text-[#d4af37] dark:text-[#ffd54f] tracking-[0.2em] text-sm mb-3 uppercase">
              News &amp; Events
            </p>
            <h2 className="text-3xl md:text-4xl font-serif text-[#3e2723] dark:text-[#d7ccc8] mb-4">
              茶莊大小事
            </h2>
            <div className="w-16 h-0.5 bg-[#d4af37] mx-auto" />
          </div>

          {/* Cards grid — 1 col (sm) / 2 cols (md) / 3 cols (lg) */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {newsItems.map((item) => {
              const colors = categoryColors[item.categoryKey] ?? {
                bg: 'bg-gray-100',
                text: 'text-gray-600',
              }

              return (
                <article
                  key={item.id}
                  className="animate-on-scroll tea-card bg-white dark:bg-[#3e2723] rounded-2xl overflow-hidden"
                >
                  {/* Card image */}
                  <div className="relative aspect-[3/2] overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-500 hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>

                  {/* Card body */}
                  <div className="p-6">
                    {/* Meta: date + category */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className="flex items-center gap-1 text-sm text-[#8d6e63] dark:text-[#bcaaa4]">
                        <Calendar className="w-3.5 h-3.5" />
                        {item.date}
                      </span>
                      <span
                        className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}
                      >
                        <Tag className="w-3 h-3" />
                        {item.categoryLabel}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-[#3e2723] dark:text-[#d7ccc8] mb-2 line-clamp-2">
                      {item.title}
                    </h3>

                    {/* Summary */}
                    <p className="text-[#5d4037] dark:text-[#bcaaa4] text-sm leading-relaxed line-clamp-3">
                      {item.summary}
                    </p>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
