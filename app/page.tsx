'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const PIPELINE_STAGES = [
  { id: 1, label: 'Intent', desc: 'Parse the goal' },
  { id: 2, label: 'Design', desc: 'Define entities' },
  { id: 3, label: 'Schemas', desc: 'DB + API + UI' },
  { id: 4, label: 'Refine', desc: 'Cross-validate' },
  { id: 5, label: 'Repair', desc: 'Auto-fix errors' },
  { id: 6, label: 'Export', desc: 'Ready to ship' },
]

const METRICS = [
  { value: '6', label: 'Pipeline stages', sub: 'with Zod validation' },
  { value: '7', label: 'Cross-layer invariants', sub: 'enforced on every compile' },
  { value: '20', label: 'Eval test cases', sub: 'real products + edge cases' },
]

const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M10 1v18M1 10h18M4.5 4.5l11 11M15.5 4.5l-11 11" strokeLinecap="round" />
      </svg>
    ),
    title: 'Multi-stage pipeline',
    body: 'Not a single prompt. Six distinct stages with typed contracts between them. Each stage validates its input before running.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M10 2v4l2.5 2.5M17 10a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Auto-repair engine',
    body: "Broken schemas get fixed automatically — missing FK, wrong types, orphaned references. LLM repair only fires when rules can't fix it.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="3" width="16" height="14" rx="2" />
        <path d="M2 7h16M6 3v4M10 3v4M14 3v4" strokeLinecap="round" />
      </svg>
    ),
    title: 'Execution-ready output',
    body: 'Get a Prisma schema, Express server stubs with JWT auth, and a React component tree — all from one compile.',
  },
]

const EXAMPLE_OUTPUT = [
  '✓ 5 DB tables generated',
  '✓ 12 API endpoints',
  '✓ 8 UI pages',
  '✓ 3 roles defined',
  '✓ Subscription table injected',
  '✓ 0 validation errors',
]

export default function Page() {
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/dashboard')
    }
  }, [isLoaded, isSignedIn, router])

  return (
    <main>
      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-6 text-center relative overflow-hidden">
        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div style={{
            position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
            width: '600px', height: '400px',
            background: 'radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)',
          }} />
        </div>

        <div className="max-w-4xl mx-auto relative">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--bg-border)] bg-[var(--bg-surface)] mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-pulse" />
            <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-widest">
              Natural language compiler
            </span>
          </div>

          {/* H1 */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[var(--text-primary)] leading-[1.05] mb-6">
            Your product spec,<br />
            <span className="text-[var(--accent-primary)]">machine-readable.</span>
          </h1>

          {/* Subtext */}
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed">
            Describe what you&apos;re building. AppForge runs it through a 6-stage compiler and returns a
            validated database schema, API layer, component tree, and auth config — ready to ship.
          </p>

          {/* CTA Row */}
          <div className="flex items-center justify-center gap-4">
            <Link href="/compiler" className="btn-primary text-base px-6 py-3">
              Open compiler →
            </Link>
            <Link href="/demo" className="btn-ghost text-base px-6 py-3">
              See examples
            </Link>
          </div>

          {/* Trust line */}
          <p className="mt-6 text-xs text-[var(--text-muted)] font-mono">
            No credit card · Free tier · NVIDIA NIM powered
          </p>
        </div>
      </section>

      {/* ── Pipeline Strip (Signature Element) ─────────────────── */}
      <section className="py-16 px-6 border-y border-[var(--bg-border)]">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-widest text-center mb-10">
            Compilation pipeline
          </p>
          <div className="flex items-start justify-between relative">
            {/* Connector line */}
            <div className="absolute top-5 left-0 right-0 h-px bg-[var(--bg-border)]" />
            {/* Animated beam */}
            <div className="absolute top-5 left-0 h-px w-20 bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent pipeline-beam" />

            {PIPELINE_STAGES.map((stage) => (
              <div key={stage.id} className="flex flex-col items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-full border border-[var(--bg-border)] bg-[var(--bg-surface)] flex items-center justify-center">
                  <span className="text-xs font-mono text-[var(--text-muted)]">{String(stage.id).padStart(2, '0')}</span>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{stage.label}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{stage.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Metrics Row ────────────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8">
          {METRICS.map((m) => (
            <div key={m.value} className="text-center">
              <p className="text-5xl font-bold text-[var(--text-primary)] tracking-tight">{m.value}</p>
              <p className="text-sm font-medium text-[var(--text-secondary)] mt-2">{m.label}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{m.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature Cards ──────────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="card-hover">
              <div className="mb-4 text-[var(--accent-primary)]">{f.icon}</div>
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">{f.title}</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Live Example Panel ─────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface)] overflow-hidden">
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--bg-border)]">
              <div className="w-3 h-3 rounded-full bg-[var(--error)] opacity-60" />
              <div className="w-3 h-3 rounded-full bg-[var(--warning)] opacity-60" />
              <div className="w-3 h-3 rounded-full bg-[var(--success)] opacity-60" />
              <span className="ml-3 text-xs font-mono text-[var(--text-muted)]">appforge — compile</span>
            </div>
            {/* Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--bg-border)]">
              <div className="p-6">
                <p className="text-xs font-mono text-[var(--text-muted)] mb-3 uppercase tracking-wider">Input</p>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-mono">
                  &quot;Build a CRM with login, contacts, a dashboard, role-based access, and a premium plan with payments. Admins can see analytics.&quot;
                </p>
              </div>
              <div className="p-6">
                <p className="text-xs font-mono text-[var(--text-muted)] mb-3 uppercase tracking-wider">Output</p>
                <div className="space-y-2">
                  {EXAMPLE_OUTPUT.map((line) => (
                    <p key={line} className="text-xs font-mono text-[var(--accent-secondary)]">{line}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
