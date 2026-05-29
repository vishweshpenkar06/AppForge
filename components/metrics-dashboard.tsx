'use client'

import { useEffect, useState } from 'react'
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

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/metrics')
        if (!response.ok) throw new Error('Failed to fetch metrics')
        const data = await response.json()
        setMetrics(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load metrics')
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    )
  }

  if (error) {
    return <div className="text-red-400 text-sm">{error}</div>
  }

  if (!metrics) {
    return <div className="text-gray-400 text-sm">No metrics available</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Generations */}
        <div className="p-4 bg-[#0f0f13] border border-gray-700 rounded-lg">
          <p className="text-gray-400 text-sm font-medium">Total Generations</p>
          <p className="text-3xl font-bold text-white mt-2">{metrics.totalGenerations}</p>
          <p className="text-xs text-gray-500 mt-2">
            {metrics.completedGenerations} completed • {metrics.failedGenerations} failed
          </p>
        </div>

        {/* Success Rate */}
        <div className="p-4 bg-[#0f0f13] border border-gray-700 rounded-lg">
          <p className="text-gray-400 text-sm font-medium">Success Rate</p>
          <p className="text-3xl font-bold text-green-400 mt-2">
            {metrics.successRate.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {metrics.completedGenerations} / {metrics.totalGenerations}
          </p>
        </div>

        {/* Avg Tokens */}
        {metrics.averageTokensPerGeneration !== undefined && (
          <div className="p-4 bg-[#0f0f13] border border-gray-700 rounded-lg">
            <p className="text-gray-400 text-sm font-medium">Avg Tokens</p>
            <p className="text-3xl font-bold text-blue-400 mt-2">
              {metrics.averageTokensPerGeneration.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-2">per generation</p>
          </div>
        )}

        {/* Avg Duration */}
        {metrics.averageDuration !== undefined && (
          <div className="p-4 bg-[#0f0f13] border border-gray-700 rounded-lg">
            <p className="text-gray-400 text-sm font-medium">Avg Duration</p>
            <p className="text-3xl font-bold text-purple-400 mt-2">
              {(metrics.averageDuration / 1000).toFixed(1)}s
            </p>
            <p className="text-xs text-gray-500 mt-2">per generation</p>
          </div>
        )}
      </div>

      {/* Mode Distribution */}
      <div className="p-4 bg-[#0f0f13] border border-gray-700 rounded-lg">
        <p className="text-gray-400 text-sm font-medium mb-4">Mode Distribution</p>
        <div className="space-y-3">
          {Object.entries(metrics.modes).map(([mode, count]) => (
            <div key={mode} className="flex items-center justify-between">
              <span className="text-gray-300 capitalize">{mode}</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{
                      width: `${metrics.totalGenerations > 0 ? (count / metrics.totalGenerations) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="text-gray-400 text-sm">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
