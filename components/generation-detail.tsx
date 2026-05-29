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

function toList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter(Boolean) : []
}

function buildFallbackInteraction(prompt: string, roles: string[], features: string[]) {
  const roleLabel = roles[0] || 'user'
  const featureLabel = features[0] || 'the app'
  const promptLabel = prompt.trim().length > 0 ? prompt.trim() : 'the requested app'

  return {
    title: 'User interaction flow',
    summary: `Guide the ${roleLabel} through ${featureLabel} using clear prompts, visible feedback, and exportable results for: ${promptLabel}.`,
    entryPoints: ['Dashboard', 'Generation history', 'Generated artifacts'],
    primaryActions: [
      'Enter a prompt and generate a build plan',
      'Review roles, routes, and components',
      'Export the generated config or download the artifact bundle',
    ],
    feedbackStates: [
      'Empty state when no generation is selected',
      'Loading state while the config is compiling',
      'Success state with visible export actions',
    ],
    successCriteria: [
      'The user always sees a next action.',
      'The generated output is readable without opening raw JSON.',
      'The flow communicates what happens after clicking Generate.',
    ],
  }
}

function getRoutes(config: any) {
  const routes = toList(config?.api?.routes)
  if (routes.length > 0) return routes

  const endpoints = toList(config?.api?.endpoints)
  if (endpoints.length > 0) {
    return endpoints.map((endpoint: any) => ({
      method: endpoint.method ?? 'GET',
      path: endpoint.path ?? '/api/unknown',
      description: endpoint.description ?? endpoint.purpose ?? 'Generated route',
    }))
  }

  return []
}

function getComponents(config: any) {
  const components = toList(config?.components)
  if (components.length > 0) return components

  const pages = toList(config?.ui?.pages)
  if (pages.length > 0) {
    return pages.map((page: any) => ({
      name: page.route ?? 'Page',
      description: Array.isArray(page.components) && page.components.length > 0
        ? page.components.join(', ')
        : page.dataSource ?? 'Generated page stub',
    }))
  }

  return []
}

export function GenerationDetail({ generationId }: GenerationDetailProps) {
  const [generation, setGeneration] = useState<Generation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const fetchGeneration = async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) {
        setLoading(true)
      }
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

  useEffect(() => {
    setGeneration(null)
    setError(null)
    setLoading(true)
    void fetchGeneration()
  }, [generationId])

  useEffect(() => {
    if (generation?.status !== 'pending') {
      return
    }

    const interval = setInterval(() => {
      void fetchGeneration({ silent: true })
    }, 2000)

    return () => clearInterval(interval)
  }, [generation?.status, generationId])

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
  const roles = toList(config?.intent?.userRoles ?? config?.accessControl?.roles)
  const features = toList(config?.intent?.primaryFeatures ?? config?.intent?.features)
  const routes = getRoutes(config)
  const components = getComponents(config)
  const interaction = config?.interaction ?? buildFallbackInteraction(generation.prompt, roles, features)

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
        <TabsList className="grid w-full grid-cols-6 bg-[#0f0f13] border border-gray-700">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="interaction">Interaction</TabsTrigger>
          <TabsTrigger value="raw">Raw JSON</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Features</h4>
            <ul className="space-y-2">
              {features.length > 0 ? features.map((feature: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2 text-gray-300 text-sm">
                  <span className="text-green-400 mt-1">•</span>
                  <span>{feature}</span>
                </li>
              )) : (
                <li className="text-sm text-gray-500">No feature list was returned, so the compiler inferred a minimal structure from the prompt.</li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">User Roles</h4>
            <div className="flex flex-wrap gap-2">
              {roles.length > 0 ? roles.map((role: string, idx: number) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-blue-900/20 border border-blue-700 rounded text-sm text-blue-300"
                >
                  {role}
                </span>
              )) : (
                <span className="text-sm text-gray-500">No explicit roles returned; defaulting to a standard user flow.</span>
              )}
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
              {routes.slice(0, 5).map((route: any, idx: number) => (
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
              {routes.length > 5 && (
                <p className="text-xs text-gray-600 text-center py-2">
                  +{routes.length - 5} more routes
                </p>
              )}
              {routes.length === 0 && (
                <p className="text-sm text-gray-500">No route list returned, so the compiler will fall back to the generated implementation plan.</p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="components" className="space-y-4">
          <div>
            <h4 className="font-semibold mb-3">React Components</h4>
            <div className="space-y-2">
              {components.slice(0, 5).map((component: any, idx: number) => (
                <div key={idx} className="p-3 bg-[#0f0f13] border border-gray-700 rounded-lg">
                  <p className="font-medium text-white">{component.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{component.description}</p>
                </div>
              ))}
              {components.length > 5 && (
                <p className="text-xs text-gray-600 text-center py-2">
                  +{components.length - 5} more components
                </p>
              )}
              {components.length === 0 && (
                <p className="text-sm text-gray-500">No component list returned, so page components are inferred from the generated UI pages.</p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="interaction" className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#0f0f13] p-4 space-y-4">
            <div>
              <h4 className="font-semibold text-white">{interaction.title}</h4>
              <p className="mt-2 text-sm leading-6 text-gray-300">{interaction.summary}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-gray-500 mb-2">Entry points</p>
              <div className="flex flex-wrap gap-2">
                {interaction.entryPoints.map((entry: string) => (
                  <span key={entry} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-zinc-200">
                    {entry}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-gray-500 mb-2">Primary actions</p>
              <ul className="space-y-2">
                {interaction.primaryActions.map((action: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="mt-1 text-sky-400">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-gray-500 mb-2">Feedback states</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {interaction.feedbackStates.map((state: string) => (
                  <div key={state} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-200">
                    {state}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-gray-500 mb-2">Success criteria</p>
              <ul className="space-y-2">
                {interaction.successCriteria.map((item: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="mt-1 text-emerald-400">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
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
