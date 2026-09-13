'use client'

import Link from 'next/link'
import { useState } from 'react'

const DEMO_PROMPTS = [
  'Build a CRM with contacts, deals, and activity tracking',
  'Create an e-commerce platform with products and orders',
  'Design a project management tool with tasks and teams',
]

export default function Hero() {
  const [activeDemo, setActiveDemo] = useState(0)

  return (
    <section className="relative overflow-hidden">
      {/* ── Background layers ───────────────────────────────────── */}
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent/[0.07] rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-secondary/[0.04] rounded-full blur-[100px]" />

      <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-20 md:pt-32 md:pb-28">
        {/* ── Badge ─────────────────────────────────────────────── */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/20 bg-accent-subtle text-accent text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            6-stage compiler with cross-layer validation
          </div>
        </div>

        {/* ── Headline ──────────────────────────────────────────── */}
        <h1 className="text-center text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] m-0 mb-6">
          <span className="text-forge-50">Describe it.</span>
          <br />
          <span className="text-gradient-emerald">Ship it.</span>
        </h1>

        <p className="text-center text-lg md:text-xl text-forge-400 max-w-2xl mx-auto m-0 mb-10 leading-relaxed">
          Turn natural language into validated database schemas, API layers, and
          React components. From idea to production-ready code in one compile.
        </p>

        {/* ── CTA ───────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
          <Link
            href="/compiler"
            className="inline-flex items-center gap-2 bg-accent text-white rounded-xl px-6 py-3 text-sm font-semibold no-underline hover:bg-accent-hover transition-all hover:shadow-xl hover:shadow-accent/25 active:scale-[0.98] glow-emerald"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Start compiling
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 text-forge-400 rounded-xl px-6 py-3 text-sm font-medium no-underline hover:text-forge-200 hover:bg-white/[0.04] transition-all border border-white/[0.06] hover:border-white/[0.12]"
          >
            See examples
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>

        {/* ── Demo terminal ─────────────────────────────────────── */}
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-white/[0.08] bg-forge-900/80 backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/40">
            {/* Title bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-forge-950/50">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-forge-600" />
                <div className="w-2.5 h-2.5 rounded-full bg-forge-600" />
                <div className="w-2.5 h-2.5 rounded-full bg-forge-600" />
              </div>
              <span className="text-[11px] font-mono text-forge-500 ml-2">appforge compiler</span>
            </div>

            {/* Content */}
            <div className="p-5 md:p-6">
              {/* Prompt */}
              <div className="flex items-start gap-3 mb-4">
                <span className="text-accent font-mono text-xs mt-0.5 shrink-0">{'>'}</span>
                <p className="text-forge-200 text-sm m-0 leading-relaxed font-mono">
                  {DEMO_PROMPTS[activeDemo]}
                </p>
              </div>

              {/* Pipeline stages */}
              <div className="flex flex-wrap gap-2 mb-5">
                {['Intent', 'Design', 'Schemas', 'Refine', 'Repair', 'Export'].map((stage, i) => (
                  <div
                    key={stage}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-accent/10 border border-accent/20 text-accent text-xs font-mono"
                  >
                    <span className="w-1 h-1 rounded-full bg-accent" />
                    {stage}
                  </div>
                ))}
              </div>

              {/* Output preview */}
              <div className="rounded-lg bg-forge-950 border border-white/[0.04] p-4 font-mono text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-accent">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Prisma schema generated (8 models)</span>
                </div>
                <div className="flex items-center gap-2 text-accent">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Express API with JWT auth (12 endpoints)</span>
                </div>
                <div className="flex items-center gap-2 text-accent">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>React component tree (6 pages)</span>
                </div>
                <div className="flex items-center gap-2 text-forge-500 mt-2">
                  <span className="w-1 h-1 rounded-full bg-accent animate-pulse" />
                  <span>0 cross-layer invariants violated</span>
                </div>
              </div>
            </div>
          </div>

          {/* Demo switcher dots */}
          <div className="flex justify-center gap-2 mt-4">
            {DEMO_PROMPTS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveDemo(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === activeDemo ? 'bg-accent w-4' : 'bg-forge-600 hover:bg-forge-500'
                }`}
                aria-label={`Demo ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
