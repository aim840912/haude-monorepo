'use client'

import dynamic from 'next/dynamic'

// Dynamically import to avoid SSR issues with agentation
const Agentation = dynamic(
  () => import('agentation').then((mod) => mod.Agentation),
  { ssr: false }
)

export function AgentationOverlay() {
  if (process.env.NODE_ENV !== 'development') return null
  return <Agentation endpoint="http://localhost:4747" />
}
