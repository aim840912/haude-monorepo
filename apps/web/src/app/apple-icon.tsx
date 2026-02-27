import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#2D5016',
          borderRadius: '36px',
          fontFamily: 'serif',
        }}
      >
        <div style={{ fontSize: '120px', color: '#D4E4BC', display: 'flex' }}>
          豪
        </div>
      </div>
    ),
    { ...size }
  )
}
