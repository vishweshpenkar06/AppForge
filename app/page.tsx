'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Hero from '@/components/Hero'
import { OnboardingTourLazy } from '@/components/onboarding-tour-lazy'

const STAGES = [
  { n: '01', label: 'Intent', desc: 'Parse the goal' },
  { n: '02', label: 'Design', desc: 'Define entities' },
  { n: '03', label: 'Schemas', desc: 'DB + API + UI' },
  { n: '04', label: 'Refine', desc: 'Cross-validate' },
  { n: '05', label: 'Repair', desc: 'Auto-fix errors' },
  { n: '06', label: 'Export', desc: 'Ready to ship' },
]

const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
    title: 'Multi-stage pipeline',
    body: 'Six typed stages with Zod validation. Each stage validates its contract before the next runs.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
        <path d="m9 12 2 2 4-4"/>
      </svg>
    ),
    title: 'Auto-repair engine',
    body: 'Broken schemas get fixed automatically — missing foreign keys, wrong types, orphaned references.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
    title: 'Execution-ready output',
    body: 'Get a Prisma schema, Express server with JWT auth, and a full React component tree.',
  },
]

export default function Page() {
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isSignedIn) router.replace('/dashboard')
  }, [isSignedIn, router])

  if (!isLoaded) return null

  return (
    <main>
      <Hero />

      {/* ── Pipeline Strip ───────────────────────────────────────── */}
      <section className="py-16 px-6 border-y border-white/[0.06] bg-forge-950/50">
        <div className="max-w-[960px] mx-auto">
          <p className="font-mono text-[11px] text-forge-500 uppercase tracking-[0.15em] text-center mb-10 m-0">
            Compilation pipeline
          </p>

          {/* Desktop */}
          <div className="hidden md:block relative">
            <div className="absolute top-7 left-0 right-0 h-px bg-forge-700" />
            <div
              className="absolute top-7 left-0 h-px w-20 pipeline-beam"
              style={{ background: 'linear-gradient(90deg, transparent, var(--fill-accent), transparent)' }}
            />
            <div className="flex justify-between relative z-10">
              {STAGES.map((s) => (
                <div key={s.n} className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full border border-accent/30 bg-forge-900 flex items-center justify-center hover:border-accent/60 transition-colors hover:shadow-lg hover:shadow-accent/10">
                    <span className="font-mono text-sm text-accent font-medium">{s.n}</span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-forge-100 font-medium m-0">{s.label}</p>
                    <p className="text-xs text-forge-500 m-0 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile */}
          <div className="md:hidden relative pl-8">
            <div className="absolute top-0 bottom-0 left-[26px] w-px bg-forge-700" />
            <div className="space-y-6 relative">
              {STAGES.map((s) => (
                <div key={s.n} className="flex items-start gap-4 relative">
                  <div className="absolute -left-8 w-14 h-14 rounded-full border border-accent/30 bg-forge-900 flex items-center justify-center shrink-0">
                    <span className="font-mono text-sm text-accent font-medium">{s.n}</span>
                  </div>
                  <div className="pt-3">
                    <p className="text-sm text-forge-100 font-medium m-0">{s.label}</p>
                    <p className="text-xs text-forge-500 m-0 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Metrics ──────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-[700px] mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10">
          {[
            { v: '6', l: 'Pipeline stages', s: 'with Zod validation' },
            { v: '7', l: 'Cross-layer invariants', s: 'enforced every compile' },
            { v: '20', l: 'Eval test cases', s: 'real products + edge cases' },
          ].map((m) => (
            <div key={m.v} className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-gradient-emerald m-0 tracking-tight">{m.v}</p>
              <p className="text-sm text-forge-200 m-0 mt-3 mb-1 font-medium">{m.l}</p>
              <p className="text-xs text-forge-500 m-0">{m.s}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-white/[0.06]">
        <div className="max-w-[960px] mx-auto">
          <p className="font-mono text-[11px] text-forge-500 uppercase tracking-[0.15em] text-center mb-4 m-0">
            Why AppForge
          </p>
          <h2 className="text-center text-2xl md:text-3xl font-bold text-forge-50 m-0 mb-12 tracking-tight">
            Built for developers who ship
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="group bg-forge-900/50 border border-white/[0.06] rounded-xl p-6 hover:border-accent/20 transition-all hover:shadow-lg hover:shadow-accent/[0.03]">
                <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4 group-hover:bg-accent/15 transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-sm font-semibold text-forge-100 m-0 mb-2">{f.title}</h3>
                <p className="text-sm text-forge-400 leading-relaxed m-0">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-white/[0.06]">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-forge-50 m-0 mb-4 tracking-tight">
            Ready to compile?
          </h2>
          <p className="text-forge-400 m-0 mb-8">
            Describe your app in plain English. Get production-ready code in seconds.
          </p>
          <Link
            href="/compiler"
            className="inline-flex items-center gap-2 bg-accent text-white rounded-xl px-6 py-3 text-sm font-semibold no-underline hover:bg-accent-hover transition-all hover:shadow-xl hover:shadow-accent/25 active:scale-[0.98] glow-emerald"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Open the compiler
          </Link>
        </div>
      </section>

      <OnboardingTourLazy />
    </main>
  )
}
