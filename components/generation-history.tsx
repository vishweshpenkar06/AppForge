'use client'

import { useEffect, useState } from 'react'
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

  useEffect(() => {
    if (!user) return

    const fetchGenerations = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/generations')
        if (!response.ok) throw new Error('Failed to fetch generations')
        const data = await response.json()
        setGenerations(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load history')
      } finally {
        setLoading(false)
      }
    }

    fetchGenerations()
    // Poll for updates every 2 seconds
    const interval = setInterval(fetchGenerations, 2000)
    return () => clearInterval(interval)
  }, [user])

  if (loading && generations.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    )
  }

  if (error) {
    return <div className="text-red-400 text-sm">{error}</div>
  }

  if (generations.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 text-sm">No generations yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg">Recent Generations</h3>
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {generations.map((gen) => (
          <button
            key={gen.id}
            onClick={() => onSelect?.(gen.id)}
            className={`w-full text-left p-3 rounded-lg border transition-colors ${
              selectedId === gen.id
                ? 'bg-blue-900/20 border-blue-600'
                : 'bg-[#0f0f13] border-gray-700 hover:border-gray-600'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-white">
                  {gen.prompt.substring(0, 40)}...
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(gen.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex-shrink-0">
                <span
                  className={`inline-block px-2 py-1 text-xs rounded font-medium ${
                    gen.status === 'completed'
                      ? 'bg-green-900/30 text-green-300'
                      : gen.status === 'pending'
                      ? 'bg-yellow-900/30 text-yellow-300'
                      : 'bg-red-900/30 text-red-300'
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
