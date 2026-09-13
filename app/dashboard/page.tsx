'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Metrics {
  totalGenerations: number
  completedGenerations: number
  failedGenerations: number
  successRate: number
  averageDuration?: number
}

interface Generation {
  id: string
  prompt: string
  status: string
  createdAt: string
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [generations, setGenerations] = useState<Generation[]>([])
  const [prompt, setPrompt] = useState('')
  const [mode, setMode] = useState('balanced')
  const [submitting, setSubmitting] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<any>(null)

  useEffect(() => { if (isLoaded && !user) router.push('/sign-in') }, [isLoaded, user, router])

  useEffect(() => {
    fetch('/api/metrics').then(r => r.json()).then(d => { if (!d.error) setMetrics(d) }).catch(() => {})
    fetch('/api/generations').then(r => r.json()).then(d => { if (Array.isArray(d)) setGenerations(d) }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedId) { setDetail(null); return }
    fetch(`/api/generations/${selectedId}`).then(r => r.json()).then(setDetail).catch(() => {})
  }, [selectedId])

  const handleGenerate = async () => {
    if (!prompt.trim() || submitting) return
    setSubmitting(true)
    try {
      const r = await fetch('/api/compile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, mode }) })
      const d = await r.json()
      if (d.jobId) { setSelectedId(d.jobId); setPrompt(''); fetch('/api/generations').then(r => r.json()).then(d => { if (Array.isArray(d)) setGenerations(d) }) }
    } catch {} finally { setSubmitting(false) }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-forge-400">Loading...</p>
        </div>
      </div>
    )
  }

  const cards = [
    { label: 'Total Compilations', value: metrics ? String(metrics.totalGenerations) : '—', sub: `${metrics?.completedGenerations ?? 0} completed`, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10M18 20V4M6 20v-4"/></svg> },
    { label: 'Success Rate', value: metrics ? `${metrics.successRate.toFixed(0)}%` : '—', sub: `${metrics?.failedGenerations ?? 0} failed`, accent: true, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
    { label: 'Avg Latency', value: metrics ? `${((metrics.averageDuration ?? 0) / 1000).toFixed(1)}s` : '—', sub: 'per generation', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
    { label: 'Repairs Made', value: metrics ? '0' : '—', sub: 'auto-fixed', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg> },
  ]

  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-8 md:py-12">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-forge-50 m-0 tracking-tight">Dashboard</h1>
          <p className="text-sm text-forge-400 m-0 mt-1">Your compilation stats and history</p>
        </div>
        <Link
          href="/compiler"
          className="inline-flex items-center gap-2 bg-accent text-white rounded-lg px-4 py-2 text-sm font-medium no-underline hover:bg-accent-hover transition-all hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98] shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          New compile
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {cards.map((c) => (
          <div key={c.label} className="group p-5 rounded-xl border border-white/[0.06] bg-forge-900/50 hover:border-white/[0.1] transition-all">
            <div className="flex items-center justify-between mb-3">
              <p className="font-mono text-[10px] text-forge-500 uppercase tracking-[0.1em] m-0">{c.label}</p>
              <span className="text-forge-600 group-hover:text-forge-400 transition-colors">{c.icon}</span>
            </div>
            <p className={`text-2xl font-bold m-0 tracking-tight ${c.accent ? 'text-success' : 'text-forge-50'}`}>{c.value}</p>
            <p className="text-[11px] text-forge-500 m-0 mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Left: form + detail */}
        <div className="flex flex-col gap-6">
          {/* Compile form */}
          <div className="bg-forge-900/50 border border-white/[0.06] rounded-xl p-6">
            <p className="font-mono text-[10px] text-forge-500 uppercase tracking-[0.1em] m-0 mb-4">New Compilation</p>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your application in plain English..."
              className="w-full min-h-[120px] bg-forge-800 border border-white/[0.06] rounded-xl p-4 text-sm text-forge-100 font-mono resize-none outline-none leading-relaxed mb-4 placeholder:text-forge-600 focus:border-accent transition-colors"
            />
            <div className="flex gap-2 items-center">
              <select value={mode} onChange={(e) => setMode(e.target.value)}
                className="h-10 bg-forge-800 border border-white/[0.06] rounded-lg px-3 text-xs text-forge-200 font-mono cursor-pointer focus-visible:ring-2 focus-visible:ring-accent/40 focus:outline-none appearance-none">
                <option value="balanced">Balanced</option>
                <option value="fast">Fast</option>
                <option value="precise">Precise</option>
              </select>
              <button onClick={handleGenerate} disabled={submitting || !prompt.trim()}
                className="flex-1 h-10 bg-accent text-white border-none rounded-lg text-sm font-semibold cursor-pointer hover:bg-accent-hover transition-all hover:shadow-lg hover:shadow-accent/20 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]">
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Compiling...
                  </span>
                ) : 'Generate app'}
              </button>
            </div>
          </div>

          {/* Detail view */}
          {detail && (
            <div className="bg-forge-900/50 border border-white/[0.06] rounded-xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-forge-100 m-0 truncate">{detail.config?.metadata?.name || 'Generation'}</h3>
                  <p className="text-[11px] text-forge-500 m-0 mt-1 truncate">{detail.config?.metadata?.description}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-success-subtle text-success shrink-0 border border-success/20">compiled</span>
              </div>
              <pre className="bg-forge-800 p-4 rounded-xl text-[11px] overflow-auto max-h-[300px] text-forge-300 border border-white/[0.06] font-mono leading-7 m-0">
                {JSON.stringify(detail.config, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Right: history */}
        <div className="bg-forge-900/50 border border-white/[0.06] rounded-xl p-5 lg:sticky lg:top-20">
          <p className="font-mono text-[10px] text-forge-500 uppercase tracking-[0.1em] m-0 mb-4">History</p>
          {generations.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-10 h-10 rounded-lg bg-forge-800 border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-forge-500"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
              </div>
              <p className="text-xs text-forge-400 m-0">No compilations yet</p>
              <p className="text-[11px] text-forge-600 m-0 mt-1">Describe your app to get started</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[500px] overflow-auto">
              {generations.map((g) => (
                <button key={g.id} onClick={() => setSelectedId(g.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer
                    ${selectedId === g.id
                      ? 'border-accent/30 bg-accent-subtle'
                      : 'border-white/[0.04] bg-forge-800/50 hover:border-white/[0.08] hover:bg-forge-800'}`}>
                  <p className="text-xs font-mono text-forge-200 m-0 leading-relaxed truncate">
                    {g.prompt.length > 50 ? g.prompt.slice(0, 50) + '...' : g.prompt}
                  </p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[10px] text-forge-500 font-mono">{new Date(g.createdAt).toLocaleDateString()}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono
                      ${['completed','success'].includes(g.status) ? 'bg-success-subtle text-success border border-success/20' :
                        g.status === 'pending' ? 'bg-warning-subtle text-warning border border-warning/20' :
                        'bg-danger-subtle text-danger border border-danger/20'}`}>{g.status}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
