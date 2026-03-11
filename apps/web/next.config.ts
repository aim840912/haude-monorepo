import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

// Bundle Analyzer 配置
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

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
    value: "frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'",
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
