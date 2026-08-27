'use client'

import { useEffect, useState } from 'react'
import { GenerationStatus } from './GenerationStatus'

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
    primaryActions: ['Enter a prompt and generate a build plan', 'Review roles, routes, and components', 'Export the generated config or download the artifact bundle'],
    feedbackStates: ['Empty state when no generation is selected', 'Loading state while the config is compiling', 'Success state with visible export actions'],
    successCriteria: ['The user always sees a next action.', 'The generated output is readable without opening raw JSON.', 'The flow communicates what happens after clicking Generate.'],
  }
}

function getRoutes(config: any) {
  const routes = toList(config?.api?.routes)
  if (routes.length > 0) return routes
  const endpoints = toList(config?.api?.endpoints)
  if (endpoints.length > 0) {
    return endpoints.map((e: any) => ({ method: e.method ?? 'GET', path: e.path ?? '/api/unknown', description: e.description ?? e.purpose ?? 'Generated route' }))
  }
  return []
}

function getComponents(config: any) {
  const components = toList(config?.components)
  if (components.length > 0) return components
  const pages = toList(config?.ui?.pages)
  if (pages.length > 0) {
    return pages.map((p: any) => ({
      name: p.route ?? 'Page',
      description: Array.isArray(p.components) && p.components.length > 0 ? p.components.join(', ') : p.dataSource ?? 'Generated page stub',
    }))
  }
  return []
}

const DETAIL_TABS = ['Overview', 'Database', 'API', 'Components', 'Raw'] as const
type DetailTab = typeof DETAIL_TABS[number]

export function GenerationDetail({ generationId }: GenerationDetailProps) {
  const [generation, setGeneration] = useState<Generation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<DetailTab>('Overview')
  const [retryKey, setRetryKey] = useState(0)

  const fetchGeneration = async (opts?: { silent?: boolean }) => {
    try {
      if (!opts?.silent) setLoading(true)
      const response = await fetch(`/api/generations/${generationId}`)
      if (!response.ok) throw new Error('Failed to fetch generation')
      setGeneration(await response.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { setGeneration(null); setError(null); setLoading(true); void fetchGeneration() }, [generationId, retryKey])
  useEffect(() => {
    if (generation?.status !== 'pending') return
    const interval = setInterval(() => void fetchGeneration({ silent: true }), 2000)
    return () => clearInterval(interval)
  }, [generation?.status, generationId])

  if (loading) return <div className="flex justify-center py-12"><div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
  if (error) return <div className="p-4 rounded-lg border border-danger/20 bg-danger-subtle text-sm text-danger">{error}</div>
  if (!generation) return <div className="p-4 rounded-lg border border-white/[0.06] bg-forge-800 text-sm text-forge-400">Not found</div>
  if (generation.status === 'pending' || generation.status === 'failed') {
    return (
      <GenerationStatus
        status={generation.status}
        errorMessage={generation.errorMessage}
        onRetry={() => setRetryKey((k) => k + 1)}
      />
    )
  }

  const config = generation.config
  const roles = toList(config?.intent?.userRoles)
  const features = toList(config?.intent?.primaryFeatures)
  const routes = getRoutes(config)
  const components = getComponents(config)

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-forge-50 truncate">{config?.metadata?.name || 'Generation'}</h3>
          <p className="text-xs text-forge-400 mt-1 line-clamp-1">{config?.metadata?.description}</p>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-success-subtle text-success flex-shrink-0">compiled</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/[0.06] gap-1 overflow-x-auto">
        {DETAIL_TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-xs font-mono whitespace-nowrap border-b-2 -mb-px transition-colors bg-transparent cursor-pointer
              ${activeTab === tab ? 'border-accent text-forge-50' : 'border-transparent text-forge-400 hover:text-forge-300'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'Overview' && (
        <div className="space-y-4">
          {features.length > 0 && (
            <div>
              <p className="text-xs font-mono text-forge-400 uppercase tracking-wider mb-2">Features</p>
              <div className="space-y-1">
                {features.map((f: string, i: number) => (
                  <p key={i} className="text-xs text-forge-300 font-mono">· {f}</p>
                ))}
              </div>
            </div>
          )}
          {roles.length > 0 && (
            <div>
              <p className="text-xs font-mono text-forge-400 uppercase tracking-wider mb-2">Roles</p>
              <div className="flex flex-wrap gap-2">
                {roles.map((r: string, i: number) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-accent-subtle text-accent-hover">{r}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Database' && (
        <div className="space-y-2">
          {config?.database?.tables?.map((table: any, i: number) => (
            <div key={i} className="p-3 rounded-lg border border-white/[0.06] bg-forge-800">
              <p className="text-xs font-mono font-medium text-forge-50">{table.name}</p>
              {table.columns && (
                <div className="mt-2 space-y-0.5">
                  {table.columns.slice(0, 4).map((col: any, ci: number) => (
                    <p key={ci} className="text-[10px] font-mono text-forge-400">· {col.name}: {col.type}</p>
                  ))}
                  {table.columns.length > 4 && <p className="text-[10px] font-mono text-forge-400">+{table.columns.length - 4} more</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'API' && (
        <div className="space-y-2">
          {routes.slice(0, 8).map((route: any, i: number) => (
            <div key={i} className="p-3 rounded-lg border border-white/[0.06] bg-forge-800">
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-accent-subtle text-accent-hover">{route.method}</span>
                <p className="text-xs font-mono text-forge-300">{route.path}</p>
              </div>
            </div>
          ))}
          {routes.length > 8 && <p className="text-center text-[10px] font-mono text-forge-400">+{routes.length - 8} more</p>}
        </div>
      )}

      {activeTab === 'Components' && (
        <div className="space-y-2">
          {components.slice(0, 8).map((comp: any, i: number) => (
            <div key={i} className="p-3 rounded-lg border border-white/[0.06] bg-forge-800">
              <p className="text-xs font-mono font-medium text-forge-50">{comp.name}</p>
              <p className="text-[10px] text-forge-400 mt-0.5">{comp.description}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'Raw' && (
        <pre className="p-4 rounded-lg border border-white/[0.06] bg-forge-800 text-xs font-mono text-forge-300 overflow-auto max-h-[400px] leading-relaxed">
          {JSON.stringify(config, null, 2)}
        </pre>
      )}
    </div>
  )
}
