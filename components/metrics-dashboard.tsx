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

  useEffect(() => {
    let cancelled = false
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/metrics')
        if (!response.ok) throw new Error('Failed to fetch')
        const data = await response.json()
        if (!cancelled && data && !data.error) {
          setMetrics(data)
        }
      } catch {
        // silently fail — show 0s
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchMetrics()
    return () => { cancelled = true }
  }, [])

  const total = metrics?.totalGenerations ?? 0
  const completed = metrics?.completedGenerations ?? 0
  const failed = metrics?.failedGenerations ?? 0
  const rate = metrics?.successRate ?? 0
  const duration = metrics?.averageDuration ?? 0
  const tokens = metrics?.averageTokensPerGeneration ?? 0

  const cards = [
    { label: 'Total Compilations', value: loading ? '—' : String(total), sub: `${completed} completed` },
    { label: 'Success Rate', value: loading ? '—' : `${rate.toFixed(0)}%`, sub: `${failed} failed` },
    { label: 'Avg Latency', value: loading ? '—' : `${(duration / 1000).toFixed(1)}s`, sub: 'per generation' },
    { label: 'Avg Tokens', value: loading ? '—' : tokens.toLocaleString(), sub: 'per generation' },
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
