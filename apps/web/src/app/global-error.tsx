'use client'

import { useEffect } from 'react'

/**
 * Global error boundary (last resort)
 *
 * Catches errors in the root layout itself.
 * Must render its own <html> and <body> since the root layout is broken.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <html lang="zh-TW">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            backgroundColor: '#f9fafb',
          }}
        >
          <div style={{ maxWidth: '28rem', textAlign: 'center' }}>
            <div
              style={{
                width: '4rem',
                height: '4rem',
                margin: '0 auto 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '9999px',
                backgroundColor: '#fee2e2',
                fontSize: '2rem',
              }}
            >
              !
            </div>

            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#111827',
                marginBottom: '0.5rem',
              }}
            >
              系統發生錯誤
            </h2>

            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              很抱歉，系統遇到了非預期的問題。請嘗試重新整理頁面。
            </p>

            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <button
                onClick={reset}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#16a34a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                重新整理
              </button>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- global-error has no Next.js Router context */}
              <a
                href="/"
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'white',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                }}
              >
                返回首頁
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
