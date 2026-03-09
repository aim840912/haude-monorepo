'use client'

import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'

export function AISupportWidget() {
  const [isOpen, setIsOpen] = useState(false)

  const aiSupportUrl = process.env.NEXT_PUBLIC_AI_SUPPORT_URL
  const aiSupportApiKey = process.env.NEXT_PUBLIC_AI_SUPPORT_API_KEY

  // Graceful fallback: don't render if env vars not configured
  if (!aiSupportUrl || !aiSupportApiKey) return null

  const iframeSrc = `${aiSupportUrl}/widget/${aiSupportApiKey}`

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3">
      {/* Chat panel */}
      {isOpen && (
        <div className="overflow-hidden rounded-2xl shadow-2xl">
          <iframe
            src={iframeSrc}
            width={400}
            height={600}
            style={{ border: 'none', display: 'block' }}
            title="AI Support Chat"
          />
        </div>
      )}

      {/* Toggle bubble */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-800 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label={isOpen ? '關閉客服對話' : '開啟 AI 客服'}
      >
        {isOpen ? (
          <X className="h-6 w-6" aria-hidden="true" />
        ) : (
          <MessageCircle className="h-6 w-6" aria-hidden="true" />
        )}
      </button>
    </div>
  )
}
