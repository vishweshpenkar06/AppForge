'use client'

import { useEffect, useState } from 'react'

interface Generation {
  id: string
  prompt: string
  status: string
  createdAt: string
  mode: string
}

interface GenerationHistoryProps {
  onSelect?: (id: string) => void
  selectedId?: string | null
}

export function GenerationHistory({ onSelect, selectedId }: GenerationHistoryProps) {
  const [generations, setGenerations] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    const fetchGenerations = async () => {
      try {
        setError(null)
        if (generations.length === 0) setLoading(true)
        const response = await fetch('/api/generations')
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to fetch generations')
        }
        const data = await response.json()
        if (!cancelled) setGenerations(data)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load history')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchGenerations()
    return () => { cancelled = true }
  }, [refreshKey])

  if (loading && generations.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">History</p>
          <div className="w-4 h-4 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-lg border border-[var(--bg-border)] bg-[var(--bg-elevated)] animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-3">
        <p className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">History</p>
        <div className="p-4 rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5">
          <p className="text-xs text-[var(--error)] mb-2">{error}</p>
          <button onClick={() => setRefreshKey((v) => v + 1)} className="text-xs font-mono text-[var(--accent-primary)] hover:underline">
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (generations.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">History</p>
        <div className="p-6 rounded-lg border border-dashed border-[var(--bg-border)] text-center">
          <p className="text-xs text-[var(--text-muted)]">No generations yet</p>
          <button onClick={() => setRefreshKey((v) => v + 1)} className="text-xs font-mono text-[var(--accent-primary)] hover:underline mt-2">
            Refresh
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">History</p>
        <button onClick={() => setRefreshKey((v) => v + 1)} className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
          Refresh
        </button>
      </div>
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {generations.map((gen) => (
          <button
            key={gen.id}
            onClick={() => onSelect?.(gen.id)}
            className={`w-full text-left p-4 rounded-lg border transition-all duration-150
              ${selectedId === gen.id
                ? 'border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/5'
                : 'border-[var(--bg-border)] bg-[var(--bg-elevated)] hover:border-[var(--accent-primary)]/20 hover:bg-[var(--bg-surface)]'
              }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-mono text-[var(--text-primary)] line-clamp-2 leading-relaxed flex-1">
                {gen.prompt.length > 60 ? `${gen.prompt.substring(0, 60)}...` : gen.prompt}
              </p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 font-mono
                ${['completed', 'success'].includes(gen.status)
                  ? 'bg-[var(--success)]/10 text-[var(--success)]'
                  : gen.status === 'pending'
                  ? 'bg-[var(--warning)]/10 text-[var(--warning)]'
                  : 'bg-[var(--error)]/10 text-[var(--error)]'
                }`}>
                {gen.status}
              </span>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-2 font-mono">
              {new Date(gen.createdAt).toLocaleDateString()}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
