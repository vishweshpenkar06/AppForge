'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { UpgradeBanner } from '@/components/upgrade-banner'

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
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState<CompileResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentStage, setCurrentStage] = useState(-1)
  const [activeTab, setActiveTab] = useState<Tab>('Config')
  const [copied, setCopied] = useState(false)
  const [upgradeInfo, setUpgradeInfo] = useState<{ error: string; currentPlan: string } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const stageStatus = STAGES.map((_, i) => {
    if (currentStage < 0) return 'pending'
    if (currentStage > i) return 'done'
    if (currentStage === i) return 'active'
    return 'pending'
  })

  const handleCompile = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setResult(null)
    setCurrentStage(0)
    const iv = setInterval(() => setCurrentStage((p) => { if (p >= 5) { clearInterval(iv); return p } return p + 1 }), 2000)
    try {
      const r = await fetch('/api/compile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, mode: 'balanced' }) })
      const d = await r.json()
      if (d.upgradeRequired) {
        setUpgradeInfo({ error: d.error, currentPlan: d.currentPlan })
        setResult(null)
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
    const r = await fetch(`/api/generations/${result.jobId}/export?format=${fmt}`)
    if (!r.ok) return
    const blob = await r.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `appforge-config.${fmt}`
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  const handleExportZip = async () => {
    if (!result?.jobId) return
    const r = await fetch(`/api/generations/${result.jobId}/export?format=zip`)
    if (!r.ok) return
    const blob = await r.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'appforge-bundle.zip'
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  const assumptions = result?.config?.intent?.assumptions || result?.config?.intent?.assumptions_made || result?.assumptions || []

  return (
    <div style={{ display:'flex', height:'calc(100vh - 48px)' }}>
      {/* ── Left Panel ──────────────────────────────────────────── */}
      <aside style={{ width:260, flexShrink:0, borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', background:'var(--surface-0)' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)' }}>
          <h1 style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)', margin:0 }}>Compiler</h1>
          <p style={{ fontSize:11, color:'var(--text-muted)', margin:'2px 0 0' }}>Describe your product</p>
        </div>

        <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'16px 20px', gap:12, overflow:'auto' }}>
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Build a CRM with login, contacts, dashboard..."
            disabled={loading}
            style={{
              flex:1, width:'100%', minHeight:140, background:'var(--surface-2)', border:'1px solid var(--border)',
              borderRadius:'var(--radius)', padding:12, fontSize:13, color:'var(--text-primary)',
              fontFamily:'var(--font-mono)', resize:'none', outline:'none', lineHeight:'1.6',
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--fill-accent)'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
          />

          <div>
            <p style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 6px' }}>Try an example</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {EXAMPLES.map((ex) => (
                <button key={ex} onClick={() => { setPrompt(ex); textareaRef.current?.focus() }}
                  style={{ fontSize:11, padding:'4px 10px', borderRadius:6, border:'1px solid var(--border)', background:'var(--surface-2)', color:'var(--text-secondary)', cursor:'pointer', fontFamily:'var(--font-mono)' }}>
                  {ex}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 6px' }}>Mode</p>
            <select style={{ width:'100%', height:36, background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'0 10px', fontSize:12, color:'var(--text-primary)', fontFamily:'var(--font-mono)', cursor:'pointer' }}>
              <option value="balanced">Balanced — recommended</option>
              <option value="fast">Fast — lower quality</option>
              <option value="precise">Precise — higher quality</option>
            </select>
            <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>
              Output detail: <span style={{ color:'var(--text-accent)', fontWeight:500 }}>Standard</span> · <a href="/pricing" style={{ color:'var(--text-accent)', textDecoration:'none' }}>upgrade for more depth</a>
            </p>
          </div>

          <button onClick={handleCompile} disabled={loading || !prompt.trim()}
            style={{ width:'100%', background:'var(--fill-accent)', color:'#fff', border:'none', borderRadius:'var(--radius)', padding:'10px 0', fontSize:13, fontWeight:600, cursor:'pointer', opacity: loading || !prompt.trim() ? 0.4 : 1 }}>
            {loading ? 'Compiling...' : 'Compile →'}
          </button>

          {upgradeInfo && <UpgradeBanner message={upgradeInfo.error} currentPlan={upgradeInfo.currentPlan} />}
        </div>

        {/* Assumptions */}
        {assumptions.length > 0 && !loading && (
          <div style={{ padding:'12px 20px', borderTop:'1px solid var(--border)' }}>
            <div style={{ padding:12, borderRadius:'var(--radius)', border:'1px solid var(--bg-warning)', background:'var(--bg-warning)' }}>
              <p style={{ fontSize:11, fontWeight:600, color:'var(--text-warning)', margin:'0 0 6px' }}>Assumptions</p>
              {assumptions.map((a: string, i: number) => (
                <p key={i} style={{ fontSize:11, color:'var(--text-secondary)', fontFamily:'var(--font-mono)', margin:'2px 0' }}>· {a}</p>
              ))}
            </div>
          </div>
        )}

        {/* Pipeline */}
        <div style={{ padding:'16px 20px', borderTop:'1px solid var(--border)' }}>
          <p style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 12px' }}>Pipeline</p>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {STAGES.map((stage, i) => (
              <div key={stage} style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{
                  width:20, height:20, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontFamily:'var(--font-mono)', flexShrink:0,
                  background: stageStatus[i] === 'done' ? 'var(--text-success)' : stageStatus[i] === 'active' ? 'var(--fill-accent)' : 'transparent',
                  border: stageStatus[i] === 'pending' ? '1px solid var(--border)' : 'none',
                  color: stageStatus[i] === 'done' || stageStatus[i] === 'active' ? '#fff' : 'var(--text-muted)',
                  animation: stageStatus[i] === 'active' ? 'pulse-dot 1.5s ease-in-out infinite' : 'none',
                }}>
                  {stageStatus[i] === 'done' ? '✓' : String(i + 1)}
                </div>
                <span style={{ fontSize:12, fontFamily:'var(--font-mono)', color: stageStatus[i] === 'done' ? 'var(--text-secondary)' : stageStatus[i] === 'active' ? 'var(--text-primary)' : 'var(--text-muted)' }}>{stage}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Right Panel ─────────────────────────────────────────── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        {/* Tab bar */}
        <div style={{ display:'flex', borderBottom:'1px solid var(--border)', alignItems:'center', flexShrink:0 }}>
          <div style={{ display:'flex', overflow:'auto', flex:1 }}>
            {TABS.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding:'12px 16px', fontSize:12, fontFamily:'var(--font-mono)', whiteSpace:'nowrap',
                border:'none', borderBottom:'2px solid', cursor:'pointer', background:'transparent',
                borderBottomColor: activeTab === tab ? 'var(--fill-accent)' : 'transparent',
                color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
              }}>{tab}</button>
            ))}
          </div>
          <div style={{ padding:'0 16px', display:'flex', gap:6, flexShrink:0 }}>
            <button onClick={() => handleExport('json')} style={{ fontSize:11, fontFamily:'var(--font-mono)', padding:'4px 10px', borderRadius:6, border:'1px solid var(--border)', background:'var(--surface-2)', color:'var(--text-secondary)', cursor:'pointer' }}>JSON</button>
            <button onClick={() => handleExport('yaml')} style={{ fontSize:11, fontFamily:'var(--font-mono)', padding:'4px 10px', borderRadius:6, border:'1px solid var(--border)', background:'var(--surface-2)', color:'var(--text-secondary)', cursor:'pointer' }}>YAML</button>
            <button onClick={handleExportZip} style={{ fontSize:11, fontFamily:'var(--font-mono)', padding:'4px 10px', borderRadius:6, border:'1px solid var(--fill-accent)', background:'var(--fill-accent-subtle)', color:'var(--text-accent)', cursor:'pointer' }}>ZIP ↓</button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex:1, overflow:'auto', padding:24 }}>
          {!result && !loading && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:12, textAlign:'center' }}>
              <div style={{ width:48, height:48, borderRadius:12, background:'var(--fill-accent-subtle)', border:'1px solid rgba(99,102,241,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>⬡</div>
              <p style={{ fontSize:13, color:'var(--text-secondary)', margin:0 }}>Enter a prompt and click Compile</p>
              <p style={{ fontSize:11, color:'var(--text-muted)', margin:0 }}>Output will appear across 7 tabs</p>
            </div>
          )}

          {loading && !result && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%' }}>
              <p style={{ fontSize:13, color:'var(--text-secondary)' }}>Compiling through 6 pipeline stages...</p>
            </div>
          )}

          {result && !result.success && (
            <div style={{ padding:24, borderRadius:'var(--radius)', border:'1px solid var(--bg-danger)', background:'var(--bg-danger)' }}>
              <p style={{ fontSize:13, fontWeight:600, color:'var(--text-danger)', margin:'0 0 4px' }}>Compilation Failed</p>
              <p style={{ fontSize:13, color:'var(--text-secondary)', margin:0 }}>{result.error}</p>
            </div>
          )}

          {result?.success && activeTab === 'Config' && (
            <div style={{ position:'relative' }}>
              <button onClick={handleCopy} style={{ position:'absolute', top:12, right:12, zIndex:10, fontSize:11, fontFamily:'var(--font-mono)', padding:'4px 10px', borderRadius:6, border:'1px solid var(--border)', background:'var(--surface-2)', color:'var(--text-secondary)', cursor:'pointer' }}>
                {copied ? '✓ Copied' : 'Copy'}
              </button>
              <pre style={{ background:'var(--surface-1)', padding:24, borderRadius:'var(--radius)', fontSize:12, overflow:'auto', maxHeight:'calc(100vh - 180px)', color:'var(--text-secondary)', border:'1px solid var(--border)', fontFamily:'var(--font-mono)', lineHeight:'1.7', margin:0 }}>
                {JSON.stringify(result.config, null, 2)}
              </pre>
            </div>
          )}

          {result?.success && activeTab === 'SQL' && (
            <pre style={{ background:'var(--surface-1)', padding:24, borderRadius:'var(--radius)', fontSize:12, overflow:'auto', maxHeight:'calc(100vh - 180px)', color:'var(--text-accent)', border:'1px solid var(--border)', fontFamily:'var(--font-mono)', lineHeight:'1.7', margin:0, whiteSpace:'pre-wrap' }}>
              {result.runtime?.sql || '-- No SQL generated'}
            </pre>
          )}

          {result?.success && activeTab === 'Express' && (
            <pre style={{ background:'var(--surface-1)', padding:24, borderRadius:'var(--radius)', fontSize:12, overflow:'auto', maxHeight:'calc(100vh - 180px)', color:'var(--text-warning)', border:'1px solid var(--border)', fontFamily:'var(--font-mono)', lineHeight:'1.7', margin:0, whiteSpace:'pre-wrap' }}>
              {result.runtime?.express || '// No Express server generated'}
            </pre>
          )}

          {result?.success && activeTab === 'React' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {result.runtime?.react && Object.keys(result.runtime.react).length > 0 ? (
                Object.entries(result.runtime.react).map(([path, content]) => (
                  <div key={path} style={{ background:'var(--surface-1)', padding:24, borderRadius:'var(--radius)', border:'1px solid var(--border)' }}>
                    <p style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 8px' }}>{path}</p>
                    <pre style={{ fontSize:12, color:'var(--text-accent)', overflow:'auto', maxHeight:200, fontFamily:'var(--font-mono)', lineHeight:'1.7', margin:0, whiteSpace:'pre-wrap' }}>{content}</pre>
                  </div>
                ))
              ) : <p style={{ fontSize:13, color:'var(--text-muted)' }}>No React files generated.</p>}
            </div>
          )}

          {result?.success && activeTab === 'Validation' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div style={{ padding:16, borderRadius:'var(--radius)', border:'1px solid var(--border)', background:'var(--surface-1)' }}>
                  <p style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 8px' }}>Status</p>
                  <p style={{ fontSize:14, fontWeight:600, color: result.validation?.valid ? 'var(--text-success)' : 'var(--text-danger)', margin:0 }}>{result.validation?.valid ? 'VALID' : 'INVALID'}</p>
                </div>
                <div style={{ padding:16, borderRadius:'var(--radius)', border:'1px solid var(--border)', background:'var(--surface-1)' }}>
                  <p style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 8px' }}>Score</p>
                  <p style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)', margin:0 }}>{result.validation?.score}/100</p>
                  <div style={{ width:'100%', height:4, background:'var(--surface-2)', borderRadius:2, marginTop:8 }}>
                    <div style={{ height:4, background:'var(--fill-accent)', borderRadius:2, width:`${result.validation?.score || 0}%` }} />
                  </div>
                </div>
              </div>
              {result.validation?.repairs && result.validation.repairs.length > 0 && (
                <div style={{ padding:16, borderRadius:'var(--radius)', border:'1px solid var(--bg-success)', background:'var(--bg-success)' }}>
                  <p style={{ fontSize:11, fontWeight:600, color:'var(--text-success)', margin:'0 0 8px', fontFamily:'var(--font-mono)' }}>Repairs Made</p>
                  {result.validation.repairs.map((r, i) => <p key={i} style={{ fontSize:12, color:'var(--text-secondary)', fontFamily:'var(--font-mono)', margin:'2px 0' }}>✓ {r}</p>)}
                </div>
              )}
            </div>
          )}

          {result?.success && activeTab === 'Docs' && result.docs && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {Object.entries(result.docs).map(([key, content]) => (
                <div key={key} style={{ background:'var(--surface-1)', padding:24, borderRadius:'var(--radius)', border:'1px solid var(--border)' }}>
                  <p style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 12px' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <pre style={{ maxHeight:240, overflow:'auto', whiteSpace:'pre-wrap', fontSize:12, lineHeight:'1.7', color:'var(--text-secondary)', fontFamily:'var(--font-mono)', margin:0 }}>{content}</pre>
                </div>
              ))}
            </div>
          )}

          {result?.success && activeTab === 'Metrics' && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16 }}>
              <div style={{ padding:20, borderRadius:'var(--radius)', border:'1px solid var(--border)', background:'var(--surface-1)' }}>
                <p style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', margin:0 }}>Total Latency</p>
                <p style={{ fontSize:24, fontWeight:700, color:'var(--text-primary)', margin:'8px 0 0', letterSpacing:'-0.02em' }}>{result.metrics?.latency}ms</p>
              </div>
              {result.metrics?.stageTimes && Object.entries(result.metrics.stageTimes).map(([stage, time]) => (
                <div key={stage} style={{ padding:20, borderRadius:'var(--radius)', border:'1px solid var(--border)', background:'var(--surface-1)' }}>
                  <p style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', margin:0 }}>{stage.replace(/-/g, ' ')}</p>
                  <p style={{ fontSize:24, fontWeight:700, color:'var(--text-primary)', margin:'8px 0 0', letterSpacing:'-0.02em' }}>{time}ms</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
