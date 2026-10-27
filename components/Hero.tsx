'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

const DEMOS = [
  {
    prompt: 'Build a CRM with contacts, deals, and activity tracking',
    models: 8,
    endpoints: 12,
    pages: 6,
    lines: [
      'Prisma schema · 8 models, 14 relations',
      'Express API · JWT auth, 12 endpoints',
      'React tree · 6 pages, typed hooks',
      'Invariants · 7/7 satisfied',
    ],
  },
  {
    prompt: 'Create an e-commerce platform with products, carts and orders',
    models: 11,
    endpoints: 18,
    pages: 9,
    lines: [
      'Prisma schema · 11 models, 19 relations',
      'Express API · cart + checkout, 18 endpoints',
      'React tree · 9 pages, optimistic cart',
      'Invariants · 7/7 satisfied',
    ],
  },
  {
    prompt: 'Design a project management tool with tasks, teams and boards',
    models: 9,
    endpoints: 15,
    pages: 7,
    lines: [
      'Prisma schema · 9 models, 16 relations',
      'Express API · RBAC per workspace, 15 endpoints',
      'React tree · 7 pages, drag-ready boards',
      'Invariants · 7/7 satisfied',
    ],
  },
]

const STAGES = ['Intent', 'Design', 'Schemas', 'Refine', 'Repair', 'Export']

const BADGES = ['Prisma', 'Express', 'React', 'PostgreSQL', 'JWT auth', 'Zod', 'TypeScript', 'REST']

