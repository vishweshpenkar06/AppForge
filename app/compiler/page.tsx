'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingSpinner } from '@/components/loading-spinner'
import { Activity, ChevronRight, Sparkles, Target, Copy, Check } from 'lucide-react'

interface CompileResult {
  success: boolean
  config?: any
  runtime?: {
    sql: string
    express: string
    react: Record<string, string>
  }
  docs?: {
    prd: string
    trd: string
    appFlow: string
    uiUxBrief: string
    backendSchema: string
    implementationPlan: string
  }
  implementationPlan?: {
    summary: string
    prismaSchema: string
    apiHandlers: { path: string; content: string }[]
    uiPages: { path: string; content: string }[]
    rbac: Record<string, string[]>
    checklist: string[]
  }
  validation?: {
    valid: boolean
    errors: string[]
    warnings: string[]
    repairs?: string[]
    score: number
  }
  execution?: {
    executable: boolean
    issues: string[]
    readyForDeployment: boolean
  }
  metrics?: {
    latency: number
    stageTimes: Record<string, number>
  }
  assumptions?: string[]
  error?: string
}

const STAGES = ['Intent', 'Design', 'Schemas', 'Refinement', 'Validation', 'Export']

const EXAMPLE_PROMPTS = [
  'CRM with contacts, deals, and admin analytics',
  'LMS with courses, quizzes, and student progress',
  'Food delivery app with restaurants, orders, and tracking',
  'SaaS invoicing tool with clients and payment tracking',
]

