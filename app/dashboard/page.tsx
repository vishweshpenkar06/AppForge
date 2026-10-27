'use client'

import { useCallback, useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import {
  ArrowUpRight,
  Check,
  Clock,
  Copy,
  Gauge,
  History,
  Layers,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { Counter } from '@/components/ui/motion'
import { OnboardingTourLazy } from '@/components/onboarding-tour-lazy'

interface Metrics {
  totalGenerations: number
  completedGenerations: number
  failedGenerations: number
  successRate: number
  averageDuration?: number
  averageTokensPerGeneration?: number
}

interface Generation {
  id: string
  prompt: string
  status: string
  createdAt: string
}

interface GenerationDetail {
  config?: {
    metadata?: { name?: string; description?: string }
    [key: string]: unknown
  }
}

const MODES = [
  { id: 'fast', label: 'Fast' },
  { id: 'balanced', label: 'Balanced' },
  { id: 'precise', label: 'Precise' },
]

const SUGGESTIONS = [
  'CRM with contacts and deals',
  'SaaS invoicing with Stripe',
  'LMS with courses and lessons',
]

const statusStyle = (status: string) =>
  ['completed', 'success'].includes(status)
    ? 'bg-success-subtle text-success border-success/25'
    : status === 'pending' || status === 'running'
      ? 'bg-warning-subtle text-warning border-warning/25'
      : 'bg-danger-subtle text-danger border-danger/25'

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [generations, setGenerations] = useState<Generation[]>([])
  const [prompt, setPrompt] = useState('')
  const [mode, setMode] = useState('balanced')
  const [submitting, setSubmitting] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<GenerationDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [query, setQuery] = useState('')

  const loadMetrics = useCallback(() => {
    fetch('/api/metrics')
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setMetrics(d)
      })
      .catch(() => {})
  }, [])

  const loadGenerations = useCallback(() => {
    fetch('/api/generations')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.items)) setGenerations(d.items)
      })
      .catch(() => toast.error('Could not load your history'))
  }, [])

  useEffect(() => {
    if (isLoaded && !user) router.push('/sign-in')
  }, [isLoaded, user, router])

  useEffect(() => {
    loadMetrics()
    loadGenerations()
  }, [loadMetrics, loadGenerations])

  useEffect(() => {
    if (!selectedId) {
      setDetail(null)
      return
    }
    let cancelled = false
    fetch(`/api/generations/${selectedId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setDetail(d)
      })
      .catch(() => toast.error('Could not load that compilation'))
    return () => {
      cancelled = true
    }
  }, [selectedId])

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const r = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, mode }),
      })
      const d = await r.json()
      if (!r.ok || d.success === false) {
        const issues: string[] = d.detectedIssues || []
        const message =
          d.error || (issues.length ? `Prompt needs more detail: ${issues.join('; ')}` : 'Compilation failed')
        setError(message)
        toast.error(message)
        return
      }
      if (d.jobId) {
        setSelectedId(d.jobId)
        setPrompt('')
        loadGenerations()
        loadMetrics()
        toast.success('Compilation finished')
      } else {
        setError('Compilation completed but no job id was returned')
      }
    } catch {
      const message = 'Compilation failed — check your connection and try again'
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }, [prompt, submitting, mode, loadGenerations, loadMetrics])

  const copyConfig = async () => {
    if (!detail) return
    await navigator.clipboard.writeText(JSON.stringify(detail, null, 2))
    setCopied(true)
    toast.success('Config copied')
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isLoaded) {
    return (
      <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[104px] skeleton" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div className="h-[260px] skeleton" />
          <div className="h-[320px] skeleton" />
        </div>
      </div>
    )
  }

  const cards = [
    {
      label: 'Compilations',
      value: metrics?.totalGenerations ?? 0,
      sub: `${metrics?.completedGenerations ?? 0} completed`,
      icon: Layers,
      tone: 'text-forge-200',
    },
    {
      label: 'Success rate',
      value: metrics?.successRate ?? 0,
      suffix: '%',
      sub: `${metrics?.failedGenerations ?? 0} failed`,
      icon: TrendingUp,
      tone: 'text-success',
    },
    {
      label: 'Avg latency',
      value: (metrics?.averageDuration ?? 0) / 1000,
      decimals: 1,
      suffix: 's',
      sub: 'per generation',
      icon: Clock,
      tone: 'text-secondary',
    },
    {
      label: 'Avg tokens',
      value: metrics?.averageTokensPerGeneration ?? 0,
      sub: 'per generation',
      icon: Gauge,
      tone: 'text-warning',
    },
  ]

  const visible = query
    ? generations.filter((g) => g.prompt.toLowerCase().includes(query.toLowerCase()))
    : generations

  const selected = generations.find((g) => g.id === selectedId)

  return (
    <div className="relative max-w-[1100px] mx-auto px-4 md:px-6 py-8 md:py-12">
      <div
        className="absolute inset-x-0 top-0 h-64 pointer-events-none bg-[radial-gradient(70%_100%_at_50%_0%,rgba(16,185,129,0.10),transparent_70%)]"
        aria-hidden
      />

      {/* Header */}
      <div className="relative mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] text-accent/80 uppercase tracking-[0.2em] m-0 mb-2">Workspace</p>
          <h1 className="text-2xl md:text-3xl font-bold text-forge-50 m-0 tracking-tight">
            {user?.firstName ? `Welcome back, ${user.firstName}` : 'Dashboard'}
          </h1>
          <p className="text-sm text-forge-400 m-0 mt-1">Your compilation stats and history</p>
        </div>
        <Link
          href="/compiler"
          className="group inline-flex items-center gap-2 bg-accent text-forge-950 rounded-xl px-4 py-2.5 text-sm font-semibold no-underline hover:bg-accent-hover transition-all hover:shadow-[0_10px_30px_-10px_rgba(16,185,129,0.6)] active:scale-[0.98] shrink-0"
        >
          <Zap className="w-4 h-4" />
          New compile
          <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      {/* Stat cards */}
      <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8" data-tour="stats">
        {cards.map(({ label, value, suffix, decimals, sub, icon: Icon, tone }) => (
          <div
            key={label}
            className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-forge-900/60 p-4 md:p-5 transition-all hover:border-white/[0.12] hover:bg-forge-900"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="font-mono text-[10px] text-forge-500 uppercase tracking-[0.1em] m-0">{label}</p>
              <Icon className="w-3.5 h-3.5 text-forge-600 transition-colors group-hover:text-forge-400" />
            </div>
            <p className={`text-2xl md:text-[26px] font-bold m-0 tracking-tight tabular-nums ${tone}`}>
              {metrics ? (
                <Counter value={Number(value)} decimals={decimals} suffix={suffix} />
              ) : (
                <span className="inline-block h-7 w-14 rounded bg-white/[0.06] animate-pulse" />
              )}
            </p>
            <p className="text-[11px] text-forge-500 m-0 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_330px] gap-5 items-start">
        {/* Left: compose + detail */}
        <div className="flex flex-col gap-5 min-w-0">
          <div className="rounded-2xl border border-white/[0.07] bg-forge-900/50 p-5 md:p-6" data-tour="new-compile">
            <div className="flex items-center justify-between mb-3">
              <p className="font-mono text-[10px] text-forge-500 uppercase tracking-[0.12em] m-0">New compilation</p>
              <span className="text-[10px] font-mono text-forge-600">{prompt.length} chars</span>
            </div>

            <label htmlFor="prompt" className="sr-only">
              Describe your application
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault()
                  void handleGenerate()
                }
              }}
              placeholder="Describe your application in plain English — entities, roles, and the flows that matter..."
              className="w-full min-h-[132px] bg-forge-950/60 border border-white/[0.07] rounded-xl p-4 text-[13.5px] text-forge-100 font-mono resize-none outline-none leading-relaxed placeholder:text-forge-600 focus:border-accent/60 focus:ring-2 focus:ring-accent/10 transition-all"
            />

            <div className="flex flex-wrap gap-1.5 mt-2.5 mb-4">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPrompt(s)}
                  className="text-[11px] px-2.5 py-1 rounded-lg border border-white/[0.06] bg-white/[0.02] text-forge-400 hover:text-forge-200 hover:border-white/[0.12] transition-colors cursor-pointer font-mono"
                >
                  + {s}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex rounded-xl border border-white/[0.07] bg-forge-950/60 p-0.5" role="group" aria-label="Compile mode">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={mode === m.id}
                    onClick={() => setMode(m.id)}
                    className={`flex-1 px-3 py-1.5 rounded-[10px] text-[11.5px] font-mono transition-all cursor-pointer border-none ${
                      mode === m.id
                        ? 'bg-forge-700 text-forge-50 shadow-sm'
                        : 'bg-transparent text-forge-500 hover:text-forge-300'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => void handleGenerate()}
                disabled={submitting || !prompt.trim()}
                className="flex-1 h-10 bg-accent text-forge-950 border-none rounded-xl text-sm font-semibold cursor-pointer hover:bg-accent-hover transition-all hover:shadow-[0_10px_30px_-10px_rgba(16,185,129,0.6)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.99] flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-forge-950/40 border-t-forge-950 rounded-full animate-spin" />
                    Compiling…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate app
                  </>
                )}
              </button>
            </div>
            <p className="text-[10.5px] text-forge-600 font-mono m-0 mt-2.5">⌘/Ctrl + Enter to compile</p>

            {error && (
              <p role="alert" className="mt-3 mb-0 text-xs text-danger bg-danger-subtle border border-danger/20 rounded-lg px-3 py-2.5">
                {error}
              </p>
            )}
          </div>

          {/* Detail */}
          {detail && (
            <div className="rounded-2xl border border-white/[0.07] bg-forge-900/50 overflow-hidden" style={{ animation: 'reveal-up .4s cubic-bezier(.16,1,.3,1)' }}>
              <div className="flex items-start justify-between gap-3 p-5 border-b border-white/[0.06]">
                <div className="min-w-0">
                  <h3 className="text-[14px] font-semibold text-forge-50 m-0 truncate">
                    {selected?.prompt || 'Generation'}
                  </h3>
                  <p className="text-[11.5px] text-forge-500 m-0 mt-0.5 truncate">
                    {detail.config?.metadata?.description || selected?.status || 'Compiled bundle'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={copyConfig}
                    className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1.5 rounded-lg border border-white/[0.07] bg-white/[0.02] text-forge-300 hover:text-forge-100 hover:border-white/[0.14] transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  {selectedId && (
                    <Link
                      href={`/generated/${selectedId}`}
                      className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-1.5 rounded-lg border border-accent/25 bg-accent-subtle text-accent-hover hover:bg-accent/15 transition-colors no-underline"
                    >
                      Open <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
              <pre className="bg-forge-950/70 p-5 text-[11px] overflow-auto max-h-[340px] text-forge-300 font-mono leading-6 m-0">
                {JSON.stringify(detail.config ?? detail, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Right: history */}
        <aside className="rounded-2xl border border-white/[0.07] bg-forge-900/50 p-4 lg:sticky lg:top-20" data-tour="history">
          <div className="flex items-center justify-between mb-3">
            <p className="font-mono text-[10px] text-forge-500 uppercase tracking-[0.12em] m-0 flex items-center gap-1.5">
              <History className="w-3 h-3" /> History
            </p>
            <span className="text-[10px] font-mono text-forge-600">{generations.length}</span>
          </div>

          {generations.length > 3 && (
            <>
              <label htmlFor="history-search" className="sr-only">
                Filter history
              </label>
              <input
                id="history-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter prompts…"
                className="w-full h-8 mb-2.5 px-2.5 bg-forge-950/60 border border-white/[0.06] rounded-lg text-[11.5px] text-forge-200 font-mono outline-none placeholder:text-forge-600 focus:border-accent/50 transition-colors"
              />
            </>
          )}

          {generations.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-11 h-11 rounded-xl bg-forge-800 border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
                <Layers className="w-4 h-4 text-forge-500" />
              </div>
              <p className="text-xs text-forge-300 m-0">No compilations yet</p>
              <p className="text-[11px] text-forge-600 m-0 mt-1">Describe your app to get started</p>
            </div>
          ) : visible.length === 0 ? (
            <p className="text-[11.5px] text-forge-500 text-center py-8 m-0">No prompts match “{query}”.</p>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-[520px] overflow-auto scrollbar-none pr-0.5">
              {visible.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedId(g.id)}
                  aria-pressed={selectedId === g.id}
                  className={`group w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedId === g.id
                      ? 'border-accent/30 bg-accent-subtle'
                      : 'border-white/[0.05] bg-white/[0.015] hover:border-white/[0.12] hover:bg-white/[0.04]'
                  }`}
                >
                  <p className="text-[11.5px] font-mono text-forge-200 m-0 leading-relaxed line-clamp-2">
                    {g.prompt}
                  </p>
                  <div className="flex justify-between items-center mt-2 gap-2">
                    <span className="text-[10px] text-forge-500 font-mono">
                      {formatDistanceToNow(new Date(g.createdAt), { addSuffix: true })}
                    </span>
                    <span className={`text-[9.5px] px-1.5 py-0.5 rounded-full font-mono border ${statusStyle(g.status)}`}>
                      {g.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </aside>
      </div>

      <OnboardingTourLazy />
    </div>
  )
}
