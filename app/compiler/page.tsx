'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Copy,
  FileCode,
  Layers,
  Sparkles,
  Timer,
  X,
} from 'lucide-react'
import { UpgradeBanner } from '@/components/upgrade-banner'
import PipelineLiveView from '@/components/PipelineLiveView'
import { Counter } from '@/components/ui/motion'

interface CompileResult {
  success: boolean
  jobId?: string
  config?: any
  runtime?: { sql: string; express: string; react: Record<string, string> }
  docs?: { prd: string; trd: string; appFlow: string; uiUxBrief: string; backendSchema: string; implementationPlan: string }
  implementationPlan?: { summary: string; prismaSchema: string; apiHandlers: { path: string; content: string }[]; uiPages: { path: string; content: string }[]; rbac: Record<string, string[]>; checklist: string[] }
  validation?: { valid: boolean; errors: string[]; warnings: string[]; repairs?: string[]; score: number }
  execution?: { executable: boolean; issues: string[]; readyForDeployment: boolean }
  metrics?: { latency: number; stageTimes: Record<string, number> }
  assumptions?: string[]
  error?: string
}

const STAGES = ['Intent', 'Design', 'Schemas', 'Refinement', 'Validation', 'Export']
const TABS = ['Config', 'SQL', 'Express', 'React', 'Validation', 'Docs', 'Metrics'] as const
type Tab = (typeof TABS)[number]

const EXAMPLES = [
  { label: 'CRM with analytics', prompt: 'Build a CRM with contacts, companies, deals, activity tracking and a pipeline analytics dashboard' },
  { label: 'LMS platform', prompt: 'Build a learning management system with courses, lessons, enrollments, quizzes and instructor dashboards' },
  { label: 'Food delivery', prompt: 'Build a food delivery app with restaurants, menus, carts, orders and courier tracking' },
  { label: 'SaaS invoicing', prompt: 'Build a SaaS invoicing tool with customers, invoices, line items, payments and dunning' },
]

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setDone(true)
        toast.success('Copied to clipboard')
        setTimeout(() => setDone(false), 1800)
      }}
      className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1.5 rounded-lg border border-white/[0.08] bg-forge-800/70 text-forge-300 hover:text-forge-100 hover:border-white/[0.16] transition-colors cursor-pointer shrink-0"
    >
      {done ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
      {done ? 'Copied' : label}
    </button>
  )
}

function CodePanel({ title, content, tone = 'text-forge-300' }: { title: string; content: string; tone?: string }) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-forge-900/40 overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-white/[0.06] bg-forge-950/40">
        <span className="font-mono text-[10.5px] text-forge-400 uppercase tracking-[0.1em] truncate">{title}</span>
        <CopyButton text={content} />
      </header>
      <pre className={`m-0 p-4 md:p-5 text-[11.5px] overflow-auto max-h-[calc(100vh-260px)] font-mono leading-6 whitespace-pre-wrap ${tone}`}>
        {content}
      </pre>
    </section>
  )
}

export default function CompilerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-56px)] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-forge-400">Loading compiler…</p>
          </div>
        </div>
      }
    >
      <CompilerContent />
    </Suspense>
  )
}

