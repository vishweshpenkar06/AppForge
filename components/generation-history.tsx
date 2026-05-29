'use client'

import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

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
  const { user } = useUser()
  const [generations, setGenerations] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    if (!user) return

    const fetchGenerations = async () => {
      try {
        setError(null)
        setLoading(true)
        const response = await fetch('/api/generations')
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to fetch generations')
        }
        const data = await response.json()
        if (!cancelled) {
          setGenerations(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load history')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchGenerations()
    // Poll for updates every 2 seconds
    const interval = setInterval(fetchGenerations, 2000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [user, refreshKey])

  if (loading && generations.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg text-white">Recent Generations</h3>
            <p className="text-sm text-zinc-500">Your latest compilation jobs</p>
          </div>
          <Spinner />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="h-20 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-red-200">History unavailable</p>
            <p className="text-sm text-red-200/80 mt-1">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setRefreshKey((value) => value + 1)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (generations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-center">
        <p className="text-sm font-medium text-white">No generations yet</p>
        <p className="mt-1 text-sm text-zinc-500">Run your first prompt to see jobs appear here.</p>
        <Button className="mt-4" variant="outline" size="sm" onClick={() => setRefreshKey((value) => value + 1)}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-lg text-white">Recent Generations</h3>
          <p className="text-sm text-zinc-500">Latest compilations and their current state</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setRefreshKey((value) => value + 1)}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
        {generations.map((gen) => (
          <button
            key={gen.id}
            onClick={() => onSelect?.(gen.id)}
            className={`w-full text-left p-3 rounded-lg border transition-colors ${
              selectedId === gen.id
                ? 'bg-sky-500/10 border-sky-500/40 shadow-[0_0_0_1px_rgba(56,189,248,0.15)]'
                : 'bg-white/[0.03] border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-white">
                  {gen.prompt.length > 50 ? `${gen.prompt.substring(0, 50)}...` : gen.prompt}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  {new Date(gen.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex-shrink-0">
                <span
                  className={`inline-block px-2 py-1 text-xs rounded font-medium ${
                    ['completed', 'success'].includes(gen.status)
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : gen.status === 'pending'
                      ? 'bg-amber-500/15 text-amber-300'
                      : 'bg-rose-500/15 text-rose-300'
                  }`}
                >
                  {gen.status}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
