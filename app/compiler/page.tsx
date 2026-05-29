'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GenerationForm } from '@/components/generation-form'
import { LoadingSpinner } from '@/components/loading-spinner'
import { Activity, ChevronRight, Sparkles, Target } from 'lucide-react'

interface CompileResult {
  success: boolean
  config?: any
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
  error?: string
}

export default function CompilerPage() {
  const [result, setResult] = useState<CompileResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [evaluationReport, setEvaluationReport] = useState<any>(null)
  const [evaluationLoading, setEvaluationLoading] = useState(false)

  const handleCompile = async (prompt: string) => {
    setLoading(true)
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
      setLoading(false)
    }
  }

  const handleEvaluate = async () => {
    setEvaluationLoading(true)
    try {
      const response = await fetch('/api/evaluate')
      const data = await response.json()
      setEvaluationReport(data.report)
    } catch (error) {
      console.error('Evaluation failed:', error)
    } finally {
      setEvaluationLoading(false)
    }
  }

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-8">
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
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
              <h2 className="text-xl font-semibold mb-2">New Compilation</h2>
              <p className="text-sm text-zinc-500 mb-6">Generate a structured blueprint from a single description.</p>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  handleCompile(formData.get('prompt') as string)
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    App Description
                  </label>
                  <textarea
                    name="prompt"
                    placeholder="E.g., Build a CRM with login, contacts, dashboard, and analytics..."
                    className="w-full h-24 px-3 py-2 bg-[#0f0f13] border border-gray-700 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                    disabled={loading}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
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
              </form>

              <div className="mt-6 pt-6 border-t border-gray-700">
                <Button
                  onClick={handleEvaluate}
                  disabled={evaluationLoading}
                  variant="outline"
                  className="w-full"
                >
                  {evaluationLoading ? 'Running Tests...' : 'Run Evaluation'}
                </Button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Run 20 test cases
                </p>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            {!result && !evaluationReport && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-12 text-center backdrop-blur-sm">
                <p className="text-gray-400">Enter a prompt to compile an application</p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {result.success ? (
                  <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.45)]"></div>
                      <h3 className="text-lg font-semibold">Compilation Successful</h3>
                    </div>

                    <Tabs defaultValue="validation" className="w-full">
                      <TabsList className="grid w-full grid-cols-6 bg-black/20 border border-white/10">
                        <TabsTrigger value="validation">Validation</TabsTrigger>
                        <TabsTrigger value="schema">Schema</TabsTrigger>
                        <TabsTrigger value="docs">Docs</TabsTrigger>
                        <TabsTrigger value="plan">Plan</TabsTrigger>
                        <TabsTrigger value="metrics">Metrics</TabsTrigger>
                        <TabsTrigger value="execution">Execution</TabsTrigger>
                      </TabsList>

                      <TabsContent value="validation" className="mt-4 space-y-4">
                        <div>
                          <p className="text-sm font-semibold mb-2">Status</p>
                          <div
                            className={`px-3 py-2 rounded text-sm ${
                              result.validation?.valid
                                ? 'bg-green-900/30 text-green-300'
                                : 'bg-red-900/30 text-red-300'
                            }`}
                          >
                            {result.validation?.valid ? 'VALID' : 'INVALID'}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-semibold mb-2">
                            Score: {result.validation?.score}/100
                          </p>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${(result.validation?.score || 0) / 100 * 100}%`,
                              }}
                            ></div>
                          </div>
                        </div>

                        {result.validation?.errors.length! > 0 && (
                          <div>
                            <p className="text-sm font-semibold mb-2 text-red-400">Errors</p>
                            <div className="space-y-1">
                              {result.validation?.errors.map((err, i) => (
                                <p key={i} className="text-xs text-red-300">
                                  • {err}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        {result.validation?.warnings.length! > 0 && (
                          <div>
                            <p className="text-sm font-semibold mb-2 text-yellow-400">Warnings</p>
                            <div className="space-y-1">
                              {result.validation?.warnings.map((warn, i) => (
                                <p key={i} className="text-xs text-yellow-300">
                                  • {warn}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      {result.downloadUrl && (
                        <div className="mt-4 flex gap-2">
                          <a
                            href={result.downloadUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded px-3 py-2 bg-sky-600 hover:bg-sky-700 text-sm"
                          >
                            Download Generated Files
                          </a>
                        </div>
                      )}

                      <TabsContent value="schema" className="mt-4">
                        <pre className="bg-[#0b0d12] p-4 rounded-2xl text-xs overflow-auto max-h-64 text-gray-300 border border-white/10">
                          {JSON.stringify(result.config, null, 2)}
                        </pre>
                      </TabsContent>

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

                      <TabsContent value="plan" className="mt-4 space-y-4">
                        {result.implementationPlan ? (
                          <div className="space-y-4">
                            <div className="rounded-2xl border border-white/10 bg-[#0b0d12] p-4">
                              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500 mb-2">Summary</p>
                              <p className="text-sm text-zinc-300">{result.implementationPlan.summary}</p>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-[#0b0d12] p-4">
                              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500 mb-2">Prisma Schema</p>
                              <pre className="text-xs text-zinc-300 overflow-auto max-h-56 whitespace-pre-wrap">{result.implementationPlan.prismaSchema}</pre>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="rounded-2xl border border-white/10 bg-[#0b0d12] p-4">
                                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500 mb-2">API Handlers</p>
                                <ul className="space-y-2 text-sm text-zinc-300">
                                    {result.implementationPlan.apiHandlers.map((item, index) => (
                                      <li key={`${item.path}-${index}`} className="rounded-lg border border-white/5 px-3 py-2">
                                      {item.path}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div className="rounded-2xl border border-white/10 bg-[#0b0d12] p-4">
                                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500 mb-2">UI Pages</p>
                                <ul className="space-y-2 text-sm text-zinc-300">
                                    {result.implementationPlan.uiPages.map((item, index) => (
                                      <li key={`${item.path}-${index}`} className="rounded-lg border border-white/5 px-3 py-2">
                                      {item.path}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-[#0b0d12] p-4">
                              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500 mb-2">Checklist</p>
                              <ul className="space-y-2 text-sm text-zinc-300">
                                {result.implementationPlan.checklist.map((item, index) => (
                                  <li key={`${item}-${index}`} className="flex gap-2">
                                    <span className="text-sky-300">•</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-zinc-400">No implementation plan was generated for this run.</p>
                        )}
                      </TabsContent>

                      <TabsContent value="metrics" className="mt-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-[#0f0f13] p-3 rounded">
                            <p className="text-xs text-gray-400 mb-1">Total Latency</p>
                            <p className="text-lg font-semibold">
                              {result.metrics?.latency}ms
                            </p>
                          </div>

                          {result.metrics?.stageTimes &&
                            Object.entries(result.metrics.stageTimes).map(([stage, time]) => (
                              <div key={stage} className="bg-[#0f0f13] p-3 rounded">
                                <p className="text-xs text-gray-400 mb-1 capitalize">
                                  {stage.replace('-', ' ')}
                                </p>
                                <p className="text-lg font-semibold">{time}ms</p>
                              </div>
                            ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="execution" className="mt-4 space-y-3">
                        <div>
                          <p className="text-sm font-semibold mb-2">Executable</p>
                          <div
                            className={`px-3 py-2 rounded text-sm ${
                              result.execution?.executable
                                ? 'bg-green-900/30 text-green-300'
                                : 'bg-red-900/30 text-red-300'
                            }`}
                          >
                            {result.execution?.executable ? 'YES' : 'NO'}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-semibold mb-2">Ready for Deployment</p>
                          <div
                            className={`px-3 py-2 rounded text-sm ${
                              result.execution?.readyForDeployment
                                ? 'bg-green-900/30 text-green-300'
                                : 'bg-yellow-900/30 text-yellow-300'
                            }`}
                          >
                            {result.execution?.readyForDeployment ? 'YES' : 'NEEDS REVIEW'}
                          </div>
                        </div>

                        {result.execution?.issues.length! > 0 && (
                          <div>
                            <p className="text-sm font-semibold mb-2 text-red-400">Issues</p>
                            <div className="space-y-1">
                              {result.execution?.issues.map((issue, i) => (
                                <p key={i} className="text-xs text-red-300">
                                  • {issue}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                ) : (
                  <div className="bg-[#1a1a1f] border border-red-900 rounded-lg p-6">
                    <p className="text-red-400 font-semibold mb-2">Compilation Failed</p>
                    <p className="text-red-300 text-sm">{result.error}</p>
                  </div>
                )}
              </div>
            )}

            {evaluationReport && (
              <div className="bg-[#1a1a1f] border border-blue-900 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-6">Evaluation Results</h3>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-[#0f0f13] p-4 rounded">
                    <p className="text-xs text-gray-400 mb-1">Success Rate</p>
                    <p className="text-2xl font-bold text-green-400">
                      {(
                        (evaluationReport.passed / evaluationReport.totalTests) *
                        100
                      ).toFixed(1)}
                      %
                    </p>
                  </div>
                  <div className="bg-[#0f0f13] p-4 rounded">
                    <p className="text-xs text-gray-400 mb-1">Avg Validation Score</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {evaluationReport.avgValidationScore.toFixed(1)}/100
                    </p>
                  </div>
                  <div className="bg-[#0f0f13] p-4 rounded">
                    <p className="text-xs text-gray-400 mb-1">Avg Latency</p>
                    <p className="text-2xl font-bold text-purple-400">
                      {evaluationReport.avgLatency.toFixed(0)}ms
                    </p>
                  </div>
                  <div className="bg-[#0f0f13] p-4 rounded">
                    <p className="text-xs text-gray-400 mb-1">Total Cost</p>
                    <p className="text-2xl font-bold text-orange-400">
                      ${evaluationReport.totalCost.toFixed(4)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold mb-3">Test Results</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {evaluationReport.results.map((result: any) => (
                      <div
                        key={result.testId}
                        className={`px-3 py-2 rounded text-sm ${
                          result.success
                            ? 'bg-green-900/20 text-green-300'
                            : 'bg-red-900/20 text-red-300'
                        }`}
                      >
                        <div className="flex justify-between">
                          <span>{result.testName}</span>
                          <span>Score: {result.validationScore}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

function HeroStat({
  title,
  value,
  icon,
}: {
  title: string
  value: string
  icon: React.ReactNode
}) {
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
