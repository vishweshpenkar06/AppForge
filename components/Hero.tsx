import Link from 'next/link'

export default function Hero() {
  return (
    <section
      style={{
        paddingTop: 80,
        paddingBottom: 64,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glow */}
      <div
        style={{
          position: 'absolute',
          top: '8%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 600,
          height: 350,
          background:
            'radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: 700, margin: '0 auto', position: 'relative' }}>
        {/* Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 12px',
            borderRadius: 999,
            border: '1px solid var(--border)',
            background: 'var(--surface-1)',
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--fill-accent)',
              animation: 'pulse-dot 2s ease-in-out infinite',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Natural language compiler
          </span>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: 52,
            fontWeight: 700,
            lineHeight: '1.08',
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
            marginBottom: 20,
          }}
        >
          Your product spec,
          <br />
          <span style={{ color: 'var(--text-accent)' }}>machine-readable.</span>
        </h1>

        {/* Value prop */}
        <p
          style={{
            fontSize: 16,
            color: 'var(--text-secondary)',
            lineHeight: '1.6',
            maxWidth: 520,
            margin: '0 auto 36px',
          }}
        >
          Describe what you&apos;re building. AppForge runs it through a 6-stage
          compiler and returns a validated database schema, API layer, component
          tree, and auth config — ready to ship.
        </p>

        {/* Video / GIF placeholder */}
        <div
          style={{
            maxWidth: 640,
            margin: '0 auto 40px',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            overflow: 'hidden',
            background: 'var(--surface-1)',
          }}
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            src="/demo/appforge-demo.mp4"
            style={{ display: 'block', width: '100%', height: 'auto' }}
          />
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link
            href="/compiler"
            style={{
              background: 'var(--fill-accent)',
              color: '#fff',
              borderRadius: 'var(--radius)',
              padding: '10px 24px',
              fontSize: 14,
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            Open compiler →
          </Link>
          <Link
            href="/demo"
            style={{
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '10px 24px',
              fontSize: 14,
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            See examples
          </Link>
        </div>

        {/* Tagline */}
        <p
          style={{
            marginTop: 20,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-muted)',
          }}
        >
          No credit card · Free tier · NVIDIA NIM powered
        </p>
      </div>
    </section>
  )
}
