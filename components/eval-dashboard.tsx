'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  CartesianGrid,
  Cell,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  EvalHistoryChart,
  type EvalHistoryPoint,
} from '@/components/eval-history-chart'

type TestResult = {
  testId: string
  testName: string
  success: boolean
  latency: number
  validationScore: number
  retries: number
  category?: string
}

type EvaluationReport = {
  totalTests: number
  passed: number
  failed: number
  successRate: number
  avgLatency: number
  avgValidationScore: number
  executionRate: number
  averageRetries: number
  totalCost: number
  avgDbTables: number
  avgApiEndpoints: number
  avgUiPages: number
  results: TestResult[]
}

type EvalRunRecord = {
  id: string
  name: string
  description?: string | null
  createdAt: string
  results: {
    id: string
    promptCategory?: string | null
    success: boolean
    latencyMs?: number | null
    retryCount: number
    failureReason?: string | null
  }[]
}

const latencyChartConfig = {
  latency: {
    label: 'Latency (ms)',
    color: 'var(--color-secondary)',
  },
} satisfies ChartConfig

const REAL_PRODUCTS = [
  'crm-basic',
  'marketplace',
  'blog-platform',
  'project-tracker',
  'social-feed',
  'ecommerce-store',
  'analytics-dashboard',
  'saas-app',
  'health-tracker',
  'booking-system',
]

const EDGE_CASES = [
  'vague-prompt',
  'conflicting-requirements',
  'underspecified',
  'overly-complex',
  'ambiguous-roles',
  'technical-constraints',
  'circular-dependency',
  'missing-auth',
  'payment-missing-model',
  'realtime-scalability',
]

