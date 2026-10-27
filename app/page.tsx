'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Hero from '@/components/Hero'
import { Counter, Reveal, SpotlightCard } from '@/components/ui/motion'

const STAGES = [
  {
    n: '01',
    name: 'Intent',
    tagline: 'Parse the goal',
    detail:
      'The prompt is decomposed into an Intent object: app type, entities, actors, roles and the constraints you implied. Ambiguity is surfaced as an explicit assumption instead of a silent guess.',
    outputs: ['Intent schema', 'Assumptions', 'Role map'],
  },
  {
    n: '02',
    name: 'Design',
    tagline: 'Define entities',
    detail:
      'Entities become a typed domain model. Relations, cardinalities and ownership are resolved before a single table is written, so the database and the API can never disagree about shape.',
    outputs: ['Domain model', 'Relations', 'Ownership'],
  },
  {
    n: '03',
    name: 'Schemas',
    tagline: 'DB + API + UI',
    detail:
      'Three layers are emitted from one model: a Prisma schema, an Express router with auth middleware, and a React component tree. The layers share generated types.',
    outputs: ['Prisma', 'Express', 'React'],
  },
  {
    n: '04',
    name: 'Refine',
    tagline: 'Cross-validate',
    detail:
      'Seven cross-layer invariants run against the bundle — every route has a handler, every foreign key has a relation, every page has a data source. Failures are collected, not thrown.',
    outputs: ['7 invariants', 'Type parity', 'Coverage'],
  },
  {
    n: '05',
    name: 'Repair',
    tagline: 'Auto-fix errors',
    detail:
      'Recoverable defects are patched automatically and logged: missing foreign keys, mismatched types, orphaned references. Everything repaired is reported so nothing changes silently.',
    outputs: ['Patched FKs', 'Type fixes', 'Repair log'],
  },
  {
    n: '06',
    name: 'Export',
    tagline: 'Ready to ship',
    detail:
      'Download a ZIP with the Prisma schema, server, React app and docs — or push it straight to a fresh GitHub repository with one click.',
    outputs: ['ZIP bundle', 'GitHub push', 'Docs'],
  },
]

const TABS = [
  {
    id: 'prisma',
    label: 'schema.prisma',
    lines: [
      { t: 'model Contact {', c: 'kw' },
      { t: '  id        String   @id @default(cuid())', c: '' },
      { t: '  email     String   @unique', c: '' },
      { t: '  company   Company? @relation(fields: [companyId], references: [id])', c: 'muted' },
      { t: '  companyId String?', c: 'muted' },
      { t: '  deals     Deal[]', c: '' },
      { t: '  createdAt DateTime @default(now())', c: 'muted' },
      { t: '}', c: 'kw' },
    ],
  },
  {
    id: 'express',
    label: 'contacts.routes.ts',
    lines: [
      { t: "router.get('/contacts', requireAuth, async (req, res) => {", c: 'kw' },
      { t: '  const contacts = await prisma.contact.findMany({', c: '' },
      { t: '    where: { orgId: req.auth.orgId },', c: 'accent' },
      { t: '    include: { company: true, deals: true },', c: 'muted' },
      { t: '    orderBy: { createdAt: "desc" },', c: 'muted' },
      { t: '  })', c: '' },
      { t: '  res.json({ items: contacts })', c: '' },
      { t: '})', c: 'kw' },
    ],
  },
  {
    id: 'react',
    label: 'ContactsPage.tsx',
    lines: [
      { t: 'export default function ContactsPage() {', c: 'kw' },
      { t: '  const { data, isLoading } = useContacts()', c: '' },
      { t: '  if (isLoading) return <TableSkeleton rows={6} />', c: 'muted' },
      { t: '  return (', c: '' },
      { t: '    <DataTable', c: 'accent' },
      { t: '      rows={data.items}', c: 'muted' },
      { t: '      columns={contactColumns}', c: 'muted' },
      { t: '    />', c: 'accent' },
      { t: '  )', c: '' },
      { t: '}', c: 'kw' },
    ],
  },
]

const FEATURES = [
  {
    title: 'Six typed stages',
    body: 'Every stage validates its contract with Zod before the next one runs. A broken stage cannot poison the bundle downstream.',
    icon: (
      <path d="M4 6h4v4H4zM10 14h4v4h-4zM16 6h4v4h-4zM8 8h2M14 16h2" />
    ),
  },
  {
    title: 'Auto-repair engine',
    body: 'Missing foreign keys, mismatched types and orphaned references are fixed automatically — and every repair is reported.',
    icon: <path d="M14.7 6.3a4 4 0 105.6 5.6L11 21l-4-4 9.7-10.7z" />,
  },
  {
    title: 'Three layers, one model',
    body: 'Prisma, Express and React are generated from the same domain model, so types, routes and screens stay in sync.',
    icon: <path d="M12 2 2 7l10 5 10-5-10-5zM2 12l10 5 10-5M2 17l10 5 10-5" />,
  },
  {
    title: 'Ship in one click',
    body: 'Export a production-shaped ZIP or push the whole bundle to a new GitHub repository with secrets kept out of the output.',
    icon: <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v3h16v-3" />,
  },
]

