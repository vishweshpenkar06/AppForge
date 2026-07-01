'use client'

import { useState } from 'react'
import Link from 'next/link'

const DEMOS = [
  {
    label: 'CRM System',
    prompt: 'Build a CRM with login, contacts, dashboard, role-based access, and premium plan with payments. Admins can see analytics.',
    output: {
      metadata: { name: 'Contact App', description: 'Generated crm blueprint with 4 pages and 6 endpoints.' },
      intent: { appType: 'crm', primaryFeatures: ['authentication', 'contacts', 'dashboard', 'payments', 'analytics'], userRoles: ['admin', 'user'] },
      database: { tables: [
        { name: 'users', columns: [{ name: 'id', type: 'uuid' }, { name: 'email', type: 'text' }, { name: 'role', type: 'text' }] },
        { name: 'contacts', columns: [{ name: 'id', type: 'uuid' }, { name: 'name', type: 'text' }, { name: 'email', type: 'text' }, { name: 'userId', type: 'uuid' }] },
        { name: 'deals', columns: [{ name: 'id', type: 'uuid' }, { name: 'title', type: 'text' }, { name: 'value', type: 'decimal' }, { name: 'contactId', type: 'uuid' }] },
      ] },
      api: { endpoints: [
        { method: 'GET', route: '/api/contacts' },
        { method: 'POST', route: '/api/contacts' },
        { method: 'GET', route: '/api/deals' },
        { method: 'POST', route: '/api/deals' },
      ] },
      validation: { valid: true, score: 100 },
    },
  },
  {
    label: 'LMS Platform',
    prompt: 'Build an LMS with courses, lessons, quizzes, student progress tracking, and instructor dashboards.',
    output: {
      metadata: { name: 'Course App', description: 'Generated content blueprint with 5 pages and 8 endpoints.' },
      intent: { appType: 'content', primaryFeatures: ['courses', 'lessons', 'quizzes', 'progress_tracking'], userRoles: ['instructor', 'student'] },
      database: { tables: [
        { name: 'courses', columns: [{ name: 'id', type: 'uuid' }, { name: 'title', type: 'text' }, { name: 'instructorId', type: 'uuid' }] },
        { name: 'lessons', columns: [{ name: 'id', type: 'uuid' }, { name: 'title', type: 'text' }, { name: 'courseId', type: 'uuid' }] },
        { name: 'quizzes', columns: [{ name: 'id', type: 'uuid' }, { name: 'title', type: 'text' }, { name: 'lessonId', type: 'uuid' }] },
        { name: 'progress', columns: [{ name: 'id', type: 'uuid' }, { name: 'studentId', type: 'uuid' }, { name: 'completed', type: 'boolean' }] },
      ] },
      api: { endpoints: [
        { method: 'GET', route: '/api/courses' },
        { method: 'POST', route: '/api/courses' },
        { method: 'GET', route: '/api/lessons' },
        { method: 'GET', route: '/api/quizzes' },
      ] },
      validation: { valid: true, score: 100 },
    },
  },
  {
    label: 'Edge: Vague',
    prompt: 'Build an app',
    output: {
      metadata: { name: 'Item App', description: 'Generated crud blueprint with 2 pages and 2 endpoints.' },
      intent: { appType: 'crud', primaryFeatures: ['basic_crud'], userRoles: ['user'], assumptions: ['Assumed basic CRUD due to minimal input'] },
      database: { tables: [{ name: 'items', columns: [{ name: 'id', type: 'uuid' }, { name: 'createdAt', type: 'timestamptz' }] }] },
      api: { endpoints: [{ method: 'GET', route: '/api/items' }] },
      validation: { valid: true, score: 90, repairs: ['Added id column', 'Added createdAt column'] },
    },
  },
]

export default function DemoPage() {
  const [selected, setSelected] = useState(0)
  const [copied, setCopied] = useState(false)
  const demo = DEMOS[selected]

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(demo.output, null, 2))
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

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
          <Link href="/demo" style={{ color:'var(--text-primary)', fontSize:13, textDecoration:'none' }}>Examples</Link>
          <Link href="/dashboard" style={{ color:'var(--text-secondary)', fontSize:13, textDecoration:'none' }}>Dashboard</Link>
        </div>
        <div />
      </nav>

      <div style={{ paddingTop:48+48, maxWidth:1100, margin:'0 auto', padding:'96px 24px 48px' }}>
        {/* Header */}
        <p style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 8px' }}>Examples</p>
        <h1 style={{ fontSize:28, fontWeight:700, color:'var(--text-primary)', margin:'0 0 8px' }}>Pre-compiled outputs</h1>
        <p style={{ fontSize:13, color:'var(--text-secondary)', margin:'0 0 32px' }}>Real outputs from the compiler. No cherry-picking.</p>

        {/* Tabs */}
        <div style={{ display:'flex', gap:8, marginBottom:24, flexWrap:'wrap' }}>
          {DEMOS.map((d, i) => (
            <button key={i} onClick={() => setSelected(i)} style={{
              padding:'8px 16px', borderRadius:'var(--radius)', fontSize:13, fontFamily:'var(--font-mono)', cursor:'pointer', border:'none',
              background: selected === i ? 'var(--fill-accent)' : 'var(--surface-1)',
              color: selected === i ? '#fff' : 'var(--text-secondary)',
            }}>{d.label}</button>
          ))}
        </div>

        {/* Split view */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, borderRadius:'var(--radius)', overflow:'hidden', border:'1px solid var(--border)' }}>
          {/* Input */}
          <div style={{ background:'var(--surface-1)', padding:24 }}>
            <p style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 16px' }}>Prompt</p>
            <p style={{ fontSize:13, color:'var(--text-secondary)', fontFamily:'var(--font-mono)', lineHeight:'1.7', margin:0 }}>&quot;{demo.prompt}&quot;</p>

            <div style={{ marginTop:24, paddingTop:20, borderTop:'1px solid var(--border)' }}>
              <p style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 12px' }}>Result</p>
              <div style={{ display:'flex', gap:16, fontSize:12, fontFamily:'var(--font-mono)' }}>
                <span style={{ color:'var(--text-success)' }}>✓ {demo.output.validation?.score}/100</span>
                <span style={{ color:'var(--text-muted)' }}>{demo.output.database?.tables?.length || 0} tables</span>
                <span style={{ color:'var(--text-muted)' }}>{demo.output.api?.endpoints?.length || 0} endpoints</span>
              </div>
            </div>
          </div>

          {/* Output */}
          <div style={{ background:'var(--surface-0)', padding:24, overflow:'auto', maxHeight:600 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <p style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', margin:0 }}>Output</p>
              <button onClick={handleCopy} style={{ fontSize:10, fontFamily:'var(--font-mono)', color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer' }}>
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <pre style={{ fontSize:12, fontFamily:'var(--font-mono)', color:'var(--text-secondary)', lineHeight:'1.7', margin:0, whiteSpace:'pre-wrap' }}>
              {JSON.stringify(demo.output, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
