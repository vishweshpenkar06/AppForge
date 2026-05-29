'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface GenerationDetailProps {
  generationId: string
}

interface Generation {
  id: string
  prompt: string
  status: string
  config: any
  errorMessage?: string
  metadata?: any
}

export function GenerationDetail({ generationId }: GenerationDetailProps) {
  const [generation, setGeneration] = useState<Generation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const fetchGeneration = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/generations/${generationId}`)
        if (!response.ok) throw new Error('Failed to fetch generation')
        const data = await response.json()
        setGeneration(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load generation')
      } finally {
        setLoading(false)
      }
    }

    fetchGeneration()

    // Poll if still pending
    const interval = setInterval(() => {
      fetchGeneration()
    }, 2000)

    return () => clearInterval(interval)
  }, [generationId])

  const handleExport = async (format: 'json' | 'yaml') => {
    try {
      setExporting(true)
      const response = await fetch(
        `/api/generations/${generationId}/export?format=${format}`
      )
      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `appforge-config.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export error:', err)
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg text-red-200">
        {error}
      </div>
    )
  }

  if (!generation) {
    return (
      <div className="p-4 bg-gray-900/20 border border-gray-700 rounded-lg text-gray-300">
        Generation not found
      </div>
    )
  }

  if (generation.status === 'pending') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Spinner className="w-5 h-5" />
          <p className="text-gray-300">Compiling your application...</p>
        </div>
        <p className="text-sm text-gray-500">
          This may take a few moments depending on complexity and selected mode.
        </p>
      </div>
    )
  }

  if (generation.status === 'failed') {
    return (
      <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
        <p className="font-semibold text-red-200 mb-2">Compilation Failed</p>
        <p className="text-red-300 text-sm">{generation.errorMessage}</p>
      </div>
    )
  }

  const isCompleted = ['completed', 'success'].includes(generation.status)
  const config = generation.config

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-2">{config?.metadata?.name}</h3>
          <p className="text-gray-400 text-sm">{config?.metadata?.description}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="px-3 py-1 bg-emerald-500/15 text-emerald-300 rounded-lg text-sm font-medium">
            {isCompleted ? 'Compiled' : generation.status}
          </span>
          {isCompleted && (
            <div className="flex gap-2">
              <Button
                onClick={() => handleExport('json')}
                disabled={exporting}
                variant="outline"
                className="text-xs"
              >
                Export JSON
              </Button>
              <Button
                onClick={() => handleExport('yaml')}
                disabled={exporting}
                variant="outline"
                className="text-xs"
              >
                Export YAML
              </Button>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-[#0f0f13] border border-gray-700">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="raw">Raw JSON</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Features</h4>
            <ul className="space-y-2">
              {config?.intent?.features?.map((feature: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2 text-gray-300 text-sm">
                  <span className="text-green-400 mt-1">•</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">User Roles</h4>
            <div className="flex flex-wrap gap-2">
              {config?.intent?.userRoles?.map((role: string, idx: number) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-blue-900/20 border border-blue-700 rounded text-sm text-blue-300"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <div>
            <h4 className="font-semibold mb-3">Database Tables</h4>
            <div className="space-y-3">
              {config?.database?.tables?.map((table: any, idx: number) => (
                <div key={idx} className="p-3 bg-[#0f0f13] border border-gray-700 rounded-lg">
                  <p className="font-medium text-white">{table.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{table.purpose}</p>
                  {table.columns && (
                    <div className="mt-2 space-y-1">
                      {table.columns.slice(0, 3).map((col: any, cidx: number) => (
                        <p key={cidx} className="text-xs text-gray-500">
                          • {col.name}: {col.type}
                        </p>
                      ))}
                      {table.columns.length > 3 && (
                        <p className="text-xs text-gray-600">
                          +{table.columns.length - 3} more columns
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <div>
            <h4 className="font-semibold mb-3">API Routes</h4>
            <div className="space-y-2">
              {config?.api?.routes?.slice(0, 5).map((route: any, idx: number) => (
                <div key={idx} className="p-3 bg-[#0f0f13] border border-gray-700 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-purple-900/30 text-purple-300 text-xs font-mono rounded">
                      {route.method}
                    </span>
                    <p className="font-mono text-sm text-gray-300">{route.path}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{route.description}</p>
                </div>
              ))}
              {config?.api?.routes?.length > 5 && (
                <p className="text-xs text-gray-600 text-center py-2">
                  +{config.api.routes.length - 5} more routes
                </p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="components" className="space-y-4">
          <div>
            <h4 className="font-semibold mb-3">React Components</h4>
            <div className="space-y-2">
              {config?.components?.slice(0, 5).map((component: any, idx: number) => (
                <div key={idx} className="p-3 bg-[#0f0f13] border border-gray-700 rounded-lg">
                  <p className="font-medium text-white">{component.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{component.description}</p>
                </div>
              ))}
              {config?.components?.length > 5 && (
                <p className="text-xs text-gray-600 text-center py-2">
                  +{config.components.length - 5} more components
                </p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="raw" className="space-y-4">
          <div className="p-4 bg-[#0f0f13] border border-gray-700 rounded-lg overflow-x-auto max-h-[500px] overflow-y-auto">
            <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap break-words">
              {JSON.stringify(config, null, 2)}
            </pre>
          </div>
          <Button
            onClick={() => {
              const text = JSON.stringify(config, null, 2)
              navigator.clipboard.writeText(text)
            }}
            variant="outline"
            className="w-full"
          >
            Copy JSON
          </Button>
        </TabsContent>
      </Tabs>

      {generation.metadata?.stages && (
        <div>
          <h4 className="font-semibold mb-3">Pipeline Execution</h4>
          <div className="space-y-2 text-sm">
            {generation.metadata.stages.map((stage: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-[#0f0f13] rounded">
                <span className="text-gray-300">{stage.stage}</span>
                <span className="text-xs text-gray-500">
                  {stage.success ? '✓' : '✗'} {stage.latencyMs}ms
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Total: {generation.metadata.totalLatencyMs}ms • {generation.metadata.totalTokens} tokens
          </p>
        </div>
      )}
    </div>
  )
}
