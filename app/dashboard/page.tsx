'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Metrics {
  totalGenerations: number
  completedGenerations: number
  failedGenerations: number
  successRate: number
  averageDuration?: number
}

interface Generation {
  id: string
  prompt: string
  status: string
  createdAt: string
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [generations, setGenerations] = useState<Generation[]>([])
  const [prompt, setPrompt] = useState('')
  const [mode, setMode] = useState('balanced')
  const [submitting, setSubmitting] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<any>(null)

  useEffect(() => { if (isLoaded && !user) router.push('/sign-in') }, [isLoaded, user, router])

  useEffect(() => {
    fetch('/api/metrics').then(r => r.json()).then(d => { if (!d.error) setMetrics(d) }).catch(() => {})
    fetch('/api/generations').then(r => r.json()).then(d => { if (Array.isArray(d)) setGenerations(d) }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedId) { setDetail(null); return }
    fetch(`/api/generations/${selectedId}`).then(r => r.json()).then(setDetail).catch(() => {})
  }, [selectedId])

  const handleGenerate = async () => {
    if (!prompt.trim() || submitting) return
    setSubmitting(true)
    try {
      const r = await fetch('/api/compile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, mode }) })
      const d = await r.json()
      if (d.jobId) { setSelectedId(d.jobId); setPrompt(''); fetch('/api/generations').then(r => r.json()).then(d => { if (Array.isArray(d)) setGenerations(d) }) }
    } catch {} finally { setSubmitting(false) }
  }

  if (!isLoaded) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}><p style={{ color:'var(--text-muted)' }}>Loading...</p></div>

  const cards = [
    { label:'Total Compilations', value: metrics ? String(metrics.totalGenerations) : '—', sub:`${metrics?.completedGenerations ?? 0} completed` },
    { label:'Success Rate', value: metrics ? `${metrics.successRate.toFixed(0)}%` : '—', sub:`${metrics?.failedGenerations ?? 0} failed`, accent: true },
    { label:'Avg Latency', value: metrics ? `${((metrics.averageDuration ?? 0) / 1000).toFixed(1)}s` : '—', sub:'per generation' },
    { label:'Repairs Made', value: metrics ? '0' : '—', sub:'auto-fixed' },
  ]

