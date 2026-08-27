'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

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
    { label: 'Total Compilations', value: metrics ? String(metrics.totalGenerations) : '—', sub: `${metrics?.completedGenerations ?? 0} completed` },
    { label: 'Success Rate', value: metrics ? `${metrics.successRate.toFixed(0)}%` : '—', sub: `${metrics?.failedGenerations ?? 0} failed`, accent: true },
    { label: 'Avg Latency', value: metrics ? `${((metrics.averageDuration ?? 0) / 1000).toFixed(1)}s` : '—', sub: 'per generation' },
    { label: 'Repairs Made', value: metrics ? '0' : '—', sub: 'auto-fixed' },
  ]

  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-forge-50 m-0">Dashboard</h1>
        <p className="text-sm text-forge-400 m-0 mt-1">Your compilation stats and history</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {cards.map((c) => (
          <div key={c.label} className="p-5 rounded-xl border border-white/[0.06] bg-forge-800">
            <p className="font-mono text-[10px] text-forge-400 uppercase tracking-[0.1em] m-0">{c.label}</p>
            <p className={`text-2xl font-bold m-0 mt-2 tracking-tight ${c.accent ? 'text-success' : 'text-forge-50'}`}>{c.value}</p>
            <p className="text-[11px] text-forge-400 m-0 mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Left: form + detail */}
        <div className="flex flex-col gap-6">
          <div className="bg-forge-800 border border-white/[0.06] rounded-xl p-6">
            <p className="font-mono text-[10px] text-forge-400 uppercase tracking-[0.1em] m-0 mb-3">New Compilation</p>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your application..."
              className="w-full min-h-[100px] bg-forge-700 border border-white/[0.06] rounded-xl p-3 text-sm text-forge-50 font-mono resize-none outline-none leading-relaxed mb-3 placeholder:text-forge-500 focus:border-accent transition-colors"
            />
            <div className="flex gap-2 items-center">
              <select value={mode} onChange={(e) => setMode(e.target.value)}
                className="h-9 bg-forge-700 border border-white/[0.06] rounded-xl px-2.5 text-xs text-forge-50 font-mono cursor-pointer focus-visible:ring-2 focus-visible:ring-accent/40 focus:outline-none">
                <option value="balanced">Balanced</option>
                <option value="fast">Fast</option>
                <option value="precise">Precise</option>
              </select>
              <button onClick={handleGenerate} disabled={submitting || !prompt.trim()}
                className="flex-1 h-9 bg-accent text-white border-none rounded-xl text-sm font-semibold cursor-pointer hover:bg-accent-hover transition-colors disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-forge-950">
                {submitting ? 'Compiling...' : 'Generate app'}
              </button>
            </div>
          </div>

          {detail && (
            <div className="bg-forge-800 border border-white/[0.06] rounded-xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-forge-50 m-0 truncate">{detail.config?.metadata?.name || 'Generation'}</h3>
                  <p className="text-[11px] text-forge-400 m-0 mt-1 truncate">{detail.config?.metadata?.description}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-success-subtle text-success shrink-0">compiled</span>
              </div>
              <pre className="bg-forge-700 p-4 rounded-xl text-[11px] overflow-auto max-h-[300px] text-forge-300 border border-white/[0.06] font-mono leading-7 m-0">
                {JSON.stringify(detail.config, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Right: history */}
        <div className="bg-forge-800 border border-white/[0.06] rounded-xl p-5 lg:sticky lg:top-20">
          <p className="font-mono text-[10px] text-forge-400 uppercase tracking-[0.1em] m-0 mb-4">History</p>
          {generations.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-xs text-forge-400 m-0">No compilations yet.</p>
              <p className="text-[11px] text-forge-500 m-0 mt-1">Describe your app above to get started.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[500px] overflow-auto">
              {generations.map((g) => (
                <button key={g.id} onClick={() => setSelectedId(g.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer
                    ${selectedId === g.id
                      ? 'border-accent/40 bg-accent-subtle'
                      : 'border-white/[0.06] bg-forge-700 hover:border-white/[0.12]'}`}>
                  <p className="text-xs font-mono text-forge-50 m-0 leading-relaxed truncate">
                    {g.prompt.length > 50 ? g.prompt.slice(0, 50) + '...' : g.prompt}
                  </p>
                  <div className="flex justify-between items-center mt-1.5">
                    <span className="text-[10px] text-forge-400 font-mono">{new Date(g.createdAt).toLocaleDateString()}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono
                      ${['completed','success'].includes(g.status) ? 'bg-success-subtle text-success' :
                        g.status === 'pending' ? 'bg-warning-subtle text-warning' :
                        'bg-danger-subtle text-danger'}`}>{g.status}</span>
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
