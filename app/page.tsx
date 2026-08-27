'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Hero from '@/components/Hero'
import OnboardingTour from '@/components/OnboardingTour'

const STAGES = [
  { n: '01', label: 'Intent', desc: 'Parse the goal' },
  { n: '02', label: 'Design', desc: 'Define entities' },
  { n: '03', label: 'Schemas', desc: 'DB + API + UI' },
  { n: '04', label: 'Refine', desc: 'Cross-validate' },
  { n: '05', label: 'Repair', desc: 'Auto-fix errors' },
  { n: '06', label: 'Export', desc: 'Ready to ship' },
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
      {/* ── Hero ────────────────────────────────────────────────── */}
      <Hero />

      {/* ── Pipeline Strip (Signature Element) ──────────────────── */}
      <section className="py-12 px-6 border-y border-white/[0.06]">
        <div className="max-w-[960px] mx-auto">
          <p className="font-mono text-[11px] text-forge-400 uppercase tracking-[0.1em] text-center mb-10">
            Compilation pipeline
          </p>

          {/* Desktop: horizontal */}
          <div className="hidden md:block relative">
            {/* Connecting line */}
            <div className="absolute top-7 left-0 right-0 h-px bg-forge-600" />
            {/* Animated beam */}
            <div
              className="absolute top-7 left-0 h-px w-20 pipeline-beam"
              style={{ background: 'linear-gradient(90deg, transparent, var(--fill-accent), transparent)' }}
            />

            <div className="flex justify-between relative z-10">
              {STAGES.map((s) => (
                <div key={s.n} className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full border border-secondary/40 bg-forge-800 flex items-center justify-center hover:border-secondary/70 transition-colors">
                    <span className="font-mono text-sm text-secondary font-medium">{s.n}</span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-forge-50 font-medium m-0">{s.label}</p>
                    <p className="text-xs text-forge-400 m-0 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile: vertical */}
          <div className="md:hidden relative pl-8">
            <div className="absolute top-0 bottom-0 left-[26px] w-px bg-forge-600" />
            <div className="space-y-6 relative">
              {STAGES.map((s) => (
                <div key={s.n} className="flex items-start gap-4 relative">
                  <div className="absolute -left-8 w-14 h-14 rounded-full border border-secondary/40 bg-forge-800 flex items-center justify-center shrink-0">
                    <span className="font-mono text-sm text-secondary font-medium">{s.n}</span>
                  </div>
                  <div className="pt-3">
                    <p className="text-sm text-forge-50 font-medium m-0">{s.label}</p>
                    <p className="text-xs text-forge-400 m-0 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Metrics ─────────────────────────────────────────────── */}
      <section className="py-12 px-6">
        <div className="max-w-[700px] mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { v: '6', l: 'Pipeline stages', s: 'with Zod validation' },
            { v: '7', l: 'Cross-layer invariants', s: 'enforced on every compile' },
            { v: '20', l: 'Eval test cases', s: 'real products + edge cases' },
          ].map((m) => (
            <div key={m.v} className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-forge-50 tracking-tight m-0">{m.v}</p>
              <p className="text-sm text-forge-300 m-0 mt-2 mb-1">{m.l}</p>
              <p className="text-xs text-forge-400 m-0">{m.s}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section className="py-12 px-6">
        <div className="max-w-[960px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: '⬡', title: 'Multi-stage pipeline', body: 'Six distinct stages with typed contracts. Each validates its input before running.' },
            { icon: '⚡', title: 'Auto-repair engine', body: 'Broken schemas get fixed automatically — missing FK, wrong types, orphaned references.' },
            { icon: '◈', title: 'Execution-ready output', body: 'Get a Prisma schema, Express server with JWT auth, and React component tree.' },
          ].map((f) => (
            <div key={f.title} className="bg-forge-800 border border-white/[0.06] rounded-xl p-6 hover:border-white/[0.12] transition-colors">
              <p className="text-xl text-accent-hover m-0 mb-4">{f.icon}</p>
              <h3 className="text-sm font-semibold text-forge-50 m-0 mb-2">{f.title}</h3>
              <p className="text-sm text-forge-300 leading-relaxed m-0">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <OnboardingTour />
    </main>
  )
}
