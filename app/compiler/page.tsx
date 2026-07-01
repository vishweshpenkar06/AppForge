'use client'

import { useState, useRef } from 'react'

interface CompileResult {
  success: boolean
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

const EXAMPLE_PROMPTS = [
  'CRM with analytics',
  'LMS platform',
  'Food delivery',
  'SaaS invoicing',
]

export default function CompilerPage() {
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState<CompileResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentStage, setCurrentStage] = useState(-1)
  const [activeTab, setActiveTab] = useState<Tab>('Config')
  const [copied, setCopied] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const stageStatus = STAGES.map((_, i) => {
    if (currentStage < 0) return 'pending' as const
    if (currentStage > i) return 'done' as const
    if (currentStage === i) return 'active' as const
    return 'pending' as const
  })

  const handleCompile = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setResult(null)
    setCurrentStage(0)

    const stageInterval = setInterval(() => {
      setCurrentStage(prev => {
        if (prev >= 5) { clearInterval(stageInterval); return prev }
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
      setResult({ success: false, error: error instanceof Error ? error.message : 'Compilation failed' })
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
    <div className="flex h-screen">
      {/* ── Left Panel ──────────────────────────────────────────── */}
      <aside className="w-[400px] flex-shrink-0 border-r border-[var(--bg-border)] flex flex-col h-screen sticky top-14">

        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--bg-border)]">
          <h1 className="text-sm font-semibold text-[var(--text-primary)]">Compiler</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Describe your product</p>
        </div>

        {/* Textarea + controls */}
        <div className="flex-1 flex flex-col p-6 gap-4 overflow-auto">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Build a CRM with login, contacts, dashboard, role-based access..."
            className="flex-1 w-full bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-lg p-4
                       text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)]
                       font-mono resize-none focus:outline-none focus:border-[var(--accent-primary)]
                       transition-colors leading-relaxed min-h-[180px]"
            disabled={loading}
          />

