'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const STAGES = [
  { n: '01', label: 'Intent', desc: 'Parse the goal' },
  { n: '02', label: 'Design', desc: 'Define entities' },
  { n: '03', label: 'Schemas', desc: 'DB + API + UI' },
  { n: '04', label: 'Refine', desc: 'Cross-validate' },
  { n: '05', label: 'Repair', desc: 'Auto-fix errors' },
  { n: '06', label: 'Export', desc: 'Ready to ship' },
]

export default function Page() {
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isSignedIn) router.replace('/dashboard')
  }, [isLoaded, isSignedIn, router])

  return (
    <main>
      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav style={{
        position:'fixed', top:0, width:'100%', height:48, zIndex:50,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 24px',
        background:'rgba(9,9,11,0.85)', backdropFilter:'blur(12px)',
        borderBottom:'1px solid var(--border)',
      }}>
        <Link href="/" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none' }}>
          <div style={{ width:28, height:28, borderRadius:6, background:'var(--fill-accent)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ color:'#fff', fontFamily:'var(--font-mono)', fontSize:11, fontWeight:700 }}>AF</span>
          </div>
          <span style={{ color:'var(--text-primary)', fontWeight:600, fontSize:14 }}>AppForge</span>
        </Link>
        <div style={{ display:'flex', gap:24 }}>
          <Link href="/compiler" style={{ color:'var(--text-secondary)', fontSize:13, textDecoration:'none' }}>Compiler</Link>
          <Link href="/demo" style={{ color:'var(--text-secondary)', fontSize:13, textDecoration:'none' }}>Examples</Link>
          <Link href="/dashboard" style={{ color:'var(--text-secondary)', fontSize:13, textDecoration:'none' }}>Dashboard</Link>
        </div>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <Link href="/sign-in" style={{ color:'var(--text-secondary)', fontSize:13, textDecoration:'none' }}>Sign in</Link>
          <Link href="/compiler" style={{
            background:'var(--fill-accent)', color:'#fff', borderRadius:'var(--radius)',
            padding:'6px 14px', fontSize:13, fontWeight:500, textDecoration:'none',
          }}>Get started</Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section style={{ paddingTop:120, paddingBottom:64, textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'8%', left:'50%', transform:'translateX(-50%)', width:600, height:350, background:'radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 70%)', pointerEvents:'none' }} />

        <div style={{ maxWidth:700, margin:'0 auto', position:'relative' }}>
          {/* Eyebrow */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'4px 12px', borderRadius:999, border:'1px solid var(--border)', background:'var(--surface-1)', marginBottom:32 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--fill-accent)', animation:'pulse-dot 2s ease-in-out infinite' }} />
            <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Natural language compiler</span>
          </div>

          <h1 style={{ fontSize:52, fontWeight:700, lineHeight:'1.08', letterSpacing:'-0.02em', color:'var(--text-primary)', marginBottom:20 }}>
            Your product spec,<br />
            <span style={{ color:'var(--text-accent)' }}>machine-readable.</span>
          </h1>

          <p style={{ fontSize:16, color:'var(--text-secondary)', lineHeight:'1.6', maxWidth:520, margin:'0 auto 36px' }}>
            Describe what you&apos;re building. AppForge runs it through a 6-stage compiler and returns a validated database schema, API layer, component tree, and auth config — ready to ship.
          </p>

          <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
            <Link href="/compiler" style={{ background:'var(--fill-accent)', color:'#fff', borderRadius:'var(--radius)', padding:'10px 24px', fontSize:14, fontWeight:500, textDecoration:'none' }}>Open compiler →</Link>
            <Link href="/demo" style={{ background:'transparent', color:'var(--text-secondary)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'10px 24px', fontSize:14, fontWeight:500, textDecoration:'none' }}>See examples</Link>
          </div>

          <p style={{ marginTop:20, fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)' }}>No credit card · Free tier · NVIDIA NIM powered</p>
        </div>
      </section>

      {/* ── Pipeline Strip ──────────────────────────────────────── */}
      <section style={{ padding:'48px 24px', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <p style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', textAlign:'center', marginBottom:40 }}>Compilation pipeline</p>
          <div style={{ display:'flex', justifyContent:'space-between', position:'relative' }}>
            <div style={{ position:'absolute', top:20, left:0, right:0, height:1, background:'var(--border)' }} />
            <div style={{ position:'absolute', top:20, left:0, height:1, width:80, background:'linear-gradient(90deg, transparent, var(--fill-accent), transparent)' }} className="pipeline-beam" />
            {STAGES.map((s) => (
              <div key={s.n} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, position:'relative', zIndex:1 }}>
                <div style={{ width:40, height:40, borderRadius:'50%', border:'1px solid var(--fill-accent)', background:'var(--surface-2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-accent)', fontWeight:500 }}>{s.n}</span>
                </div>
                <div style={{ textAlign:'center' }}>
                  <p style={{ fontSize:13, color:'var(--text-primary)', fontWeight:500, margin:0 }}>{s.label}</p>
                  <p style={{ fontSize:11, color:'var(--text-muted)', margin:'2px 0 0' }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Metrics ─────────────────────────────────────────────── */}
      <section style={{ padding:'48px 24px' }}>
        <div style={{ maxWidth:700, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:32 }}>
          {[
            { v:'6', l:'Pipeline stages', s:'with Zod validation' },
            { v:'7', l:'Cross-layer invariants', s:'enforced on every compile' },
            { v:'20', l:'Eval test cases', s:'real products + edge cases' },
          ].map((m) => (
            <div key={m.v} style={{ textAlign:'center' }}>
              <p style={{ fontSize:44, fontWeight:700, color:'var(--text-primary)', letterSpacing:'-0.02em', margin:0 }}>{m.v}</p>
              <p style={{ fontSize:13, color:'var(--text-secondary)', margin:'8px 0 4px' }}>{m.l}</p>
              <p style={{ fontSize:11, color:'var(--text-muted)', margin:0 }}>{m.s}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section style={{ padding:'48px 24px' }}>
        <div style={{ maxWidth:900, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16 }}>
          {[
            { icon:'⬡', title:'Multi-stage pipeline', body:'Six distinct stages with typed contracts. Each validates its input before running.' },
            { icon:'⚡', title:'Auto-repair engine', body:"Broken schemas get fixed automatically — missing FK, wrong types, orphaned references." },
            { icon:'◈', title:'Execution-ready output', body:'Get a Prisma schema, Express server with JWT auth, and React component tree.' },
          ].map((f) => (
            <div key={f.title} style={{ background:'var(--surface-1)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:24, transition:'border-color 0.2s' }}>
              <p style={{ fontSize:20, color:'var(--text-accent)', margin:'0 0 16px' }}>{f.icon}</p>
              <h3 style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)', margin:'0 0 8px' }}>{f.title}</h3>
              <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:'1.6', margin:0 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
