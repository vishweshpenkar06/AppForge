'use client'

import { useState, useRef, useCallback, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { UpgradeBanner } from '@/components/upgrade-banner'
import PipelineLiveView from '@/components/PipelineLiveView'

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
type Tab = typeof TABS[number]

const EXAMPLES = ['CRM with analytics', 'LMS platform', 'Food delivery', 'SaaS invoicing']

export default function CompilerPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[calc(100vh-48px)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-forge-400">Loading compiler...</p>
        </div>
      </div>
    }>
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
  const [copied, setCopied] = useState(false)
  const [upgradeInfo, setUpgradeInfo] = useState<{ error: string; currentPlan: string } | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const [liveMode, setLiveMode] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [templateName, setTemplateName] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const templateId = searchParams.get('templateId')
    if (!templateId) return

    fetch(`/api/templates/${templateId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.sourceGeneration?.prompt) {
          setPrompt(data.sourceGeneration.prompt)
          setTemplateName(data.title)
        }
      })
      .catch(() => {})
  }, [searchParams])

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
    }
  }, [])

  const handleLiveError = useCallback((msg: string) => {
    setStreaming(false)
    setLoading(false)
    setCurrentStage(-1)
    setResult({ success: false, error: msg })
  }, [])

  const stageStatus = STAGES.map((_, i) => {
    if (currentStage < 0) return 'pending'
    if (currentStage > i) return 'done'
    if (currentStage === i) return 'active'
    return 'pending'
  })

  const handleCompile = async (overridePrompt?: string) => {
    const compilePrompt = overridePrompt || prompt
    if (!compilePrompt.trim()) return
    setLoading(true)
    setResult(null)
    setUpgradeInfo(null)

    if (liveMode) {
      setStreaming(true)
      setCurrentStage(0)
      return
    }

    setCurrentStage(0)
    const iv = setInterval(() => setCurrentStage((p) => { if (p >= 5) { clearInterval(iv); return p } return p + 1 }), 2000)
    try {
      const r = await fetch('/api/compile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: compilePrompt, mode }) })
      const d = await r.json()
      if (d.upgradeRequired) {
        setUpgradeInfo({ error: d.error, currentPlan: d.currentPlan })
        setResult(null)
      } else if (d.status === 'needs_clarification') {
        setResult({ success: false, error: `Prompt needs more detail: ${(d.detectedIssues || []).join('; ')}` })
      } else {
        setUpgradeInfo(null)
        setResult(d)
      }
    } catch (e) { setResult({ success: false, error: e instanceof Error ? e.message : 'Failed' }) }
    finally { clearInterval(iv); setLoading(false); setCurrentStage(-1) }
  }

  const handleCopy = () => {
    if (!result?.config) return
    navigator.clipboard.writeText(JSON.stringify(result.config, null, 2))
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const handleExport = async (fmt: 'json' | 'yaml') => {
    if (!result?.jobId) return
    setExportError(null)
    try {
      const r = await fetch(`/api/generations/${result.jobId}/export?format=${fmt}`)
      if (!r.ok) {
        const err = await r.json().catch(() => ({ error: 'Export failed' }))
        setExportError(err.error || `Export as ${fmt} requires Pro or Team plan`)
        return
      }
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `appforge-config.${fmt}`
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
    } catch { setExportError('Export failed — try again') }
  }

  const handleExportZip = async () => {
    if (!result?.jobId) return
    setExportError(null)
    try {
      const r = await fetch(`/api/generations/${result.jobId}/export?format=zip`)
      if (!r.ok) {
        const err = await r.json().catch(() => ({ error: 'ZIP export failed' }))
        setExportError(err.error || 'ZIP export requires Pro or Team plan')
        return
      }
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = 'appforge-bundle.zip'
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
    } catch { setExportError('ZIP export failed — try again') }
  }

  const assumptions = result?.config?.intent?.assumptions || result?.config?.intent?.assumptions_made || result?.assumptions || []

  return (
    <div className="flex h-[calc(100vh-48px)]">
      {/* ── Left Panel ──────────────────────────────────────────── */}
      <aside className="w-64 shrink-0 border-r border-white/[0.06] flex flex-col bg-forge-950 hidden lg:flex">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h1 className="text-sm font-semibold text-forge-50 m-0">Compiler</h1>
          <p className="text-[11px] text-forge-400 m-0 mt-0.5">Describe your product</p>
        </div>

        <div className="flex-1 flex flex-col p-5 gap-3 overflow-auto">
          {templateName && (
            <div className="flex items-center justify-between rounded-xl border border-accent/20 bg-accent-subtle px-3 py-2">
              <p className="text-[11px] text-accent-hover font-mono m-0">
                Using template: <span className="font-semibold">{templateName}</span>
              </p>
              <button
                onClick={() => { setTemplateName(null); setPrompt('') }}
                className="text-[10px] text-forge-400 hover:text-forge-200 cursor-pointer bg-transparent border-none p-0 font-mono"
              >
                clear
              </button>
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Build a CRM with login, contacts, dashboard..."
            disabled={loading}
            className="flex-1 w-full min-h-[140px] bg-forge-800 border border-white/[0.06] rounded-xl p-3 text-sm text-forge-50 font-mono resize-none outline-none leading-relaxed placeholder:text-forge-500 focus:border-accent transition-colors"
          />

          <div>
            <p className="font-mono text-[10px] text-forge-400 uppercase tracking-[0.1em] m-0 mb-1.5">Try an example</p>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex) => (
                <button key={ex} onClick={() => { setPrompt(ex); handleCompile(ex) }}
                  className="text-[11px] px-2.5 py-1 rounded-md border border-white/[0.06] bg-forge-800 text-forge-300 cursor-pointer font-mono hover:border-white/[0.12] hover:text-forge-200 transition-colors focus-visible:ring-2 focus-visible:ring-accent/40">
                  {ex}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-mono text-[10px] text-forge-400 uppercase tracking-[0.1em] m-0 mb-1.5">Mode</p>
            <select value={mode} onChange={(e) => setMode(e.target.value)}
              className="w-full h-9 bg-forge-800 border border-white/[0.06] rounded-xl px-2.5 text-xs text-forge-50 font-mono cursor-pointer focus-visible:ring-2 focus-visible:ring-accent/40 focus:outline-none">
              <option value="fast">Fast — lower quality</option>
              <option value="balanced">Balanced — recommended</option>
              <option value="precise">Precise — higher quality</option>
            </select>
            <p className="text-[11px] text-forge-400 mt-1 m-0">
              Output detail: <span className="text-accent-hover font-medium">Standard</span> · <a href="/pricing" className="text-accent-hover no-underline hover:underline">upgrade for more</a>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                role="switch"
                aria-checked={liveMode}
                tabIndex={0}
                onClick={() => setLiveMode((v) => !v)}
                onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setLiveMode((v) => !v) } }}
                className={`relative w-8 h-[18px] rounded-full transition-colors ${
                  liveMode ? 'bg-accent' : 'bg-forge-700'
                }`}
              >
                <div
                  className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-transform ${
                    liveMode ? 'translate-x-[16px]' : 'translate-x-[2px]'
                  }`}
                />
              </div>
              <span className="text-[11px] font-mono text-forge-400">Live mode</span>
            </label>
            <span className="text-[10px] text-forge-500 font-mono">SSE</span>
          </div>

          <button onClick={() => handleCompile()} disabled={loading || !prompt.trim()}
            className="w-full bg-accent text-white border-none rounded-xl py-2.5 text-sm font-semibold cursor-pointer hover:bg-accent-hover transition-colors disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-forge-950">
            {loading ? 'Compiling...' : 'Generate app'}
          </button>

          {upgradeInfo && <UpgradeBanner message={upgradeInfo.error} currentPlan={upgradeInfo.currentPlan} />}
        </div>

        {/* Assumptions */}
        {assumptions.length > 0 && !loading && (
          <div className="px-5 py-3 border-t border-white/[0.06]">
            <div className="p-3 rounded-xl border border-warning/30 bg-warning-subtle">
              <p className="text-[11px] font-semibold text-warning m-0 mb-1.5">Assumptions</p>
              {assumptions.map((a: string, i: number) => (
                <p key={i} className="text-[11px] text-forge-300 font-mono m-0.5">· {a}</p>
              ))}
            </div>
          </div>
        )}

        {/* Pipeline */}
        <div className="px-5 py-4 border-t border-white/[0.06]">
          <p className="font-mono text-[10px] text-forge-400 uppercase tracking-[0.1em] m-0 mb-3">Pipeline</p>
          <div className="flex flex-col gap-2">
            {STAGES.map((stage, i) => (
              <div key={stage} className="flex items-center gap-2.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 transition-all duration-200
                  ${stageStatus[i] === 'done' ? 'bg-success text-white' :
                    stageStatus[i] === 'active' ? 'bg-accent text-white' :
                    'border border-white/[0.06] text-forge-400'}`}
                  style={stageStatus[i] === 'active' ? { animation: 'pulse-dot 1.5s ease-in-out infinite' } : undefined}>
                  {stageStatus[i] === 'done' ? '✓' : String(i + 1)}
                </div>
                <span className={`text-xs font-mono transition-colors
                  ${stageStatus[i] === 'done' ? 'text-forge-300' :
                    stageStatus[i] === 'active' ? 'text-forge-50' :
                    'text-forge-400'}`}>{stage}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Right Panel ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tab bar */}
        <div className="flex border-b border-white/[0.06] items-center shrink-0">
          <div className="flex overflow-auto flex-1">
            {TABS.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-xs font-mono whitespace-nowrap border-b-2 -mb-px transition-colors bg-transparent cursor-pointer
                  ${activeTab === tab ? 'border-accent text-forge-50' : 'border-transparent text-forge-400 hover:text-forge-300'}`}>
                {tab}
              </button>
            ))}
          </div>
          <div className="px-4 flex gap-1.5 shrink-0 items-center">
            <button onClick={() => handleExport('json')} className="text-[11px] font-mono px-2.5 py-1 rounded-md border border-white/[0.06] bg-forge-800 text-forge-300 cursor-pointer hover:border-white/[0.12] hover:text-forge-200 transition-colors focus-visible:ring-2 focus-visible:ring-accent/40">JSON</button>
            <button onClick={() => handleExport('yaml')} className="text-[11px] font-mono px-2.5 py-1 rounded-md border border-white/[0.06] bg-forge-800 text-forge-300 cursor-pointer hover:border-white/[0.12] hover:text-forge-200 transition-colors focus-visible:ring-2 focus-visible:ring-accent/40">YAML</button>
            <button onClick={handleExportZip} className="text-[11px] font-mono px-2.5 py-1 rounded-md border border-accent/30 bg-accent-subtle text-accent-hover cursor-pointer hover:bg-accent/20 transition-colors focus-visible:ring-2 focus-visible:ring-accent/40">ZIP ↓</button>
            {exportError && (
              <span className="text-[11px] text-warning font-mono ml-1">{exportError}</span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {!result && !loading && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <div className="w-12 h-12 rounded-xl bg-accent-subtle border border-accent/20 flex items-center justify-center text-2xl">⬡</div>
              <p className="text-sm text-forge-300 m-0">Enter a prompt and click Generate app</p>
              <p className="text-[11px] text-forge-400 m-0">Output appears across 7 tabs</p>
            </div>
          )}

          {loading && !result && (
            <div className="flex items-center justify-center h-full">
              {streaming && liveMode ? (
                <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                  <PipelineLiveView prompt={prompt} mode={mode} onResult={handleLiveResult} onError={handleLiveError} />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="flex gap-2">
                    {STAGES.map((_, i) => (
                      <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300
                        ${i < currentStage ? 'bg-success' :
                          i === currentStage ? 'bg-accent scale-125' :
                          'bg-forge-600'}`}
                        style={i === currentStage ? { animation: 'pulse-dot 1s ease-in-out infinite' } : undefined} />
                    ))}
                  </div>
                  <p className="text-sm text-forge-300 m-0">
                    {currentStage >= 0 ? `Stage ${currentStage + 1}: ${STAGES[currentStage]}` : 'Starting compilation...'}
                  </p>
                </div>
              )}
            </div>
          )}

          {result && !result.success && (
            <div className="p-6 rounded-xl border border-danger/30 bg-danger-subtle">
              <p className="text-sm font-semibold text-danger m-0 mb-1">Compilation failed</p>
              <p className="text-sm text-forge-300 m-0">{result.error}</p>
            </div>
          )}

          {result?.success && activeTab === 'Config' && (
            <div className="relative">
              <button onClick={handleCopy} className="absolute top-3 right-3 z-10 text-[11px] font-mono px-2.5 py-1 rounded-md border border-white/[0.06] bg-forge-800 text-forge-300 cursor-pointer hover:border-white/[0.12] hover:text-forge-200 transition-colors focus-visible:ring-2 focus-visible:ring-accent/40">
                {copied ? '✓ Copied' : 'Copy'}
              </button>
              <pre className="bg-forge-800 p-6 rounded-xl text-xs overflow-auto max-h-[calc(100vh-180px)] text-forge-300 border border-white/[0.06] font-mono leading-7 m-0">
                {JSON.stringify(result.config, null, 2)}
              </pre>
            </div>
          )}

          {result?.success && activeTab === 'SQL' && (
            <pre className="bg-forge-800 p-6 rounded-xl text-xs overflow-auto max-h-[calc(100vh-180px)] text-accent-hover border border-white/[0.06] font-mono leading-7 m-0 whitespace-pre-wrap">
              {result.runtime?.sql || '-- No SQL generated'}
            </pre>
          )}

          {result?.success && activeTab === 'Express' && (
            <pre className="bg-forge-800 p-6 rounded-xl text-xs overflow-auto max-h-[calc(100vh-180px)] text-warning border border-white/[0.06] font-mono leading-7 m-0 whitespace-pre-wrap">
              {result.runtime?.express || '// No Express server generated'}
            </pre>
          )}

          {result?.success && activeTab === 'React' && (
            <div className="flex flex-col gap-3">
              {result.runtime?.react && Object.keys(result.runtime.react).length > 0 ? (
                Object.entries(result.runtime.react).map(([path, content]) => (
                  <div key={path} className="bg-forge-800 p-6 rounded-xl border border-white/[0.06]">
                    <p className="font-mono text-[10px] text-forge-400 uppercase tracking-[0.1em] m-0 mb-2">{path}</p>
                    <pre className="text-xs text-accent-hover overflow-auto max-h-[200px] font-mono leading-7 m-0 whitespace-pre-wrap">{content}</pre>
                  </div>
                ))
              ) : <p className="text-sm text-forge-400">No React files generated.</p>}
            </div>
          )}

          {result?.success && activeTab === 'Validation' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-white/[0.06] bg-forge-800">
                  <p className="font-mono text-[10px] text-forge-400 uppercase tracking-[0.1em] m-0 mb-2">Status</p>
                  <p className={`text-base font-semibold m-0 ${result.validation?.valid ? 'text-success' : 'text-danger'}`}>
                    {result.validation?.valid ? 'VALID' : 'INVALID'}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-white/[0.06] bg-forge-800">
                  <p className="font-mono text-[10px] text-forge-400 uppercase tracking-[0.1em] m-0 mb-2">Score</p>
                  <p className="text-base font-semibold text-forge-50 m-0">{result.validation?.score}/100</p>
                  <div className="w-full h-1 bg-forge-700 rounded mt-2">
                    <div className="h-1 bg-accent rounded transition-all" style={{ width: `${result.validation?.score || 0}%` }} />
                  </div>
                </div>
              </div>
              {result.validation?.repairs && result.validation.repairs.length > 0 && (
                <div className="p-4 rounded-xl border border-success/30 bg-success-subtle">
                  <p className="text-[11px] font-semibold text-success m-0 mb-2 font-mono">Repairs Made</p>
                  {result.validation.repairs.map((r, i) => (
                    <p key={i} className="text-xs text-forge-300 font-mono m-0.5">✓ {r}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {result?.success && activeTab === 'Docs' && result.docs && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(result.docs).map(([key, content]) => (
                <div key={key} className="bg-forge-800 p-6 rounded-xl border border-white/[0.06]">
                  <p className="font-mono text-[10px] text-forge-400 uppercase tracking-[0.1em] m-0 mb-3">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <pre className="max-h-[240px] overflow-auto whitespace-pre-wrap text-xs leading-7 text-forge-300 font-mono m-0">{content}</pre>
                </div>
              ))}
            </div>
          )}

          {result?.success && activeTab === 'Metrics' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl border border-white/[0.06] bg-forge-800">
                <p className="font-mono text-[10px] text-forge-400 uppercase tracking-[0.1em] m-0">Total Latency</p>
                <p className="text-2xl font-bold text-forge-50 m-0 mt-2 tracking-tight">{result.metrics?.latency}ms</p>
              </div>
              {result.metrics?.stageTimes && Object.entries(result.metrics.stageTimes).map(([stage, time]) => (
                <div key={stage} className="p-5 rounded-xl border border-white/[0.06] bg-forge-800">
                  <p className="font-mono text-[10px] text-forge-400 uppercase tracking-[0.1em] m-0">{stage.replace(/-/g, ' ')}</p>
                  <p className="text-2xl font-bold text-forge-50 m-0 mt-2 tracking-tight">{time}ms</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
