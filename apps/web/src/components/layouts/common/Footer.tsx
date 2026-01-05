import { Link } from 'react-router-dom'

/**
 * Footer 元件
 * 簡潔單行設計：版權 + 快速連結
 */
export function Footer() {
  return (
    <footer className="bg-[#1a1a1a] text-white py-4">
      <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-2">
        <p className="text-gray-400 text-sm">
          © {new Date().getFullYear()} 豪德製茶所
        </p>
        <nav className="flex gap-4 text-sm">
          <Link
            to="/products"
            className="text-gray-300 hover:text-green-500 transition-colors"
          >
            產品
          </Link>
          <Link
            to="/farm-tours"
            className="text-gray-300 hover:text-green-500 transition-colors"
          >
            農場參觀
          </Link>
          <Link
            to="/schedule"
            className="text-gray-300 hover:text-green-500 transition-colors"
          >
            擺攤行程
          </Link>
          <Link
            to="/locations"
            className="text-gray-300 hover:text-green-500 transition-colors"
          >
            門市據點
          </Link>
        </nav>
      </div>
    </footer>
  )
}
