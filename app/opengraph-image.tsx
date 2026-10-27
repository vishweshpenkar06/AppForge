import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'AppForge — Natural Language Application Compiler'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: '#05070a',
          backgroundImage:
            'radial-gradient(60% 50% at 20% 10%, rgba(16,185,129,0.22), transparent 70%), radial-gradient(50% 45% at 85% 90%, rgba(56,189,248,0.16), transparent 70%)',
          color: '#f8fafc',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'linear-gradient(135deg,#10b981,#38bdf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#05070a',
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            AF
          </div>
          <div style={{ fontSize: 26, color: '#93a4b8' }}>AppForge</div>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 76, fontWeight: 700, letterSpacing: -2, lineHeight: 1.05 }}>
          <span>Describe it.</span>
          <span style={{ color: '#34d399' }}>Ship it.</span>
        </div>
        <div style={{ fontSize: 30, color: '#93a4b8', marginTop: 24, maxWidth: 900 }}>
          Natural language in. Validated Prisma schema, Express API and React tree out.
        </div>
        <div style={{ fontSize: 22, color: '#10b981', marginTop: 40 }}>
          6-stage compiler · cross-layer validation
        </div>
      </div>
    ),
    size,
  )
}