function formatLatency(ms: number): string {
  if (ms >= 60000) return `${(ms / 60000).toFixed(1)}m`
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`
  return `${ms}ms`
}

export function EvalDashboard() {
  const [report, setReport] = useState<EvaluationReport | null>(null)
  const [history, setHistory] = useState<EvalHistoryPoint[]>([])
  const [running, setRunning] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = useCallback(async () => {
    try {
      setLoadingHistory(true)
      const res = await fetch('/api/evaluate?action=history')
      const data = await res.json()
      if (data.success && Array.isArray(data.runs)) {
        const points: EvalHistoryPoint[] = data.runs.map(
          (run: EvalRunRecord) => {
            const passed = run.results.filter((r) => r.success).length
            const total = run.results.length || 1
            const avgLat =
              run.results.reduce((s, r) => s + (r.latencyMs || 0), 0) / total
            const date = new Date(run.createdAt)
            return {
              runId: run.id,
              label: date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
              successRate: (passed / total) * 100,
              avgLatency: avgLat,
              totalTests: total,
              passed,
              failed: total - passed,
              date: run.createdAt,
            }
          }
        )
        setHistory(points.reverse())
      }
    } catch {
      // silent
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const runEvaluation = async () => {
    setRunning(true)
    setError(null)
    try {
      const res = await fetch('/api/evaluate')
      const data = await res.json()
      if (!data.success) {
        setError(data.error || 'Evaluation failed')
        return
      }
      setReport(data.report)
      fetchHistory()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error')
    } finally {
      setRunning(false)
    }
  }

  const results = report?.results || []
  const latencyBuckets = buildLatencyBuckets(results)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-forge-50 m-0">
            Evaluation Dashboard
          </h1>
          <p className="text-sm text-forge-400 m-0 mt-1">
            20-case test suite &middot; 10 real products + 10 edge cases
          </p>
        </div>
        <button
          onClick={runEvaluation}
          disabled={running}
          className="h-10 px-5 bg-accent text-white border-none rounded-xl text-sm font-semibold cursor-pointer hover:bg-accent-hover transition-colors disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-forge-950"
        >
          {running ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Running...
            </span>
          ) : (
            'Run Evaluation'
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-danger/30 bg-danger-subtle text-danger text-sm">
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Success Rate',
            value: report
              ? `${report.successRate.toFixed(1)}%`
              : loadingHistory && history.length > 0
                ? '—'
                : '—',
            sub: report
              ? `${report.passed}/${report.totalTests} passed`
              : 'run evaluation',
            accent: true,
          },
          {
            label: 'Avg Latency',
            value: report ? formatLatency(report.avgLatency) : '—',
            sub: 'per test case',
          },
          {
            label: 'Execution Rate',
            value: report ? `${report.executionRate.toFixed(1)}%` : '—',
            sub: 'deployable configs',
          },
          {
            label: 'Total Cost',
            value: report ? `$${report.totalCost.toFixed(4)}` : '—',
            sub: `${report?.averageRetries.toFixed(2) || '—'} avg retries`,
          },
        ].map((c) => (
          <div
            key={c.label}
            className="p-5 rounded-xl border border-white/[0.06] bg-forge-800"
          >
            <p className="font-mono text-[10px] text-forge-400 uppercase tracking-[0.1em] m-0">
              {c.label}
            </p>
            <p
              className={`text-2xl font-bold m-0 mt-2 tracking-tight ${c.accent ? 'text-success' : 'text-forge-50'}`}
            >
              {c.value}
            </p>
            <p className="text-[11px] text-forge-400 m-0 mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Success rate over time */}
      <div className="bg-forge-800 border border-white/[0.06] rounded-xl p-5">
        <p className="font-mono text-[10px] text-forge-400 uppercase tracking-[0.1em] m-0 mb-4">
          Success Rate Over Time
        </p>
        {loadingHistory ? (
          <div className="h-[240px] skeleton" />
        ) : (
          <EvalHistoryChart data={history} />
        )}
      </div>

      {/* Latency distribution */}
      {results.length > 0 && (
        <div className="bg-forge-800 border border-white/[0.06] rounded-xl p-5">
          <p className="font-mono text-[10px] text-forge-400 uppercase tracking-[0.1em] m-0 mb-4">
            Latency Distribution
          </p>
          <ChartContainer
            config={latencyChartConfig}
            className="h-[180px] w-full"
          >
            <BarChart
              data={latencyBuckets}
              margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                vertical={false}
                stroke="rgba(255,255,255,0.04)"
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{
                  fill: 'var(--color-forge-400)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => [String(value), 'Tests']}
                  />
                }
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {latencyBuckets.map((_, i) => (
                  <Cell
                    key={i}
                    fill={
                      i < 2
                        ? 'var(--color-success)'
                        : i < 4
                          ? 'var(--color-warning)'
                          : 'var(--color-danger)'
                    }
                    fillOpacity={0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>
      )}

      {/* Test results table */}
      {results.length > 0 && (
        <div className="bg-forge-800 border border-white/[0.06] rounded-xl p-5">
          <p className="font-mono text-[10px] text-forge-400 uppercase tracking-[0.1em] m-0 mb-4">
            Test Results ({results.length} cases)
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-2 pr-3 font-mono text-[10px] text-forge-400 uppercase tracking-[0.1em] font-normal">
                    Test Case
                  </th>
                  <th className="text-left py-2 pr-3 font-mono text-[10px] text-forge-400 uppercase tracking-[0.1em] font-normal">
                    Category
                  </th>
                  <th className="text-center py-2 pr-3 font-mono text-[10px] text-forge-400 uppercase tracking-[0.1em] font-normal">
                    Status
                  </th>
                  <th className="text-right py-2 pr-3 font-mono text-[10px] text-forge-400 uppercase tracking-[0.1em] font-normal">
                    Latency
                  </th>
                  <th className="text-right py-2 font-mono text-[10px] text-forge-400 uppercase tracking-[0.1em] font-normal">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => {
                  const isReal = REAL_PRODUCTS.includes(r.testId)
                  return (
                    <tr
                      key={r.testId}
                      className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-2.5 pr-3">
                        <span className="text-forge-200 font-mono text-xs">
                          {r.testName}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3">
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                            isReal
                              ? 'bg-accent-subtle text-accent-hover'
                              : 'bg-warning-subtle text-warning'
                          }`}
                        >
                          {isReal ? 'real' : 'edge'}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-center">
                        {r.success ? (
                          <span className="inline-block w-2 h-2 rounded-full bg-success" />
                        ) : (
                          <span className="inline-block w-2 h-2 rounded-full bg-danger" />
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-right font-mono text-xs text-forge-300">
                        {formatLatency(r.latency)}
                      </td>
                      <td className="py-2.5 text-right font-mono text-xs text-forge-300">
                        {r.validationScore}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!report && !loadingHistory && history.length === 0 && (
        <div className="bg-forge-800 border border-white/[0.06] rounded-xl p-12 text-center">
          <p className="text-forge-300 m-0">
            No evaluations have been run yet.
          </p>
          <p className="text-forge-500 text-xs m-0 mt-2">
            Click &ldquo;Run Evaluation&rdquo; to execute the 20-case test
            suite.
          </p>
        </div>
      )}
    </div>
  )
}

function buildLatencyBuckets(
  results: TestResult[]
): { label: string; count: number }[] {
  if (results.length === 0) return []
  const buckets = [
    { label: '<10s', min: 0, max: 10000, count: 0 },
    { label: '10-20s', min: 10000, max: 20000, count: 0 },
    { label: '20-30s', min: 20000, max: 30000, count: 0 },
    { label: '30-40s', min: 30000, max: 40000, count: 0 },
    { label: '40-50s', min: 40000, max: 50000, count: 0 },
    { label: '>50s', min: 50000, max: Infinity, count: 0 },
  ]
  for (const r of results) {
    for (const b of buckets) {
      if (r.latency >= b.min && r.latency < b.max) {
        b.count++
        break
      }
    }
  }
  return buckets.map((b) => ({ label: b.label, count: b.count }))
}
