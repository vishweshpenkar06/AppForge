import Link from 'next/link'

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-20 pb-16 md:pt-24 md:pb-20 text-center">
      {/* Glow */}
      <div
        className="absolute top-[8%] left-1/2 -translate-x-1/2 w-[600px] h-[350px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-[700px] mx-auto px-6">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.06] bg-forge-800 mb-8">
          <div
            className="w-1.5 h-1.5 rounded-full bg-accent"
            style={{ animation: 'pulse-dot 2s ease-in-out infinite' }}
          />
          <span className="font-mono text-[11px] text-forge-400 uppercase tracking-[0.1em]">
            Natural language compiler
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-[52px] font-bold leading-[1.08] tracking-tight text-forge-50 mb-5">
          Your product spec,
          <br />
          <span className="text-accent-hover">machine-readable.</span>
        </h1>

        {/* Value prop */}
        <p className="text-base md:text-lg text-forge-300 leading-relaxed max-w-[520px] mx-auto mb-9">
          Describe what you&apos;re building. AppForge runs it through a 6-stage
          compiler and returns a validated database schema, API layer, component
          tree, and auth config — ready to ship.
        </p>

        {/* Video / GIF placeholder */}
        <div className="max-w-[640px] mx-auto mb-10 rounded-xl border border-white/[0.06] overflow-hidden bg-forge-800">
          <video
            autoPlay
            loop
            muted
            playsInline
            src="/demo/appforge-demo.mp4"
            className="block w-full h-auto"
            onError={(e) => {
              const target = e.target as HTMLVideoElement
              target.style.display = 'none'
              const fallback = target.nextElementSibling as HTMLElement
              if (fallback) fallback.style.display = 'flex'
            }}
          />
          <div
            className="hidden items-center justify-center h-[320px] text-forge-400 text-sm flex-col gap-2"
            style={{ display: 'none' }}
          >
            <div className="w-16 h-16 rounded-2xl bg-forge-700 flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-forge-500">Demo video</span>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex gap-3 justify-center">
          <Link
            href="/compiler"
            className="bg-accent text-white rounded-xl px-6 py-2.5 text-sm font-medium no-underline hover:bg-accent-hover transition-colors shadow-[0_10px_30px_rgba(99,102,241,0.18)] focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-forge-950"
          >
            Open compiler →
          </Link>
          <Link
            href="/demo"
            className="border border-forge-600 text-forge-300 rounded-xl px-6 py-2.5 text-sm font-medium no-underline hover:bg-forge-800 hover:text-forge-50 transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-forge-950"
          >
            See examples
          </Link>
        </div>

        {/* Tagline */}
        <p className="mt-5 font-mono text-[11px] text-forge-400">
          No credit card · Free tier · NVIDIA NIM powered
        </p>
      </div>
    </section>
  )
}
