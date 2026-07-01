'use client'

import { useState } from 'react'

const DEMO_CASES = [
  {
    label: 'CRM System',
    prompt: 'Build a CRM with login, contacts, dashboard, role-based access, and premium plan with payments. Admins can see analytics.',
    output: {
      success: true,
      config: {
        metadata: { name: 'Contact App', description: 'Generated crm blueprint with 4 pages and 6 endpoints.' },
        intent: { appType: 'crm', primaryFeatures: ['authentication', 'contacts', 'dashboard', 'payments', 'analytics'], userRoles: ['admin', 'user'], authRequired: true, paymentRequired: true },
        database: { tables: [
          { name: 'users', columns: [{ name: 'id', type: 'uuid' }, { name: 'email', type: 'text' }, { name: 'role', type: 'text' }] },
          { name: 'contacts', columns: [{ name: 'id', type: 'uuid' }, { name: 'name', type: 'text' }, { name: 'userId', type: 'uuid' }] },
          { name: 'deals', columns: [{ name: 'id', type: 'uuid' }, { name: 'title', type: 'text' }, { name: 'value', type: 'decimal' }, { name: 'contactId', type: 'uuid' }] },
        ] },
        api: { endpoints: [
          { method: 'GET', route: '/api/contacts' },
          { method: 'POST', route: '/api/contacts' },
          { method: 'GET', route: '/api/deals' },
          { method: 'POST', route: '/api/deals' },
        ] },
      },
      validation: { valid: true, score: 100, errors: [], repairs: [] },
      execution: { executable: true, readyForDeployment: true },
      metrics: { latency: 8500 },
    },
  },
  {
    label: 'LMS Platform',
    prompt: 'Build an LMS with courses, lessons, quizzes, student progress tracking, and instructor dashboards.',
    output: {
      success: true,
      config: {
        metadata: { name: 'Course App', description: 'Generated content blueprint with 5 pages and 8 endpoints.' },
        intent: { appType: 'content', primaryFeatures: ['courses', 'lessons', 'quizzes', 'progress_tracking'], userRoles: ['instructor', 'student'], authRequired: true, paymentRequired: false },
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
          { method: 'GET', route: '/api/progress' },
        ] },
      },
      validation: { valid: true, score: 100, errors: [], repairs: [] },
      execution: { executable: true, readyForDeployment: true },
      metrics: { latency: 9200 },
    },
  },
  {
    label: 'Edge: Vague',
    prompt: 'Build an app',
    output: {
      success: true,
      config: {
        metadata: { name: 'Item App', description: 'Generated crud blueprint with 2 pages and 2 endpoints.' },
        intent: { appType: 'crud', primaryFeatures: ['basic_crud'], userRoles: ['user'], authRequired: false, paymentRequired: false, assumptions: ['Assumed basic CRUD due to minimal input'] },
        database: { tables: [{ name: 'items', columns: [{ name: 'id', type: 'uuid' }, { name: 'createdAt', type: 'timestamptz' }] }] },
        api: { endpoints: [{ method: 'GET', route: '/api/items' }] },
      },
      validation: { valid: true, score: 90, errors: [], repairs: ['Added id column', 'Added createdAt column'] },
      execution: { executable: true, readyForDeployment: false },
      metrics: { latency: 3200 },
    },
  },
]

const DEMO_TABS = ['Config', 'Validation', 'Metrics'] as const
type DemoTab = typeof DEMO_TABS[number]

export default function DemoPage() {
  const [selected, setSelected] = useState(0)
  const [activeTab, setActiveTab] = useState<DemoTab>('Config')
  const [copied, setCopied] = useState(false)
  const demo = DEMO_CASES[selected]

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(demo.output, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen pt-20">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <p className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-widest mb-3">Examples</p>
        <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Pre-compiled outputs</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-2">Real outputs from the compiler. No cherry-picking.</p>
      </div>

      {/* Demo selector */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex gap-3 mb-8 flex-wrap">
          {DEMO_CASES.map((c, i) => (
            <button key={i} onClick={() => { setSelected(i); setActiveTab('Config') }}
              className={`px-4 py-2 rounded-lg text-sm font-mono transition-all
                ${selected === i
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'border border-[var(--bg-border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}>
              {c.label}
            </button>
          ))}
        </div>

        {/* Split view */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl overflow-hidden border border-[var(--bg-border)]">
          {/* Input */}
          <div className="bg-[var(--bg-surface)] p-6">
            <p className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider mb-4">Prompt</p>
            <p className="text-sm text-[var(--text-secondary)] font-mono leading-relaxed">&quot;{demo.prompt}&quot;</p>

            {/* Validation summary */}
            <div className="mt-6 pt-6 border-t border-[var(--bg-border)]">
              <p className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider mb-3">Result</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${demo.output.validation?.valid ? 'bg-[var(--success)]' : 'bg-[var(--error)]'}`} />
                  <span className="text-xs font-mono text-[var(--text-secondary)]">
                    {demo.output.validation?.valid ? 'VALID' : 'INVALID'} — Score: {demo.output.validation?.score}/100
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${demo.output.execution?.executable ? 'bg-[var(--success)]' : 'bg-[var(--error)]'}`} />
                  <span className="text-xs font-mono text-[var(--text-secondary)]">
                    {demo.output.execution?.executable ? 'Executable' : 'Not executable'}
                  </span>
                </div>
                <p className="text-xs font-mono text-[var(--text-muted)]">
                  {demo.output.config?.database?.tables?.length || 0} tables · {demo.output.config?.api?.endpoints?.length || 0} endpoints
                </p>
              </div>
            </div>
          </div>

          {/* Output */}
          <div className="bg-[var(--bg-base)] p-6 overflow-auto max-h-[600px]">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">Output</p>
              <button onClick={handleCopy}
                className="text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 border-b border-[var(--bg-border)]">
              {DEMO_TABS.map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-[10px] font-mono border-b-2 -mb-px transition-colors
                    ${activeTab === tab ? 'border-[var(--accent-primary)] text-[var(--text-primary)]' : 'border-transparent text-[var(--text-muted)]'}`}>
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'Config' && (
              <pre className="text-xs font-mono text-[var(--text-secondary)] leading-relaxed overflow-auto max-h-[480px]">
                {JSON.stringify(demo.output.config, null, 2)}
              </pre>
            )}
            {activeTab === 'Validation' && (
              <div className="space-y-3">
                {demo.output.validation?.repairs && demo.output.validation.repairs.length > 0 && (
                  <div className="space-y-1">
                    {demo.output.validation.repairs.map((r: string, i: number) => (
                      <p key={i} className="text-xs font-mono text-[var(--accent-secondary)]">✓ {r}</p>
                    ))}
                  </div>
                )}
                <pre className="text-xs font-mono text-[var(--text-muted)] leading-relaxed">
                  {JSON.stringify({ validation: demo.output.validation, execution: demo.output.execution }, null, 2)}
                </pre>
              </div>
            )}
            {activeTab === 'Metrics' && (
              <pre className="text-xs font-mono text-[var(--text-muted)] leading-relaxed">
                {JSON.stringify(demo.output.metrics, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