export default function Hero() {
  const [demo, setDemo] = useState(0)
  const [typed, setTyped] = useState('')
  const [stage, setStage] = useState(0)
  const [reduced, setReduced] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  const active = DEMOS[demo]
  const done = stage >= STAGES.length

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  useEffect(() => {
    if (reduced) {
      setTyped(active.prompt)
      setStage(STAGES.length)
      return
    }
    if (typed.length < active.prompt.length) {
      const t = setTimeout(() => setTyped(active.prompt.slice(0, typed.length + 1)), 24)
      return () => clearTimeout(t)
    }
    if (stage < STAGES.length) {
      const t = setTimeout(() => setStage((s) => s + 1), 620)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => {
      setDemo((d) => (d + 1) % DEMOS.length)
      setTyped('')
      setStage(0)
    }, 2800)
    return () => clearTimeout(t)
  }, [typed, stage, active.prompt, reduced])

  const selectDemo = (i: number) => {
    setDemo(i)
    setTyped('')
    setStage(0)
  }

  const onMove = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--gx', `${e.clientX - r.left}px`)
    e.currentTarget.style.setProperty('--gy', `${e.clientY - r.top}px`)
  }

  return (
    <section
      ref={sectionRef}
      onMouseMove={onMove}
      className="relative overflow-hidden isolate"
      aria-label="AppForge introduction"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-grid-fade opacity-70" aria-hidden />
      <div className="absolute inset-0 aurora" aria-hidden />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60 transition-opacity duration-500"
        style={{
          background:
            'radial-gradient(520px circle at var(--gx, 50%) var(--gy, 20%), rgba(16,185,129,0.10), transparent 60%)',
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-forge-950" aria-hidden />

      <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-24">
        {/* Badge */}
        <div className="flex justify-center mb-7">
          <div className="inline-flex items-center gap-2.5 pl-2 pr-3.5 py-1.5 rounded-full border border-accent/25 bg-accent/[0.07] backdrop-blur-sm text-[11px] font-mono text-accent-hover">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            6-stage compiler · cross-layer validation
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-center text-[2.6rem] leading-[1.05] sm:text-6xl lg:text-7xl font-bold tracking-[-0.035em] m-0 mb-6 text-balance">
          <span className="text-forge-50">Describe it.</span>{' '}
          <span className="text-gradient-emerald">Ship it.</span>
          <span className="block mt-3 text-lg sm:text-xl md:text-2xl font-normal tracking-tight text-forge-400">
            A compiler for product ideas.
          </span>
        </h1>

        <p className="text-center text-base md:text-lg text-forge-400 max-w-2xl mx-auto m-0 mb-9 leading-relaxed text-balance">
          Natural language in. Validated database schemas, an authenticated API layer and a
          React component tree out — cross-checked at every stage.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
          <Link
            href="/compiler"
            className="group relative inline-flex items-center gap-2 bg-accent text-forge-950 rounded-xl px-6 py-3 text-sm font-semibold no-underline transition-all hover:bg-accent-hover hover:shadow-[0_10px_40px_-8px_rgba(16,185,129,0.5)] active:scale-[0.985] glow-emerald"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Start compiling
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="transition-transform group-hover:translate-x-0.5" aria-hidden>
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            href="/templates"
            className="inline-flex items-center gap-2 text-forge-300 rounded-xl px-5 py-3 text-sm font-medium no-underline transition-all border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.16] hover:text-white"
          >
            Browse templates
          </Link>
        </div>

        {/* Interactive terminal */}
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-white/[0.09] bg-forge-900/70 backdrop-blur-xl overflow-hidden shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)]">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06] bg-forge-950/60">
              <div className="flex gap-1.5" aria-hidden>
                <span className="w-2.5 h-2.5 rounded-full bg-forge-600" />
                <span className="w-2.5 h-2.5 rounded-full bg-forge-600" />
                <span className="w-2.5 h-2.5 rounded-full bg-forge-600" />
              </div>
              <span className="text-[11px] font-mono text-forge-500 ml-1.5">appforge · compile</span>
              <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded border border-success/25 bg-success-subtle text-success">
                live
              </span>
            </div>

            <div className="p-5 md:p-6">
              <div className="flex items-start gap-3">
                <span className="text-accent font-mono text-xs mt-0.5 shrink-0 select-none" aria-hidden>
                  ❯
                </span>
                <p className="text-forge-100 text-[13px] m-0 leading-relaxed font-mono min-h-[40px]">
                  {typed}
                  <span className="inline-block w-[7px] h-[15px] bg-accent/80 ml-0.5 align-middle animate-blink" aria-hidden />
                </p>
              </div>

              {/* Stage rail */}
              <div className="flex flex-wrap gap-1.5 mt-5">
                {STAGES.map((s, i) => {
                  const state = i < stage ? 'done' : i === stage && !done ? 'active' : 'idle'
                  return (
                    <span
                      key={s}
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] font-mono transition-all duration-300 ${
                        state === 'done'
                          ? 'border-success/30 bg-success-subtle text-success'
                          : state === 'active'
                            ? 'border-accent/40 bg-accent/[0.12] text-accent-hover'
                            : 'border-white/[0.05] bg-white/[0.02] text-forge-500'
                      }`}
                    >
                      <span
                        className={`w-1 h-1 rounded-full ${
                          state === 'done' ? 'bg-success' : state === 'active' ? 'bg-accent animate-pulse' : 'bg-forge-600'
                        }`}
                      />
                      {s}
                    </span>
                  )
                })}
              </div>

              {/* Output */}
              <div className="mt-4 rounded-xl bg-forge-950/80 border border-white/[0.05] p-4 font-mono text-[11.5px] space-y-2">
                {active.lines.map((line, i) => {
                  const shown = stage > i + 1 || (done && true)
                  return (
                    <div
                      key={line}
                      className={`flex items-center gap-2 transition-all duration-500 ${
                        shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
                      } ${i === 3 ? 'text-forge-400 pt-1' : 'text-forge-200'}`}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={i === 3 ? '#38bdf8' : '#10b981'}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <polyline points={i === 3 ? '12 2 15 8 22 9 17 14 18 21 12 18 6 21 7 14 2 9 9 8 12 2' : '20 6 9 17 4 12'} />
                      </svg>
                      <span>{line}</span>
                    </div>
                  )
                })}
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-3.5 text-[10px] font-mono text-forge-500">
                <span>
                  <span className="text-forge-300">{active.models}</span> models
                </span>
                <span>
                  <span className="text-forge-300">{active.endpoints}</span> endpoints
                </span>
                <span>
                  <span className="text-forge-300">{active.pages}</span> pages
                </span>
                <span className="ml-auto text-success">0 errors · 0 repairs needed</span>
              </div>
            </div>
          </div>

          {/* Demo switcher */}
          <div className="flex items-center justify-center gap-2 mt-4" role="tablist" aria-label="Example prompts">
            {DEMOS.map((d, i) => (
              <button
                key={d.prompt}
                type="button"
                role="tab"
                aria-selected={i === demo}
                aria-label={`Demo ${i + 1}`}
                onClick={() => selectDemo(i)}
                className={`h-1.5 rounded-full cursor-pointer border-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-forge-950 ${
                  i === demo ? 'w-6 bg-accent' : 'w-1.5 bg-forge-600 hover:bg-forge-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Stack marquee */}
        <div className="relative mt-14 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_15%,#000_85%,transparent)]">
          <div className="flex w-max gap-2 animate-marquee" aria-hidden>
            {[...BADGES, ...BADGES].map((b, i) => (
              <span
                key={`${b}-${i}`}
                className="px-3 py-1.5 rounded-lg border border-white/[0.05] bg-white/[0.02] text-[11px] font-mono text-forge-500 whitespace-nowrap"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
