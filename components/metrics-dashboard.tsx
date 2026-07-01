'use client'

import { useEffect, useState } from 'react'

interface Metrics {
  totalGenerations: number
  completedGenerations: number
  failedGenerations: number
  successRate: number
  modes: { fast: number; balanced: number; precise: number }
  averageTokensPerGeneration?: number
  averageDuration?: number
}

export function MetricsDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/metrics')
        if (!response.ok) throw new Error('Failed to fetch metrics')
        const data = await response.json()
        if (!cancelled) setMetrics(data)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load metrics')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchMetrics()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface)] animate-pulse" />
        ))}
      </div>
    )
  }

  if (error || !metrics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Compilations', value: '—' },
          { label: 'Success Rate', value: '—' },
          { label: 'Avg Latency', value: '—' },
          { label: 'Modes Used', value: '—' },
        ].map((card) => (
          <div key={card.label} className="p-5 rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface)]">
            <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">{card.label}</p>
            <p className="text-2xl font-bold text-[var(--text-primary)] mt-2 tracking-tight">{card.value}</p>
          </div>
        ))}
      </div>
    )
  }

  const cards = [
    { label: 'Total Compilations', value: String(metrics.totalGenerations), sub: `${metrics.completedGenerations} completed` },
    { label: 'Success Rate', value: `${metrics.successRate.toFixed(0)}%`, sub: `${metrics.failedGenerations} failed` },
    { label: 'Avg Latency', value: `${((metrics.averageDuration ?? 0) / 1000).toFixed(1)}s`, sub: 'per generation' },
    { label: 'Avg Tokens', value: (metrics.averageTokensPerGeneration ?? 0).toLocaleString(), sub: 'per generation' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="p-5 rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface)]">
          <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">{card.label}</p>
          <p className="text-2xl font-bold text-[var(--text-primary)] mt-2 tracking-tight">{card.value}</p>
          <p className="text-[10px] text-[var(--text-muted)] mt-1">{card.sub}</p>
        </div>
      ))}
    </div>
  )
}
