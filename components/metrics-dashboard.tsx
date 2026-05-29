'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, Activity, Gauge, Sparkles, Clock3, Boxes } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

interface Metrics {
  totalGenerations: number
  completedGenerations: number
  failedGenerations: number
  successRate: number
  modes: {
    fast: number
    balanced: number
    precise: number
  }
  averageTokensPerGeneration?: number
  averageDuration?: number
}

export function MetricsDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    const fetchMetrics = async () => {
      try {
        setError(null)
        const response = await fetch('/api/metrics')
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to fetch metrics')
        }
        const data = await response.json()
        if (!cancelled) {
          setMetrics(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load metrics')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchMetrics()
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  if (loading) {
    return (
      <div className="grid gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="h-28 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
          ))}
        </div>
        <div className="flex items-center justify-center gap-3 py-4 text-sm text-zinc-400">
          <Spinner />
          Loading metrics...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-red-200">Metrics unavailable</p>
          <p className="text-sm text-red-200/80 mt-1">{error}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setRefreshKey((value) => value + 1)}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-400">
        No metrics available yet.
      </div>
    )
  }

  const modeEntries = Object.entries(metrics.modes)
  const modeTotal = modeEntries.reduce((sum, [, count]) => sum + count, 0)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Generations"
          value={metrics.totalGenerations}
          note={`${metrics.completedGenerations} completed • ${metrics.failedGenerations} failed`}
          icon={<Boxes className="h-4 w-4" />}
        />
        <MetricCard
          title="Success Rate"
          value={`${metrics.successRate.toFixed(1)}%`}
          note={`${metrics.completedGenerations} successful runs`}
          accent="emerald"
          icon={<Gauge className="h-4 w-4" />}
        />
        <MetricCard
          title="Avg Tokens"
          value={metrics.averageTokensPerGeneration?.toLocaleString() ?? '0'}
          note="per generation"
          accent="sky"
          icon={<Activity className="h-4 w-4" />}
        />
        <MetricCard
          title="Avg Duration"
          value={`${((metrics.averageDuration ?? 0) / 1000).toFixed(1)}s`}
          note="per generation"
          accent="violet"
          icon={<Clock3 className="h-4 w-4" />}
        />
      </div>

      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] via-white/[0.03] to-transparent p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Mode Mix</p>
            <h3 className="text-lg font-semibold text-white">How generations are being compiled</h3>
          </div>
          <Button variant="outline" size="sm" onClick={() => setRefreshKey((value) => value + 1)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="space-y-4">
          {modeEntries.map(([mode, count]) => {
            const percentage = modeTotal > 0 ? (count / modeTotal) * 100 : 0

            return (
              <div key={mode} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-300 capitalize">{mode}</span>
                  <span className="text-zinc-500">{count} runs</span>
                </div>
                <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-400 via-cyan-400 to-emerald-400"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function MetricCard({
  title,
  value,
  note,
  icon,
  accent = 'blue',
}: {
  title: string
  value: string | number
  note: string
  icon: React.ReactNode
  accent?: 'blue' | 'emerald' | 'sky' | 'violet'
}) {
  const accentClasses = {
    blue: 'from-sky-500/20 to-sky-400/5 text-sky-300',
    emerald: 'from-emerald-500/20 to-emerald-400/5 text-emerald-300',
    sky: 'from-cyan-500/20 to-cyan-400/5 text-cyan-300',
    violet: 'from-violet-500/20 to-violet-400/5 text-violet-300',
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className={`absolute inset-0 bg-gradient-to-br ${accentClasses[accent]} opacity-50`} />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-400">{title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{value}</p>
          <p className="mt-2 text-xs text-zinc-500">{note}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-2 text-white/90">
          {icon}
        </div>
      </div>
    </div>
  )
}