          {/* Example pills */}
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-2 font-mono uppercase tracking-wider">Try an example</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((ex) => (
                <button
                  key={ex}
                  onClick={() => { setPrompt(ex); textareaRef.current?.focus() }}
                  className="text-xs px-3 py-1.5 rounded-md border border-[var(--bg-border)]
                             bg-[var(--bg-elevated)] text-[var(--text-secondary)]
                             hover:border-[var(--accent-primary)] hover:text-[var(--text-primary)]
                             transition-all font-mono"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Compile button */}
          <button
            onClick={handleCompile}
            disabled={loading || !prompt.trim()}
            className="w-full btn-primary py-3 text-sm font-semibold disabled:opacity-40"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Compiling...
              </span>
            ) : 'Compile →'}
          </button>
        </div>

        {/* Stage progress */}
        <div className="border-t border-[var(--bg-border)] p-6">
          <p className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider mb-4">Pipeline</p>
          <div className="space-y-2">
            {STAGES.map((stage, i) => (
              <div key={stage} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-mono
                  ${stageStatus[i] === 'done' ? 'bg-[var(--success)] text-white' : ''}
                  ${stageStatus[i] === 'active' ? 'bg-[var(--accent-primary)] text-white animate-pulse' : ''}
                  ${stageStatus[i] === 'pending' ? 'border border-[var(--bg-border)] text-[var(--text-muted)]' : ''}
                `}>
                  {stageStatus[i] === 'done' ? '✓' : String(i + 1)}
                </div>
                <span className={`text-xs font-mono ${
                  stageStatus[i] === 'done' ? 'text-[var(--text-secondary)]' :
                  stageStatus[i] === 'active' ? 'text-[var(--text-primary)]' :
                  'text-[var(--text-muted)]'
                }`}>{stage}</span>
                {stageStatus[i] === 'active' && (
                  <span className="ml-auto text-xs text-[var(--accent-primary)] font-mono">running</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Assumptions banner */}
        {assumptions.length > 0 && !loading && (
          <div className="border-t border-[var(--bg-border)] p-6">
            <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/5">
              <div className="flex items-start gap-3">
                <span className="text-amber-400 text-sm mt-0.5">⚠</span>
                <div>
                  <p className="text-xs font-semibold text-amber-400 mb-2">Assumptions made</p>
                  <ul className="space-y-1">
                    {assumptions.map((a: string, i: number) => (
                      <li key={i} className="text-xs text-[var(--text-secondary)] font-mono">· {a}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* ── Right Panel ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tab bar */}
        <div className="flex border-b border-[var(--bg-border)] px-6 overflow-x-auto flex-shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-xs font-mono whitespace-nowrap transition-colors border-b-2 -mb-px
                ${activeTab === tab
                  ? 'border-[var(--accent-primary)] text-[var(--text-primary)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-auto p-6">
          {!result && !loading && (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-[var(--text-muted)]">Enter a prompt and click Compile</p>
            </div>
          )}

          {loading && !result && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <svg className="animate-spin h-8 w-8 mx-auto mb-4 text-[var(--accent-primary)]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm text-[var(--text-secondary)]">Compiling through 6 pipeline stages...</p>
              </div>
            </div>
          )}

          {result && !result.success && (
            <div className="p-6 rounded-xl border border-[var(--error)]/20 bg-[var(--error)]/5">
              <p className="text-sm font-semibold text-[var(--error)] mb-1">Compilation Failed</p>
              <p className="text-sm text-[var(--text-secondary)]">{result.error}</p>
            </div>
          )}

          {result?.success && activeTab === 'Config' && (
            <div className="relative">
              <button onClick={handleCopy}
                className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-1 rounded
                           bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)] text-xs text-[var(--text-secondary)]
                           border border-[var(--bg-border)] transition-colors font-mono">
                {copied ? '✓ Copied' : 'Copy'}
              </button>
              <pre className="bg-[var(--bg-surface)] p-6 rounded-xl text-xs overflow-auto max-h-[calc(100vh-200px)]
                              text-[var(--text-secondary)] border border-[var(--bg-border)] font-mono leading-relaxed">
                {JSON.stringify(result.config, null, 2)}
              </pre>
            </div>
          )}

          {result?.success && activeTab === 'SQL' && (
            <div className="rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface)] p-6">
              <p className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider mb-3">Generated SQL Schema</p>
              <pre className="text-xs text-[var(--accent-secondary)] overflow-auto max-h-[calc(100vh-200px)] whitespace-pre-wrap font-mono leading-relaxed">
                {result.runtime?.sql || '-- No SQL generated'}
              </pre>
            </div>
          )}

          {result?.success && activeTab === 'Express' && (
            <div className="rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface)] p-6">
              <p className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider mb-3">Generated Express Server</p>
              <pre className="text-xs text-[var(--warning)] overflow-auto max-h-[calc(100vh-200px)] whitespace-pre-wrap font-mono leading-relaxed">
                {result.runtime?.express || '// No Express server generated'}
              </pre>
            </div>
          )}

          {result?.success && activeTab === 'React' && (
            <div className="space-y-3">
              {result.runtime?.react && Object.keys(result.runtime.react).length > 0 ? (
                Object.entries(result.runtime.react).map(([path, content]) => (
                  <div key={path} className="rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface)] p-6">
                    <p className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider mb-2">{path}</p>
                    <pre className="text-xs text-[var(--accent-secondary)] overflow-auto max-h-48 whitespace-pre-wrap font-mono leading-relaxed">
                      {content}
                    </pre>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--text-muted)]">No React files generated.</p>
              )}
            </div>
          )}

          {result?.success && activeTab === 'Validation' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface)]">
                  <p className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider mb-2">Status</p>
                  <p className={`text-sm font-semibold ${result.validation?.valid ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
                    {result.validation?.valid ? 'VALID' : 'INVALID'}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface)]">
                  <p className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider mb-2">Score</p>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{result.validation?.score}/100</p>
                  <div className="w-full bg-[var(--bg-elevated)] rounded-full h-1.5 mt-2">
                    <div className="bg-[var(--accent-primary)] h-1.5 rounded-full" style={{ width: `${result.validation?.score || 0}%` }} />
                  </div>
                </div>
              </div>
              {result.validation?.repairs && result.validation.repairs.length > 0 && (
                <div className="p-4 rounded-xl border border-[var(--success)]/20 bg-[var(--success)]/5">
                  <p className="text-xs font-semibold text-[var(--success)] mb-2 font-mono">Repairs Made</p>
                  {result.validation.repairs.map((r, i) => (
                    <p key={i} className="text-xs text-[var(--text-secondary)] font-mono">✓ {r}</p>
                  ))}
                </div>
              )}
              {result.validation?.errors && result.validation.errors.length > 0 && (
                <div className="p-4 rounded-xl border border-[var(--error)]/20 bg-[var(--error)]/5">
                  <p className="text-xs font-semibold text-[var(--error)] mb-2 font-mono">Errors</p>
                  {result.validation.errors.map((err, i) => (
                    <p key={i} className="text-xs text-[var(--text-secondary)] font-mono">· {err}</p>
                  ))}
                </div>
              )}
              {result.execution && (
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-lg text-xs font-mono ${result.execution.executable ? 'bg-[var(--success)]/10 text-[var(--success)]' : 'bg-[var(--error)]/10 text-[var(--error)]'}`}>
                    Executable: {result.execution.executable ? 'YES' : 'NO'}
                  </div>
                  <div className={`p-3 rounded-lg text-xs font-mono ${result.execution.readyForDeployment ? 'bg-[var(--success)]/10 text-[var(--success)]' : 'bg-[var(--warning)]/10 text-[var(--warning)]'}`}>
                    Deploy Ready: {result.execution.readyForDeployment ? 'YES' : 'NEEDS REVIEW'}
                  </div>
                </div>
              )}
            </div>
          )}

          {result?.success && activeTab === 'Docs' && result.docs && (
            <div className="grid gap-3 md:grid-cols-2">
              {Object.entries(result.docs).map(([key, content]) => (
                <div key={key} className="rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface)] p-6">
                  <p className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider mb-3">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <pre className="max-h-60 overflow-auto whitespace-pre-wrap text-xs leading-6 text-[var(--text-secondary)] font-mono">
                    {content}
                  </pre>
                </div>
              ))}
            </div>
          )}

          {result?.success && activeTab === 'Metrics' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface)]">
                <p className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">Total Latency</p>
                <p className="text-2xl font-bold text-[var(--text-primary)] mt-2 tracking-tight">{result.metrics?.latency}ms</p>
              </div>
              {result.metrics?.stageTimes && Object.entries(result.metrics.stageTimes).map(([stage, time]) => (
                <div key={stage} className="p-5 rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface)]">
                  <p className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">{stage.replace(/-/g, ' ')}</p>
                  <p className="text-2xl font-bold text-[var(--text-primary)] mt-2 tracking-tight">{time}ms</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