const tone: Record<string, string> = {
  kw: 'text-accent-hover',
  accent: 'text-secondary',
  muted: 'text-forge-500',
  '': 'text-forge-300',
}

export default function Page() {
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()
  const [activeStage, setActiveStage] = useState(0)
  const [tab, setTab] = useState(0)

  useEffect(() => {
    if (isLoaded && isSignedIn) router.replace('/dashboard')
  }, [isLoaded, isSignedIn, router])

  const stage = STAGES[activeStage]

  return (
    <div>
      <Hero />

      {/* ── Interactive pipeline ─────────────────────────────────── */}
      <section id="pipeline" className="relative py-20 px-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-12">
            <p className="font-mono text-[11px] text-accent/80 uppercase tracking-[0.2em] m-0 mb-3">
              The compiler
            </p>
            <h2 className="text-2xl md:text-4xl font-bold text-forge-50 m-0 tracking-tight text-balance">
              Six stages. Nothing skipped.
            </h2>
            <p className="text-forge-400 m-0 mt-3 max-w-xl mx-auto">
              Pick a stage to see what it actually produces.
            </p>
          </Reveal>

          <Reveal delay={80}>
            <div className="grid md:grid-cols-[300px_1fr] gap-4 md:gap-6 items-start">
              {/* Stage list */}
              <div className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-visible scrollbar-none pb-1 md:pb-0" role="tablist" aria-label="Pipeline stages">
                {STAGES.map((s, i) => {
                  const on = i === activeStage
                  return (
                    <button
                      key={s.n}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      onClick={() => setActiveStage(i)}
                      className={`relative flex items-center gap-3 shrink-0 md:shrink px-3.5 py-3 rounded-xl border text-left cursor-pointer transition-all duration-300 focus-visible:ring-2 focus-visible:ring-accent/40 ${
                        on
                          ? 'border-accent/30 bg-accent/[0.07]'
                          : 'border-white/[0.05] bg-white/[0.015] hover:border-white/[0.1] hover:bg-white/[0.035]'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-md flex items-center justify-center font-mono text-[10px] shrink-0 transition-colors ${
                          on ? 'bg-accent text-forge-950 font-bold' : 'bg-forge-800 text-forge-400'
                        }`}
                      >
                        {s.n}
                      </span>
                      <span className="min-w-0">
                        <span className={`block text-[13px] font-medium ${on ? 'text-forge-50' : 'text-forge-300'}`}>
                          {s.name}
                        </span>
                        <span className="block text-[10.5px] text-forge-500 font-mono truncate">{s.tagline}</span>
                      </span>
                      {on && <span className="hidden md:block ml-auto w-1 self-stretch rounded-full bg-accent" aria-hidden />}
                    </button>
                  )
                })}
              </div>

              {/* Stage detail */}
              <div className="relative rounded-2xl border border-white/[0.07] bg-forge-900/40 p-6 md:p-8 overflow-hidden min-h-[280px]">
                <div className="absolute -top-24 -right-16 w-64 h-64 rounded-full bg-accent/[0.06] blur-3xl" aria-hidden />
                <div key={stage.n} className="relative" style={{ animation: 'fade-in .35s ease-out' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-accent/25 bg-accent/[0.07] text-accent-hover">
                      stage {stage.n}
                    </span>
                    <span className="text-[11px] text-forge-500 font-mono">{stage.name}</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-forge-50 m-0 mb-3">{stage.tagline}</h3>
                  <p className="text-[13.5px] leading-relaxed text-forge-400 m-0">{stage.detail}</p>

                  <div className="flex flex-wrap gap-1.5 mt-6">
                    {stage.outputs.map((o) => (
                      <span
                        key={o}
                        className="px-2.5 py-1 rounded-lg border border-white/[0.07] bg-white/[0.03] text-[11px] font-mono text-forge-300"
                      >
                        {o}
                      </span>
                    ))}
                  </div>

                  {/* Progress rail */}
                  <div className="mt-7 flex gap-1" aria-hidden>
                    {STAGES.map((_, i) => (
                      <span
                        key={i}
                        className={`h-[3px] flex-1 rounded-full transition-colors duration-500 ${
                          i <= activeStage ? 'bg-accent/70' : 'bg-white/[0.07]'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Output preview ───────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-white/[0.06] relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" aria-hidden />
        <div className="relative max-w-5xl mx-auto">
          <Reveal className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
            <div>
              <p className="font-mono text-[11px] text-accent/80 uppercase tracking-[0.2em] m-0 mb-3">
                Output
              </p>
              <h2 className="text-2xl md:text-4xl font-bold text-forge-50 m-0 tracking-tight">
                Real files, not mockups.
              </h2>
            </div>
            <p className="text-forge-400 m-0 max-w-sm text-sm leading-relaxed">
              One compile emits the schema, the server and the client. Browse what lands in the bundle.
            </p>
          </Reveal>

          <Reveal delay={80}>
            <div className="rounded-2xl border border-white/[0.08] bg-forge-950/70 backdrop-blur-sm overflow-hidden">
              <div className="flex items-center border-b border-white/[0.06] overflow-x-auto scrollbar-none" role="tablist">
                {TABS.map((t, i) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={i === tab}
                    onClick={() => setTab(i)}
                    className={`relative px-4 py-3 text-[11.5px] font-mono whitespace-nowrap cursor-pointer bg-transparent border-none transition-colors ${
                      i === tab ? 'text-forge-100' : 'text-forge-500 hover:text-forge-300'
                    }`}
                  >
                    {t.label}
                    {i === tab && <span className="absolute inset-x-3 bottom-0 h-[2px] rounded-t bg-accent" />}
                  </button>
                ))}
                <span className="ml-auto pr-4 hidden sm:block text-[10px] font-mono text-forge-600">read-only</span>
              </div>
              <pre className="m-0 p-5 md:p-6 overflow-auto text-[12px] leading-[1.9] font-mono max-h-[340px]">
                {TABS[tab].lines.map((l, i) => (
                  <div key={i} className="flex">
                    <span className="w-8 shrink-0 text-right pr-4 text-forge-700 select-none">{i + 1}</span>
                    <span className={tone[l.c]}>{l.t}</span>
                  </div>
                ))}
              </pre>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Metrics ──────────────────────────────────────────────── */}
      <section className="py-16 px-6 border-y border-white/[0.06] bg-forge-900/20">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { v: 6, s: '', l: 'Pipeline stages', d: 'Zod-validated' },
            { v: 7, s: '', l: 'Invariants', d: 'cross-layer checks' },
            { v: 20, s: '', l: 'Eval cases', d: 'products + edge cases' },
            { v: 3, s: '', l: 'Output layers', d: 'DB · API · UI' },
          ].map((m, i) => (
            <Reveal key={m.l} delay={i * 70} className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-gradient-emerald m-0 tracking-tight">
                <Counter value={Number(m.v)} suffix={m.s} />
              </p>
              <p className="text-[13px] text-forge-200 m-0 mt-2 font-medium">{m.l}</p>
              <p className="text-[11px] text-forge-500 m-0 mt-0.5 font-mono">{m.d}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-12">
            <p className="font-mono text-[11px] text-accent/80 uppercase tracking-[0.2em] m-0 mb-3">
              Why AppForge
            </p>
            <h2 className="text-2xl md:text-4xl font-bold text-forge-50 m-0 tracking-tight text-balance">
              Built for developers who ship
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 70}>
                <SpotlightCard className="group h-full p-6">
                  <div className="w-10 h-10 rounded-xl bg-accent/[0.08] border border-accent/20 flex items-center justify-center text-accent mb-4 transition-colors group-hover:bg-accent/[0.14]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      {f.icon}
                    </svg>
                  </div>
                  <h3 className="text-[14.5px] font-semibold text-forge-100 m-0 mb-1.5">{f.title}</h3>
                  <p className="text-[13px] text-forge-400 leading-relaxed m-0">{f.body}</p>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="pb-24 px-6">
        <Reveal className="max-w-4xl mx-auto">
          <div className="gradient-border">
            <div className="relative overflow-hidden rounded-[15px] px-6 py-14 md:px-16 text-center">
              <div className="absolute inset-0 aurora opacity-70" aria-hidden />
              <div className="relative">
                <h2 className="text-2xl md:text-4xl font-bold text-forge-50 m-0 mb-4 tracking-tight text-balance">
                  Ready to compile?
                </h2>
                <p className="text-forge-400 m-0 mb-8 max-w-md mx-auto">
                  Describe your app in plain English. Get production-shaped code in seconds.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/compiler"
                    className="inline-flex items-center gap-2 bg-accent text-forge-950 rounded-xl px-6 py-3 text-sm font-semibold no-underline hover:bg-accent-hover transition-all hover:shadow-[0_10px_40px_-8px_rgba(16,185,129,0.5)] active:scale-[0.985]"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    Open the compiler
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 text-forge-300 rounded-xl px-5 py-3 text-sm font-medium no-underline border border-white/[0.08] hover:bg-white/[0.04] hover:text-white transition-all"
                  >
                    See plans
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-white/[0.06] py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-secondary flex items-center justify-center">
              <span className="text-forge-950 font-mono text-[10px] font-bold">AF</span>
            </span>
            <div>
              <p className="text-[12.5px] font-semibold text-forge-200 m-0">AppForge</p>
              <p className="text-[10.5px] font-mono text-forge-600 m-0">natural language → application</p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2" aria-label="Footer">
            {[
              { href: '/compiler', label: 'Compiler' },
              { href: '/templates', label: 'Templates' },
              { href: '/demo', label: 'Examples' },
              { href: '/pricing', label: 'Pricing' },
              { href: '/sign-in', label: 'Sign in' },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="text-[12px] text-forge-500 no-underline hover:text-forge-200 transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>

          <p className="text-[10.5px] font-mono text-forge-600 m-0">© {new Date().getFullYear()} AppForge</p>
        </div>
      </footer>
    </div>
  )
}