function CompilerContent() {
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState<CompileResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentStage, setCurrentStage] = useState(-1)
  const [activeTab, setActiveTab] = useState<Tab>('Config')
  const [mode, setMode] = useState('fast')
  const [upgradeInfo, setUpgradeInfo] = useState<{ error: string; currentPlan: string } | null>(null)
  const [liveMode, setLiveMode] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [templateName, setTemplateName] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const templateId = searchParams.get('templateId')
    const promptParam = searchParams.get('prompt')
    if (templateId) {
      fetch(`/api/templates/${templateId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.sourceGeneration?.prompt) {
            setPrompt(data.sourceGeneration.prompt)
            setTemplateName(data.title)
          }
        })
        .catch(() => {})
    } else if (promptParam) {
      setPrompt(promptParam)
    }
  }, [searchParams])

  useEffect(() => {
    if (result?.success) resultRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [result])

  const handleLiveResult = useCallback((r: any) => {
    setStreaming(false)
    setLoading(false)
    setCurrentStage(-1)
    if (r.upgradeRequired) {
      setUpgradeInfo({ error: r.error, currentPlan: r.currentPlan })
      setResult(null)
    } else if (r.status === 'needs_clarification') {
      setResult({ success: false, error: `Prompt needs more detail: ${(r.detectedIssues || []).join('; ')}` })
    } else {
      setUpgradeInfo(null)
      setResult(r)
      toast.success('Compilation finished')
    }
  }, [])

  const handleLiveError = useCallback((msg: string) => {
    setStreaming(false)
    setLoading(false)
    setCurrentStage(-1)
    setResult({ success: false, error: msg })
    toast.error(msg)
  }, [])

  const stageStatus = STAGES.map((_, i) => {
    if (currentStage < 0) return 'pending'
    if (currentStage > i) return 'done'
    if (currentStage === i) return 'active'
    return 'pending'
  })

  const handleCompile = async (overridePrompt?: string) => {
    const compilePrompt = overridePrompt || prompt
    if (!compilePrompt.trim() || loading) return
    setLoading(true)
    setResult(null)
    setUpgradeInfo(null)

    if (liveMode) {
      setStreaming(true)
      setCurrentStage(0)
      return
    }

    setCurrentStage(0)
    const iv = setInterval(
      () =>
        setCurrentStage((p) => {
          if (p >= STAGES.length - 1) {
            clearInterval(iv)
            return p
          }
          return p + 1
        }),
      2000,
    )
    try {
      const r = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: compilePrompt, mode }),
      })
      const d = await r.json()
      if (d.upgradeRequired) {
        setUpgradeInfo({ error: d.error, currentPlan: d.currentPlan })
        setResult(null)
      } else if (d.status === 'needs_clarification') {
        setResult({ success: false, error: `Prompt needs more detail: ${(d.detectedIssues || []).join('; ')}` })
      } else {
        setUpgradeInfo(null)
        setResult(d)
        if (d.success) toast.success('Compilation finished')
        else toast.error(d.error || 'Compilation failed')
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Compilation failed'
      setResult({ success: false, error: msg })
      toast.error(msg)
    } finally {
      clearInterval(iv)
      setLoading(false)
      setCurrentStage(-1)
    }
  }

  const download = async (fmt: 'json' | 'yaml' | 'zip') => {
    if (!result?.jobId) return
    try {
      const r = await fetch(`/api/generations/${result.jobId}/export?format=${fmt}`)
      if (!r.ok) {
        const err = await r.json().catch(() => ({ error: 'Export failed' }))
        toast.error(err.error || `Export as ${fmt.toUpperCase()} requires a paid plan`)
        return
      }
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fmt === 'zip' ? 'appforge-bundle.zip' : `appforge-config.${fmt}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(`${fmt.toUpperCase()} downloaded`)
    } catch {
      toast.error('Export failed — try again')
    }
  }

  const assumptions: string[] =
    result?.config?.intent?.assumptions || result?.config?.intent?.assumptions_made || result?.assumptions || []

  const composer = (
    <div className="flex flex-col gap-3">
      {templateName && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-accent/25 bg-accent-subtle px-3 py-2">
          <p className="text-[11px] text-accent-hover font-mono m-0 truncate">
            Template · <span className="font-semibold">{templateName}</span>
          </p>
          <button
            type="button"
            onClick={() => {
              setTemplateName(null)
              setPrompt('')
            }}
            className="text-forge-400 hover:text-forge-200 cursor-pointer bg-transparent border-none p-0 shrink-0"
            aria-label="Clear template"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="compile-prompt" className="font-mono text-[10px] text-forge-500 uppercase tracking-[0.12em]">
            Prompt
          </label>
          <span className="text-[10px] font-mono text-forge-600">{prompt.length}</span>
        </div>
        <textarea
          id="compile-prompt"
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault()
              void handleCompile()
            }
          }}
          placeholder="Build a CRM with login, contacts, dashboard…"
          disabled={loading}
          className="w-full min-h-[150px] bg-forge-950/60 border border-white/[0.07] rounded-xl p-3.5 text-[13px] text-forge-50 font-mono resize-none outline-none leading-relaxed placeholder:text-forge-600 focus:border-accent/60 focus:ring-2 focus:ring-accent/10 transition-all disabled:opacity-60"
        />
      </div>

      <div>
        <p className="font-mono text-[10px] text-forge-500 uppercase tracking-[0.12em] m-0 mb-1.5">Try an example</p>
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              type="button"
              onClick={() => {
                setPrompt(ex.prompt)
                void handleCompile(ex.prompt)
              }}
              className="text-[11px] px-2.5 py-1 rounded-lg border border-white/[0.07] bg-white/[0.02] text-forge-400 cursor-pointer font-mono hover:border-accent/30 hover:text-forge-200 hover:bg-accent/[0.05] transition-all"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="font-mono text-[10px] text-forge-500 uppercase tracking-[0.12em] m-0 mb-1.5">Quality</p>
        <div className="flex rounded-xl border border-white/[0.07] bg-forge-950/60 p-0.5" role="group" aria-label="Compile mode">
          {[
            { id: 'fast', label: 'Fast' },
            { id: 'balanced', label: 'Balanced' },
            { id: 'precise', label: 'Precise' },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={mode === m.id}
              onClick={() => setMode(m.id)}
              className={`flex-1 px-2 py-1.5 rounded-[10px] text-[11px] font-mono border-none cursor-pointer transition-all ${
                mode === m.id ? 'bg-forge-700 text-forge-50 shadow-sm' : 'bg-transparent text-forge-500 hover:text-forge-300'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center justify-between gap-2 cursor-pointer select-none">
        <span className="flex items-center gap-2">
          <span
            role="switch"
            aria-checked={liveMode}
            tabIndex={0}
            onClick={() => setLiveMode((v) => !v)}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault()
                setLiveMode((v) => !v)
              }
            }}
            className={`relative w-8 h-[18px] rounded-full transition-colors shrink-0 ${
              liveMode ? 'bg-accent' : 'bg-forge-700'
            }`}
          >
            <span
              className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-transform ${
                liveMode ? 'translate-x-[16px]' : 'translate-x-[2px]'
              }`}
            />
          </span>
          <span className="text-[11px] font-mono text-forge-400">Live mode</span>
        </span>
        <span className="text-[10px] text-forge-600 font-mono">SSE</span>
      </label>

      <button
        type="button"
        onClick={() => void handleCompile()}
        disabled={loading || !prompt.trim()}
        className="w-full inline-flex items-center justify-center gap-2 bg-accent text-forge-950 border-none rounded-xl py-2.5 text-sm font-semibold cursor-pointer hover:bg-accent-hover transition-all hover:shadow-[0_10px_30px_-10px_rgba(16,185,129,0.6)] disabled:opacity-40 disabled:shadow-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-forge-950 active:scale-[0.99]"
      >
        {loading ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-forge-950/40 border-t-forge-950 rounded-full animate-spin" />
            Compiling…
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generate app
          </>
        )}
      </button>
      <p className="text-[10px] text-forge-600 font-mono text-center m-0 -mt-1">⌘/Ctrl + Enter</p>

      {upgradeInfo && <UpgradeBanner message={upgradeInfo.error} currentPlan={upgradeInfo.currentPlan} />}

      {assumptions.length > 0 && !loading && (
        <div className="p-3 rounded-xl border border-warning/25 bg-warning-subtle">
          <p className="text-[10px] font-mono uppercase tracking-[0.1em] text-warning m-0 mb-1.5">Assumptions</p>
          {assumptions.map((a, i) => (
            <p key={i} className="text-[11px] text-forge-300 font-mono m-0 leading-relaxed">
              · {a}
            </p>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-56px)] lg:overflow-hidden">
      {/* Composer — stacked above the output on mobile, fixed rail on desktop */}
      <aside className="flex flex-col shrink-0 border-b border-white/[0.06] bg-forge-950 lg:w-[280px] lg:min-h-0 lg:border-b-0 lg:border-r">
        <div className="px-4 lg:px-5 py-3 lg:py-4 border-b border-white/[0.06] shrink-0">
          <h1 className="text-[13px] font-semibold text-forge-50 m-0 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-accent" />
            Compiler
          </h1>
          <p className="hidden lg:block text-[11px] text-forge-500 m-0 mt-0.5">Describe your product</p>
        </div>

        <div className="p-4 lg:flex-1 lg:overflow-auto lg:min-h-0">
          {composer}
        </div>

        <div className="hidden lg:block px-5 py-4 border-t border-white/[0.06] shrink-0">
          <p className="font-mono text-[10px] text-forge-500 uppercase tracking-[0.12em] m-0 mb-2.5">Pipeline</p>
          <div className="flex flex-col gap-2">
            {STAGES.map((stage, i) => (
              <div key={stage} className="flex items-center gap-2.5">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-mono shrink-0 transition-all duration-300 ${
                    stageStatus[i] === 'done'
                      ? 'bg-success text-forge-950'
                      : stageStatus[i] === 'active'
                        ? 'bg-accent text-forge-950 animate-pulse'
                        : 'border border-white/[0.08] text-forge-500'
                  }`}
                >
                  {stageStatus[i] === 'done' ? '✓' : String(i + 1)}
                </span>
                <span
                  className={`text-[11.5px] font-mono transition-colors ${
                    stageStatus[i] === 'done'
                      ? 'text-forge-300'
                      : stageStatus[i] === 'active'
                        ? 'text-forge-50'
                        : 'text-forge-500'
                  }`}
                >
                  {stage}
                </span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 lg:min-h-0">

        {/* Tab bar */}
        <div className="sticky top-12 lg:top-0 z-20 flex border-b border-white/[0.06] bg-forge-950/85 backdrop-blur-md shrink-0">
          <div className="flex overflow-x-auto flex-1 scrollbar-none" role="tablist" aria-label="Compiler output">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-3.5 py-3 text-[11.5px] font-mono whitespace-nowrap bg-transparent border-none cursor-pointer transition-colors ${
                  activeTab === tab ? 'text-forge-50' : 'text-forge-500 hover:text-forge-300'
                }`}
              >
                {tab}
                {activeTab === tab && <span className="absolute inset-x-2.5 bottom-0 h-[2px] rounded-t bg-accent" />}
                {tab === 'Validation' && result?.validation && (
                  <span
                    className={`ml-1.5 inline-block w-1.5 h-1.5 rounded-full align-middle ${
                      result.validation.valid ? 'bg-success' : 'bg-danger'
                    }`}
                    aria-hidden
                  />
                )}
              </button>
            ))}
          </div>
          <div className="flex px-2 sm:px-3 gap-1.5 shrink-0 items-center">
            <button
              type="button"
              onClick={() => void download('json')}
              className="text-[11px] font-mono px-2.5 py-1 rounded-lg border border-white/[0.07] bg-forge-800/70 text-forge-400 cursor-pointer hover:text-forge-200 hover:border-white/[0.14] transition-colors"
            >
              JSON
            </button>
            <button
              type="button"
              onClick={() => void download('yaml')}
              className="text-[11px] font-mono px-2.5 py-1 rounded-lg border border-white/[0.07] bg-forge-800/70 text-forge-400 cursor-pointer hover:text-forge-200 hover:border-white/[0.14] transition-colors"
            >
              YAML
            </button>
            <button
              type="button"
              onClick={() => void download('zip')}
              className="text-[11px] font-mono px-2.5 py-1 rounded-lg border border-accent/30 bg-accent-subtle text-accent-hover cursor-pointer hover:bg-accent/20 transition-colors"
            >
              ZIP ↓
            </button>
          </div>
        </div>

        {/* Result summary */}
        {result?.success && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 md:px-6 py-2.5 border-b border-white/[0.05] bg-forge-900/30 shrink-0" style={{ animation: 'fade-in .4s ease-out' }}>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-success">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              compilation complete
            </span>
            {result.validation && (
              <span className="text-[11px] font-mono text-forge-400">
                score <span className={result.validation.valid ? 'text-success' : 'text-danger'}>{result.validation.score}/100</span>
              </span>
            )}
            {result.metrics?.latency !== undefined && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-forge-400">
                <Timer className="w-3 h-3" />
                <Counter value={result.metrics.latency} suffix="ms" />
              </span>
            )}
            {result.jobId && (
              <Link
                href={`/generated/${result.jobId}`}
                className="ml-auto inline-flex items-center gap-1 text-[11px] font-mono text-accent-hover hover:text-accent no-underline"
              >
                Open full view <ArrowUpRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        )}

        {/* Content */}
        <div ref={resultRef} className="flex-1 overflow-auto p-4 md:p-6">
          {!result && !loading && (
            <div className="flex flex-col items-center justify-center h-full min-h-[360px] text-center">
              <div className="relative mb-5">
                <div className="absolute inset-0 rounded-2xl bg-accent/20 blur-2xl" aria-hidden />
                <div className="relative w-14 h-14 rounded-2xl bg-forge-900 border border-accent/25 flex items-center justify-center">
                  <FileCode className="w-6 h-6 text-accent" />
                </div>
              </div>
              <p className="text-[15px] font-medium text-forge-200 m-0 mb-1">Ready when you are</p>
              <p className="text-[12px] text-forge-500 m-0 max-w-sm">
                Describe an app on the left. Output lands across seven tabs — config, SQL, Express, React, validation,
                docs and metrics.
              </p>
              <div className="flex flex-wrap justify-center gap-1.5 mt-6 max-w-md">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex.label}
                    type="button"
                    onClick={() => {
                      setPrompt(ex.prompt)
                      void handleCompile(ex.prompt)
                    }}
                    className="text-[11px] px-2.5 py-1.5 rounded-lg border border-white/[0.07] bg-white/[0.02] text-forge-400 font-mono cursor-pointer hover:border-accent/30 hover:text-forge-200 transition-all"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading && !result && (
            <div className="flex flex-col items-center justify-center h-full min-h-[360px] gap-5">
              {streaming && liveMode ? (
                <div className="w-full max-w-sm">
                  <PipelineLiveView prompt={prompt} mode={mode} onResult={handleLiveResult} onError={handleLiveError} />
                </div>
              ) : (
                <>
                  <div className="flex gap-1.5" aria-hidden>
                    {STAGES.map((stage, i) => (
                      <span
                        key={stage}
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          i < currentStage ? 'w-8 bg-success' : i === currentStage ? 'w-10 bg-accent animate-pulse' : 'w-8 bg-forge-700'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-forge-200 m-0">
                      {currentStage >= 0 ? STAGES[currentStage] : 'Starting compilation…'}
                    </p>
                    <p className="text-[11px] text-forge-500 font-mono m-0 mt-1">
                      stage {Math.max(currentStage + 1, 1)} of {STAGES.length}
                    </p>
                  </div>
                  <div className="w-full max-w-md space-y-2">
                    {[100, 78, 90, 60].map((w, i) => (
                      <div key={i} className="h-2.5 rounded bg-white/[0.05] overflow-hidden" style={{ width: `${w}%` }}>
                        <div className="h-full bg-gradient-to-r from-accent/30 to-secondary/20 animate-pulse" />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {result && !result.success && (
            <div className="max-w-2xl mx-auto mt-6 p-5 rounded-2xl border border-danger/30 bg-danger-subtle" role="alert" style={{ animation: 'reveal-up .35s ease-out' }}>
              <p className="text-[13px] font-semibold text-danger m-0 mb-1">Compilation failed</p>
              <p className="text-[12.5px] text-forge-300 m-0 leading-relaxed">{result.error}</p>
              <button
                type="button"
                onClick={() => void handleCompile()}
                className="mt-4 text-[11.5px] font-mono px-3 py-1.5 rounded-lg border border-white/[0.1] bg-white/[0.03] text-forge-200 hover:bg-white/[0.07] transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {result?.success && activeTab === 'Config' && (
            <CodePanel title="app-config.json" content={JSON.stringify(result.config, null, 2)} tone="text-forge-300" />
          )}

          {result?.success && activeTab === 'SQL' && (
            <CodePanel title="schema.sql" content={result.runtime?.sql || '-- No SQL generated'} tone="text-accent-hover" />
          )}

          {result?.success && activeTab === 'Express' && (
            <CodePanel title="server / routes" content={result.runtime?.express || '// No Express server generated'} tone="text-warning" />
          )}

          {result?.success && activeTab === 'React' && (
            <div className="flex flex-col gap-3">
              {result.runtime?.react && Object.keys(result.runtime.react).length > 0 ? (
                Object.entries(result.runtime.react).map(([path, content]) => (
                  <CodePanel key={path} title={path} content={content} tone="text-secondary" />
                ))
              ) : (
                <p className="text-sm text-forge-400 m-0">No React files generated.</p>
              )}
            </div>
          )}

          {result?.success && activeTab === 'Validation' && (
            <div className="flex flex-col gap-4 max-w-3xl">
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-4">
                <div className="rounded-2xl border border-white/[0.07] bg-forge-900/40 p-5 flex flex-col items-center justify-center">
                  <div className="relative w-24 h-24">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90" aria-hidden>
                      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke={result.validation?.valid ? '#10b981' : '#f87171'}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${((result.validation?.score ?? 0) / 100) * 264} 264`}
                        className="transition-all duration-700"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-forge-50 tabular-nums">
                      {result.validation?.score ?? 0}
                    </span>
                  </div>
                  <p className={`text-[11px] font-mono mt-2 m-0 ${result.validation?.valid ? 'text-success' : 'text-danger'}`}>
                    {result.validation?.valid ? 'VALID' : 'INVALID'}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { l: 'Errors', v: result.validation?.errors?.length ?? 0, tone: 'text-danger' },
                    { l: 'Warnings', v: result.validation?.warnings?.length ?? 0, tone: 'text-warning' },
                    { l: 'Repairs', v: result.validation?.repairs?.length ?? 0, tone: 'text-success' },
                  ].map((s) => (
                    <div key={s.l} className="rounded-xl border border-white/[0.07] bg-forge-900/40 p-4">
                      <p className="font-mono text-[10px] text-forge-500 uppercase tracking-[0.1em] m-0">{s.l}</p>
                      <p className={`text-2xl font-bold m-0 mt-2 tabular-nums ${s.tone}`}>{s.v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {result.validation?.errors && result.validation.errors.length > 0 && (
                <div className="p-4 rounded-xl border border-danger/25 bg-danger-subtle">
                  <p className="text-[10px] font-semibold text-danger m-0 mb-2 font-mono uppercase tracking-[0.1em]">Errors</p>
                  {result.validation.errors.map((e, i) => (
                    <p key={i} className="text-[12px] text-forge-300 font-mono m-0 leading-relaxed">✕ {e}</p>
                  ))}
                </div>
              )}
              {result.validation?.warnings && result.validation.warnings.length > 0 && (
                <div className="p-4 rounded-xl border border-warning/25 bg-warning-subtle">
                  <p className="text-[10px] font-semibold text-warning m-0 mb-2 font-mono uppercase tracking-[0.1em]">Warnings</p>
                  {result.validation.warnings.map((w, i) => (
                    <p key={i} className="text-[12px] text-forge-300 font-mono m-0 leading-relaxed">⚠ {w}</p>
                  ))}
                </div>
              )}
              {result.validation?.repairs && result.validation.repairs.length > 0 && (
                <div className="p-4 rounded-xl border border-success/25 bg-success-subtle">
                  <p className="text-[10px] font-semibold text-success m-0 mb-2 font-mono uppercase tracking-[0.1em]">Repairs made</p>
                  {result.validation.repairs.map((r, i) => (
                    <p key={i} className="text-[12px] text-forge-300 font-mono m-0 leading-relaxed">✓ {r}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {result?.success && activeTab === 'Docs' && result.docs && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(result.docs).map(([key, content]) => (
                <details
                  key={key}
                  open
                  className="group rounded-2xl border border-white/[0.07] bg-forge-900/40 overflow-hidden"
                >
                  <summary className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-forge-950/40 cursor-pointer list-none">
                    <span className="font-mono text-[10.5px] text-forge-400 uppercase tracking-[0.1em]">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-forge-500 transition-transform group-open:rotate-180" />
                  </summary>
                  <pre className="m-0 p-4 max-h-[240px] overflow-auto whitespace-pre-wrap text-[11.5px] leading-6 text-forge-300 font-mono">
                    {content}
                  </pre>
                </details>
              ))}
            </div>
          )}

          {result?.success && activeTab === 'Metrics' && (
            <div className="max-w-2xl flex flex-col gap-4">
              <div className="rounded-2xl border border-white/[0.07] bg-forge-900/40 p-5">
                <p className="font-mono text-[10px] text-forge-500 uppercase tracking-[0.1em] m-0">Total latency</p>
                <p className="text-3xl font-bold text-forge-50 m-0 mt-1.5 tracking-tight tabular-nums">
                  <Counter value={result.metrics?.latency ?? 0} suffix="ms" />
                </p>
              </div>
              {result.metrics?.stageTimes && Object.keys(result.metrics.stageTimes).length > 0 && (
                <div className="rounded-2xl border border-white/[0.07] bg-forge-900/40 p-5 flex flex-col gap-3">
                  <p className="font-mono text-[10px] text-forge-500 uppercase tracking-[0.1em] m-0 mb-1">Stage breakdown</p>
                  {(() => {
                    const times = Object.entries(result.metrics.stageTimes)
                    const max = Math.max(...times.map(([, t]) => t), 1)
                    return times.map(([stage, time]) => (
                      <div key={stage}>
                        <div className="flex justify-between text-[11px] font-mono mb-1">
                          <span className="text-forge-300">{stage.replace(/-/g, ' ')}</span>
                          <span className="text-forge-500 tabular-nums">{time}ms</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-accent to-secondary transition-all duration-700"
                            style={{ width: `${Math.max((time / max) * 100, 3)}%` }}
                          />
                        </div>
                      </div>
                    ))
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
