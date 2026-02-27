import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = '豪德製茶所 - 傳承三代的製茶工藝'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a3a0a 0%, #2D5016 50%, #3d6b1e 100%)',
          fontFamily: 'serif',
        }}
      >
        {/* Decorative top border */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: '#D4E4BC',
            display: 'flex',
          }}
        />

        {/* Brand character */}
        <div
          style={{
            fontSize: '120px',
            color: '#D4E4BC',
            marginBottom: '16px',
            display: 'flex',
          }}
        >
          豪德製茶所
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '32px',
            color: '#a8c98a',
            letterSpacing: '8px',
            display: 'flex',
          }}
        >
          Haude Tea
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '24px',
            color: '#8aad6a',
            marginTop: '24px',
            display: 'flex',
          }}
        >
          傳承三代的製茶工藝
        </div>

        {/* Decorative bottom border */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: '#D4E4BC',
            display: 'flex',
          }}
        />
      </div>
    ),
    { ...size }
  )
}