  return (
    <div>
      {/* Nav */}
      <nav style={{ position:'fixed', top:0, width:'100%', height:48, zIndex:50, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'rgba(9,9,11,0.85)', backdropFilter:'blur(12px)', borderBottom:'1px solid var(--border)' }}>
        <Link href="/" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none' }}>
          <div style={{ width:28, height:28, borderRadius:6, background:'var(--fill-accent)', display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ color:'#fff', fontFamily:'var(--font-mono)', fontSize:11, fontWeight:700 }}>AF</span></div>
          <span style={{ color:'var(--text-primary)', fontWeight:600, fontSize:14 }}>AppForge</span>
        </Link>
        <div style={{ display:'flex', gap:24 }}>
          <Link href="/compiler" style={{ color:'var(--text-secondary)', fontSize:13, textDecoration:'none' }}>Compiler</Link>
          <Link href="/demo" style={{ color:'var(--text-secondary)', fontSize:13, textDecoration:'none' }}>Examples</Link>
          <Link href="/dashboard" style={{ color:'var(--text-primary)', fontSize:13, textDecoration:'none' }}>Dashboard</Link>
        </div>
        <div />
      </nav>

      <div style={{ paddingTop:48+32, maxWidth:1100, margin:'0 auto', padding:'80px 24px 48px' }}>
        {/* Header */}
        <div style={{ marginBottom:32 }}>
          <h1 style={{ fontSize:24, fontWeight:700, color:'var(--text-primary)', margin:0 }}>Dashboard</h1>
          <p style={{ fontSize:13, color:'var(--text-muted)', margin:'4px 0 0' }}>Your compilation stats and history</p>
        </div>

        {/* Stat cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16, marginBottom:40 }}>
          {cards.map((c) => (
            <div key={c.label} style={{ padding:20, borderRadius:'var(--radius)', border:'1px solid var(--border)', background:'var(--surface-1)' }}>
              <p style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', margin:0 }}>{c.label}</p>
              <p style={{ fontSize:28, fontWeight:700, color: c.accent ? 'var(--text-success)' : 'var(--text-primary)', margin:'8px 0 4px', letterSpacing:'-0.02em' }}>{c.value}</p>
              <p style={{ fontSize:11, color:'var(--text-muted)', margin:0 }}>{c.sub}</p>
            </div>
          ))}
        </div>

        {/* Two columns */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:24, alignItems:'start' }}>
          {/* Left: form + detail */}
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <div style={{ background:'var(--surface-1)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:24 }}>
              <p style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 12px' }}>New Compilation</p>
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your application..."
                style={{ width:'100%', minHeight:100, background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:12, fontSize:13, color:'var(--text-primary)', fontFamily:'var(--font-mono)', resize:'none', outline:'none', lineHeight:'1.6', marginBottom:12 }}
              />
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <select value={mode} onChange={(e) => setMode(e.target.value)}
                  style={{ height:36, background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'0 10px', fontSize:12, color:'var(--text-primary)', fontFamily:'var(--font-mono)', cursor:'pointer' }}>
                  <option value="balanced">Balanced</option>
                  <option value="fast">Fast</option>
                  <option value="precise">Precise</option>
                </select>
                <button onClick={handleGenerate} disabled={submitting || !prompt.trim()}
                  style={{ flex:1, height:36, background:'var(--fill-accent)', color:'#fff', border:'none', borderRadius:'var(--radius)', fontSize:13, fontWeight:600, cursor:'pointer', opacity: submitting || !prompt.trim() ? 0.4 : 1 }}>
                  {submitting ? 'Compiling...' : 'Generate'}
                </button>
              </div>
            </div>

            {detail && (
              <div style={{ background:'var(--surface-1)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:24 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:16 }}>
                  <div>
                    <h3 style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)', margin:0 }}>{detail.config?.metadata?.name || 'Generation'}</h3>
                    <p style={{ fontSize:11, color:'var(--text-muted)', margin:'4px 0 0' }}>{detail.config?.metadata?.description}</p>
                  </div>
                  <span style={{ fontSize:10, padding:'2px 8px', borderRadius:999, fontFamily:'var(--font-mono)', background:'var(--bg-success)', color:'var(--text-success)' }}>compiled</span>
                </div>
                <pre style={{ background:'var(--surface-2)', padding:16, borderRadius:'var(--radius)', fontSize:11, overflow:'auto', maxHeight:300, color:'var(--text-secondary)', border:'1px solid var(--border)', fontFamily:'var(--font-mono)', lineHeight:'1.7', margin:0 }}>
                  {JSON.stringify(detail.config, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Right: history */}
          <div style={{ background:'var(--surface-1)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:20, position:'sticky', top:80 }}>
            <p style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 16px' }}>History</p>
            {generations.length === 0 ? (
              <p style={{ fontSize:12, color:'var(--text-muted)', textAlign:'center', padding:'24px 0' }}>No generations yet</p>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:500, overflow:'auto' }}>
                {generations.map((g) => (
                  <button key={g.id} onClick={() => setSelectedId(g.id)} style={{
                    width:'100%', textAlign:'left', padding:12, borderRadius:'var(--radius)', border:'1px solid',
                    borderColor: selectedId === g.id ? 'var(--fill-accent)' : 'var(--border)',
                    background: selectedId === g.id ? 'var(--fill-accent-subtle)' : 'var(--surface-2)',
                    cursor:'pointer',
                  }}>
                    <p style={{ fontSize:12, fontFamily:'var(--font-mono)', color:'var(--text-primary)', margin:0, lineHeight:'1.5', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {g.prompt.length > 50 ? g.prompt.slice(0, 50) + '...' : g.prompt}
                    </p>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:6 }}>
                      <span style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>{new Date(g.createdAt).toLocaleDateString()}</span>
                      <span style={{ fontSize:10, padding:'1px 6px', borderRadius:999, fontFamily:'var(--font-mono)',
                        background: ['completed','success'].includes(g.status) ? 'var(--bg-success)' : g.status === 'pending' ? 'var(--bg-warning)' : 'var(--bg-danger)',
                        color: ['completed','success'].includes(g.status) ? 'var(--text-success)' : g.status === 'pending' ? 'var(--text-warning)' : 'var(--text-danger)',
                      }}>{g.status}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
