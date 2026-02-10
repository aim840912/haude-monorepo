/**
 * Footer 元件
 * 4 欄佈局：品牌 + 快速連結 + 客服 + 聯絡
 */

import Link from 'next/link'

const exploreLinks = [
  { href: '/products', label: '產品介紹' },
  { href: '/farm-tours', label: '觀光果園' },
  { href: '/schedule', label: '擺攤行程' },
  { href: '/locations', label: '門市據點' },
]

const serviceLinks = [
  { href: '/faq', label: '常見問題' },
  { href: '/privacy', label: '隱私權政策' },
  { href: '/terms', label: '使用條款' },
]

export function Footer() {
  return (
    <footer className="bg-[#1a1210] text-gray-300">
      {/* 主要內容 */}
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* 品牌 */}
        <div>
          <h3 className="font-serif text-white text-xl mb-4">豪德製茶所</h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            座落梅山群峰，以自然農法呈現四季最美的滋味
          </p>
        </div>

        {/* 快速連結 */}
        <div>
          <h4 className="text-white font-medium mb-4">探索</h4>
          <nav className="flex flex-col space-y-2 text-sm">
            {exploreLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* 客服 */}
        <div>
          <h4 className="text-white font-medium mb-4">顧客服務</h4>
          <nav className="flex flex-col space-y-2 text-sm">
            {serviceLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* 聯絡 */}
        <div>
          <h4 className="text-white font-medium mb-4">聯絡我們</h4>
          <div className="space-y-2 text-sm text-gray-400">
            <p>嘉義縣梅山鄉</p>
            <p>LINE：@haudetea</p>
          </div>
        </div>
      </div>

      {/* 底部列 */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 text-center text-xs text-gray-500">
          &copy; {new Date().getFullYear()} 豪德製茶所. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
