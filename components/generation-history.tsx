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
          <p className="text-xs font-mono text-forge-400 uppercase tracking-wider">History</p>
          <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-lg border border-white/[0.06] bg-forge-800 skeleton" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-3">
        <p className="text-xs font-mono text-forge-400 uppercase tracking-wider">History</p>
        <div className="p-4 rounded-lg border border-danger/20 bg-danger-subtle">
          <p className="text-xs text-danger mb-2">{error}</p>
          <button onClick={() => setRefreshKey((v) => v + 1)} className="text-xs font-mono text-accent-hover hover:underline focus-visible:ring-2 focus-visible:ring-accent/40">
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (generations.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-xs font-mono text-forge-400 uppercase tracking-wider">History</p>
        <div className="p-6 rounded-lg border border-dashed border-white/[0.06] text-center">
          <p className="text-xs text-forge-400">No compilations yet.</p>
          <p className="text-[11px] text-forge-500 mt-1">Your generation history will appear here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono text-forge-400 uppercase tracking-wider">History</p>
        <button onClick={() => setRefreshKey((v) => v + 1)} className="text-xs font-mono text-forge-400 hover:text-forge-300 transition-colors focus-visible:ring-2 focus-visible:ring-accent/40">
          Refresh
        </button>
      </div>
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {generations.map((gen) => (
          <button
            key={gen.id}
            onClick={() => onSelect?.(gen.id)}
            className={`w-full text-left p-4 rounded-lg border transition-all duration-150 cursor-pointer
              ${selectedId === gen.id
                ? 'border-accent/40 bg-accent-subtle'
                : 'border-white/[0.06] bg-forge-800 hover:border-white/[0.12]'}`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-mono text-forge-50 line-clamp-2 leading-relaxed flex-1">
                {gen.prompt.length > 60 ? `${gen.prompt.substring(0, 60)}...` : gen.prompt}
              </p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 font-mono
                ${['completed', 'success'].includes(gen.status)
                  ? 'bg-success-subtle text-success'
                  : gen.status === 'pending'
                  ? 'bg-warning-subtle text-warning'
                  : 'bg-danger-subtle text-danger'
                }`}>
                {gen.status}
              </span>
            </div>
            <p className="text-[10px] text-forge-400 mt-2 font-mono">
              {new Date(gen.createdAt).toLocaleDateString()}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