export default function CompilerPage() {
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState<CompileResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentStage, setCurrentStage] = useState(-1)
  const [copied, setCopied] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleCompile = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setResult(null)
    setCurrentStage(0)

    // Simulate stage progress (real stages happen server-side)
    const stageInterval = setInterval(() => {
      setCurrentStage(prev => {
        if (prev >= 5) {
          clearInterval(stageInterval)
          return prev
        }
        return prev + 1
      })
    }, 2000)

    try {
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, mode: 'balanced' }),
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Compilation failed',
      })
    } finally {
      clearInterval(stageInterval)
      setLoading(false)
      setCurrentStage(-1)
    }
  }

  const handleCopy = () => {
    if (!result?.config) return
    navigator.clipboard.writeText(JSON.stringify(result.config, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const assumptions = result?.config?.intent?.assumptions
    || result?.config?.intent?.assumptions_made
    || result?.assumptions
    || []

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-8">
        {/* Hero */}
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 sm:p-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-sky-200">
                <Sparkles className="h-3.5 w-3.5" />
                AppForge Compiler
              </div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                Multi-stage generation with validation built in.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
                Enter a product idea, compile it into structured artifacts, and inspect the result across validation, schema, metrics, and execution layers.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <HeroStat title="Validate" value="Schema + rules" icon={<Target className="h-4 w-4" />} />
              <HeroStat title="Inspect" value="Live JSON + metrics" icon={<Activity className="h-4 w-4" />} />
              <HeroStat title="Ship" value="Export-ready output" icon={<ChevronRight className="h-4 w-4" />} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-1">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm sticky top-8">
              <h2 className="text-xl font-semibold mb-2">New Compilation</h2>
              <p className="text-sm text-zinc-500 mb-6">Generate a structured blueprint from a single description.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">App Description</label>
                  <textarea
                    ref={textareaRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="E.g., Build a CRM with login, contacts, dashboard, and analytics..."
                    className="w-full h-28 px-3 py-2 bg-[#0f0f13] border border-gray-700 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                    disabled={loading}
                  />
                </div>

                {/* Example prompts */}
                <div>
                  <p className="text-xs text-zinc-500 mb-2">Try an example:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {EXAMPLE_PROMPTS.map(example => (
                      <button
                        key={example}
                        onClick={() => {
                          setPrompt(example)
                          textareaRef.current?.focus()
                        }}
                        className="text-[11px] px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-zinc-400 hover:text-white transition-colors"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleCompile}
                  disabled={loading || !prompt.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner /> Compiling...
                    </>
                  ) : (
                    'Compile'
                  )}
                </Button>
              </div>

              {/* Stage progress */}
              {loading && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xs text-zinc-500 mb-2">Pipeline progress:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {STAGES.map((stage, i) => (
                      <div
                        key={stage}
                        className={`text-[11px] px-2 py-0.5 rounded-full border ${
                          currentStage > i
                            ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                            : currentStage === i
                            ? 'bg-blue-500/20 border-blue-500/30 text-blue-300 animate-pulse'
                            : 'bg-white/5 border-white/10 text-zinc-600'
                        }`}
                      >
                        {currentStage > i ? '✓' : currentStage === i ? '⟳' : '○'} {stage}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assumptions banner */}
              {assumptions.length > 0 && !loading && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3">
                    <p className="text-xs font-medium text-yellow-300 mb-1">Assumptions made:</p>
                    <ul className="text-xs text-yellow-200/80 list-disc ml-3 space-y-0.5">
                      {assumptions.map((a: string, i: number) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            {!result && !loading && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-12 text-center backdrop-blur-sm">
                <p className="text-gray-400">Enter a prompt to compile an application</p>
              </div>
            )}

            {loading && !result && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-12 text-center backdrop-blur-sm">
                <LoadingSpinner />
                <p className="text-zinc-400 mt-4">Compiling through 6 pipeline stages...</p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {result.success ? (
                  <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.45)]"></div>
                      <h3 className="text-lg font-semibold">Compilation Successful</h3>
                      {result.metrics?.latency && (
                        <span className="text-xs text-zinc-400 ml-auto">{result.metrics.latency}ms</span>
                      )}
                    </div>

                    <Tabs defaultValue="config" className="w-full">
                      <TabsList className="grid w-full grid-cols-7 bg-black/20 border border-white/10">
                        <TabsTrigger value="config">Config</TabsTrigger>
                        <TabsTrigger value="sql">SQL</TabsTrigger>
                        <TabsTrigger value="express">Express</TabsTrigger>
                        <TabsTrigger value="react">React</TabsTrigger>
                        <TabsTrigger value="validation">Validation</TabsTrigger>
                        <TabsTrigger value="docs">Docs</TabsTrigger>
                        <TabsTrigger value="metrics">Metrics</TabsTrigger>
                      </TabsList>

                      {/* Tab 1: Config */}
                      <TabsContent value="config" className="mt-4">
                        <div className="relative">
                          <button
                            onClick={handleCopy}
                            className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-xs text-zinc-300 transition-colors"
                          >
                            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            {copied ? 'Copied' : 'Copy JSON'}
                          </button>
                          <pre className="bg-[#0b0d12] p-4 rounded-2xl text-xs overflow-auto max-h-[500px] text-gray-300 border border-white/10">
                            {JSON.stringify(result.config, null, 2)}
                          </pre>
                        </div>
                      </TabsContent>

                      {/* Tab 2: SQL */}
                      <TabsContent value="sql" className="mt-4">
                        <div className="rounded-2xl border border-white/10 bg-[#0b0d12] p-4">
                          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500 mb-3">Generated SQL Schema</p>
                          <pre className="text-xs text-emerald-300/90 overflow-auto max-h-[500px] whitespace-pre-wrap font-mono">
                            {result.runtime?.sql || '-- No SQL generated'}
                          </pre>
                        </div>
                      </TabsContent>

                      {/* Tab 3: Express */}
                      <TabsContent value="express" className="mt-4">
                        <div className="rounded-2xl border border-white/10 bg-[#0b0d12] p-4">
                          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500 mb-3">Generated Express Server</p>
                          <pre className="text-xs text-amber-300/90 overflow-auto max-h-[500px] whitespace-pre-wrap font-mono">
                            {result.runtime?.express || '// No Express server generated'}
                          </pre>
                        </div>
                      </TabsContent>

                      {/* Tab 4: React */}
                      <TabsContent value="react" className="mt-4 space-y-3">
                        {result.runtime?.react && Object.keys(result.runtime.react).length > 0 ? (
                          Object.entries(result.runtime.react).map(([path, content]) => (
                            <div key={path} className="rounded-2xl border border-white/10 bg-[#0b0d12] p-4">
                              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500 mb-2">{path}</p>
                              <pre className="text-xs text-sky-300/90 overflow-auto max-h-48 whitespace-pre-wrap font-mono">
                                {content}
                              </pre>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-zinc-400">No React files generated.</p>
                        )}
                      </TabsContent>

                      {/* Tab 5: Validation */}
                      <TabsContent value="validation" className="mt-4 space-y-4">
                        <div>
                          <p className="text-sm font-semibold mb-2">Status</p>
                          <div className={`px-3 py-2 rounded text-sm ${
                            result.validation?.valid
                              ? 'bg-green-900/30 text-green-300'
                              : 'bg-red-900/30 text-red-300'
                          }`}>
                            {result.validation?.valid ? 'VALID' : 'INVALID'}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-semibold mb-2">Score: {result.validation?.score}/100</p>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${result.validation?.score || 0}%` }} />
                          </div>
                        </div>
                        {result.validation?.repairs && result.validation.repairs.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold mb-2 text-emerald-400">Repairs Made</p>
                            <div className="space-y-1">
                              {result.validation.repairs.map((r: string, i: number) => (
                                <p key={i} className="text-xs text-emerald-300">✓ {r}</p>
                              ))}
                            </div>
                          </div>
                        )}
                        {result.validation?.errors && result.validation.errors.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold mb-2 text-red-400">Errors</p>
                            <div className="space-y-1">
                              {result.validation.errors.map((err, i) => (
                                <p key={i} className="text-xs text-red-300">• {err}</p>
                              ))}
                            </div>
                          </div>
                        )}
                        {result.validation?.warnings && result.validation.warnings.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold mb-2 text-yellow-400">Warnings</p>
                            <div className="space-y-1">
                              {result.validation.warnings.map((warn, i) => (
                                <p key={i} className="text-xs text-yellow-300">• {warn}</p>
                              ))}
                            </div>
                          </div>
                        )}
                        {result.execution && (
                          <div className="grid grid-cols-2 gap-3">
                            <div className={`px-3 py-2 rounded text-sm ${result.execution.executable ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}>
                              Executable: {result.execution.executable ? 'YES' : 'NO'}
                            </div>
                            <div className={`px-3 py-2 rounded text-sm ${result.execution.readyForDeployment ? 'bg-green-900/30 text-green-300' : 'bg-yellow-900/30 text-yellow-300'}`}>
                              Deploy Ready: {result.execution.readyForDeployment ? 'YES' : 'NEEDS REVIEW'}
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      {/* Tab 6: Docs */}
                      <TabsContent value="docs" className="mt-4 space-y-4">
                        {result.docs ? (
                          <div className="grid gap-3 md:grid-cols-2">
                            <DocCard title="PRD" content={result.docs.prd} />
                            <DocCard title="TRD" content={result.docs.trd} />
                            <DocCard title="App Flow" content={result.docs.appFlow} />
                            <DocCard title="UI/UX Brief" content={result.docs.uiUxBrief} />
                            <DocCard title="Backend Schema" content={result.docs.backendSchema} />
                            <DocCard title="Implementation Plan" content={result.docs.implementationPlan} />
                          </div>
                        ) : (
                          <p className="text-sm text-zinc-400">No docs were generated for this run.</p>
                        )}
                      </TabsContent>

                      {/* Tab 7: Metrics */}
                      <TabsContent value="metrics" className="mt-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-[#0f0f13] p-3 rounded">
                            <p className="text-xs text-gray-400 mb-1">Total Latency</p>
                            <p className="text-lg font-semibold">{result.metrics?.latency}ms</p>
                          </div>
                          {result.metrics?.stageTimes && Object.entries(result.metrics.stageTimes).map(([stage, time]) => (
                            <div key={stage} className="bg-[#0f0f13] p-3 rounded">
                              <p className="text-xs text-gray-400 mb-1 capitalize">{stage.replace(/-/g, ' ')}</p>
                              <p className="text-lg font-semibold">{time}ms</p>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 backdrop-blur-sm">
                    <p className="text-red-400 font-semibold mb-2">Compilation Failed</p>
                    <p className="text-red-300 text-sm">{result.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

function HeroStat({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 min-w-[120px]">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-zinc-500">
        {icon}
        {title}
      </div>
      <div className="mt-2 text-sm font-medium text-white">{value}</div>
    </div>
  )
}

function DocCard({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b0d12] p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">{title}</p>
      </div>
      <pre className="max-h-60 overflow-auto whitespace-pre-wrap text-xs leading-6 text-zinc-300">{content}</pre>
    </div>
  )
}
