'use client'

import { useState } from 'react'

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
      <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Header */}
        <p className="font-mono text-[11px] text-forge-400 uppercase tracking-[0.1em] m-0 mb-2">Examples</p>
        <h1 className="text-2xl font-bold text-forge-50 m-0 mb-2">Pre-compiled outputs</h1>
        <p className="text-sm text-forge-300 m-0 mb-8">Real outputs from the compiler. No cherry-picking.</p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {DEMOS.map((d, i) => (
            <button key={i} onClick={() => setSelected(i)}
              className={`px-4 py-2 rounded-xl text-sm font-mono cursor-pointer border-none transition-colors
                ${selected === i ? 'bg-accent text-white' : 'bg-forge-800 text-forge-300 hover:bg-forge-700'}`}>{d.label}</button>
          ))}
        </div>

        {/* Split view */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl overflow-hidden border border-white/[0.06]">
          {/* Input */}
          <div className="bg-forge-800 p-6">
            <p className="font-mono text-[10px] text-forge-400 uppercase tracking-[0.1em] m-0 mb-4">Prompt</p>
            <p className="text-sm text-forge-300 font-mono leading-relaxed m-0">&quot;{demo.prompt}&quot;</p>

            <div className="mt-6 pt-5 border-t border-white/[0.06]">
              <p className="font-mono text-[10px] text-forge-400 uppercase tracking-[0.1em] m-0 mb-3">Result</p>
              <div className="flex gap-4 text-xs font-mono">
                <span className="text-success">✓ {demo.output.validation?.score}/100</span>
                <span className="text-forge-400">{demo.output.database?.tables?.length || 0} tables</span>
                <span className="text-forge-400">{demo.output.api?.endpoints?.length || 0} endpoints</span>
              </div>
            </div>
          </div>

          {/* Output */}
          <div className="bg-forge-900 p-6 overflow-auto max-h-[600px]">
            <div className="flex justify-between items-center mb-4">
              <p className="font-mono text-[10px] text-forge-400 uppercase tracking-[0.1em] m-0">Output</p>
              <button onClick={handleCopy}
                className="text-[10px] font-mono text-forge-400 bg-transparent border-none cursor-pointer hover:text-forge-300 transition-colors focus-visible:ring-2 focus-visible:ring-accent/40">
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <pre className="text-xs font-mono text-forge-300 leading-7 m-0 whitespace-pre-wrap">
              {JSON.stringify(demo.output, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
