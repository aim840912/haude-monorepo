import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

// Bundle Analyzer 配置
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/**
 * 建構 Content-Security-Policy
 *
 * ⚠️ script-src 刻意保留 'unsafe-inline'，不使用 nonce。原因：
 * Next.js App Router 以 inline <script>（self.__next_f.push）傳遞 hydration
 * payload，nonce 必須逐請求產生 → 全站退出 SSG。實測本專案幾乎所有路由都是
 * ● 預渲染，改用 nonce 會讓它們全部變成 ƒ（request-time render），並使
 * s-maxage CDN 快取失效，代價過高。
 *
 * 因此 script-src 在此僅限制「外部 script 來源」，**無法阻擋 inline 注入**。
 * 防止 inline 注入的實際防線是輸出端跳脫（見 src/lib/json-ld.ts）。
 *
 * 開發環境需放寬 connect-src：API 走 http://localhost:3001，
 * 且 Next dev 的 HMR 需要 ws:，嚴格的 'self' https: 會直接擋掉兩者。
 */
function buildCsp(): string {
  const isDev = process.env.NODE_ENV === 'development'

  const connectSrc = isDev ? "'self' http://localhost:* ws://localhost:* https:" : "'self' https:"

  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ')
}

// 安全標頭配置
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self)',
  },
  {
    key: 'Content-Security-Policy',
    value: buildCsp(),
  },
]

// 快取標頭配置
// HTML 頁面：短期快取 + stale-while-revalidate 提升體驗
const pageCacheHeaders = [
  {
    key: 'Cache-Control',
    // max-age=0：瀏覽器不快取（確保用戶看到最新內容）
    // s-maxage=60：CDN 快取 1 分鐘
    // stale-while-revalidate=300：CDN 重新驗證時可返回舊內容最多 5 分鐘
    value: 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
  },
]

// API 路由：不快取（動態資料）
const apiNoCacheHeaders = [
  {
    key: 'Cache-Control',
    value: 'no-store',
  },
]

const nextConfig: NextConfig = {
  // Standalone output only on Vercel CI (VERCEL=1 is auto-set).
  // Disabled locally to avoid Windows symlink EPERM errors.
  output: process.env.VERCEL ? 'standalone' : undefined,

  // Remove X-Powered-By response header
  poweredByHeader: false,

  // Tree-shake barrel exports — lucide-react has 72 import sites
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },

  // Reduce file watching scope to prevent EMFILE on macOS
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ['**/node_modules/**', '**/.next/**'],
      }
    }
    return config
  },

  // 圖片優化設定
  images: {
    // AVIF is ~20% smaller than WebP; browser chooses the best format
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co', // Mock 資料的佔位圖片
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // Unsplash 圖片（種子資料使用）
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co', // Supabase Storage
      },
      {
        protocol: 'https',
        hostname: '*.supabase.in', // Supabase Storage (備用域名)
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google OAuth 頭像
      },
    ],
    // 允許 SVG 圖片（placehold.co 返回 SVG 格式）
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // 安全標頭與快取標頭
  async headers() {
    return [
      // 所有頁面：安全標頭
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      // HTML 頁面：快取標頭（排除 API 和靜態檔案）
      {
        source: '/:locale/:path*',
        headers: pageCacheHeaders,
      },
      // 根路徑
      {
        source: '/',
        headers: pageCacheHeaders,
      },
      // Next.js API 路由：不快取
      {
        source: '/api/:path*',
        headers: apiNoCacheHeaders,
      },
    ]
  },
}

export default withBundleAnalyzer(withNextIntl(nextConfig))
