'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { Search, Star } from 'lucide-react'

interface Generation {
  id: string
  prompt: string
  status: string
  createdAt: string
  mode: string
  isFavorite: boolean
}

interface GenerationHistoryProps {
  onSelect?: (id: string) => void
  selectedId?: string | null
}

type Tab = 'all' | 'favorites'

export function GenerationHistory({ onSelect, selectedId }: GenerationHistoryProps) {
  const [generations, setGenerations] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('all')

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

  const toggleFavorite = useCallback(async (id: string, current: boolean) => {
    setGenerations((prev) =>
      prev.map((g) => (g.id === id ? { ...g, isFavorite: !current } : g))
    )
    try {
      await fetch('/api/generations/search', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isFavorite: !current }),
      })
    } catch {
      setGenerations((prev) =>
        prev.map((g) => (g.id === id ? { ...g, isFavorite: current } : g))
      )
    }
  }, [])

  const filtered = useMemo(() => {
    let list = generations
    if (activeTab === 'favorites') {
      list = list.filter((g) => g.isFavorite)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter((g) => g.prompt.toLowerCase().includes(q))
    }
    return list
  }, [generations, activeTab, searchQuery])

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

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-forge-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search prompts..."
          className="w-full pl-8 pr-3 py-1.5 text-xs font-mono rounded-lg border border-white/[0.06] bg-forge-800 text-forge-100 placeholder:text-forge-500 focus:outline-none focus:ring-1 focus:ring-accent/40"
        />
      </div>

      <div className="flex gap-1">
        {(['all', 'favorites'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-2 py-1 text-[10px] font-mono rounded transition-colors focus-visible:ring-2 focus-visible:ring-accent/40
              ${activeTab === tab
                ? 'bg-accent/10 text-accent'
                : 'text-forge-400 hover:text-forge-300'}`}
          >
            {tab === 'all' ? 'All' : 'Favorites'}
          </button>
        ))}
      </div>

      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {filtered.length === 0 && (
          <div className="p-4 rounded-lg border border-dashed border-white/[0.06] text-center">
            <p className="text-xs text-forge-400">
              {searchQuery ? 'No matches found.' : activeTab === 'favorites' ? 'No favorites yet.' : 'No results.'}
            </p>
          </div>
        )}
        {filtered.map((gen) => (
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
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleFavorite(gen.id, gen.isFavorite)
                  }}
                  className="p-0.5 rounded hover:bg-white/[0.06] transition-colors focus-visible:ring-2 focus-visible:ring-accent/40"
                  aria-label={gen.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star
                    className={`w-3.5 h-3.5 ${gen.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-forge-500'}`}
                  />
                </button>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono
                  ${['completed', 'success'].includes(gen.status)
                    ? 'bg-success-subtle text-success'
                    : gen.status === 'pending'
                    ? 'bg-warning-subtle text-warning'
                    : 'bg-danger-subtle text-danger'
                  }`}>
                  {gen.status}
                </span>
              </div>
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
