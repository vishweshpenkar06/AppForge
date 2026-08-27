'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Hero from '@/components/Hero'

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
    if (isSignedIn) router.replace('/dashboard')
  }, [isSignedIn, router])

  if (!isLoaded) return null

  return (
    <main>
      {/* ── Hero ────────────────────────────────────────────────── */}
      <Hero />

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
            <div key={f.title} style={{ background:'var(--surface-1)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:24 }}>
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
