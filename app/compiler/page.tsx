'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GenerationForm } from '@/components/generation-form'
import { LoadingSpinner } from '@/components/loading-spinner'

interface CompileResult {
  success: boolean
  config?: any
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
    <main className="min-h-screen bg-[#09090b] text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">AppForge Compiler</h1>
          <p className="text-gray-400">
            Multi-stage, validated app config generation system
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-1">
            <div className="bg-[#1a1a1f] border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-6">New Compilation</h2>

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
              <div className="bg-[#1a1a1f] border border-gray-800 rounded-lg p-12 text-center">
                <p className="text-gray-400">Enter a prompt to compile an application</p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {result.success ? (
                  <div className="bg-[#1a1a1f] border border-green-900 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <h3 className="text-lg font-semibold">Compilation Successful</h3>
                    </div>

                    <Tabs defaultValue="validation" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="validation">Validation</TabsTrigger>
                        <TabsTrigger value="schema">Schema</TabsTrigger>
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

                      <TabsContent value="schema" className="mt-4">
                        <pre className="bg-[#0f0f13] p-4 rounded text-xs overflow-auto max-h-64 text-gray-300">
                          {JSON.stringify(result.config, null, 2)}
                        </pre>
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
