'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Reveal } from '@/components/ui/motion'

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
    setCopied(true)
    toast.success('Output copied')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative">
      <div className="absolute inset-x-0 top-0 h-64 aurora opacity-40 pointer-events-none" aria-hidden />
      <div className="relative max-w-[1100px] mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Header */}
        <Reveal>
          <p className="font-mono text-[10px] text-accent/80 uppercase tracking-[0.2em] m-0 mb-2">Examples</p>
          <h1 className="text-2xl md:text-3xl font-bold text-forge-50 m-0 mb-2 tracking-tight">Pre-compiled outputs</h1>
          <p className="text-sm text-forge-400 m-0 mb-8">Real outputs from the compiler. No cherry-picking.</p>
        </Reveal>

        {/* Tabs */}
        <Reveal delay={60} className="flex gap-1.5 mb-6 flex-wrap" >
          <div className="flex gap-1.5 flex-wrap" role="tablist" aria-label="Example outputs">
            {DEMOS.map((d, i) => (
              <button
                key={d.label}
                type="button"
                onClick={() => setSelected(i)}
                role="tab"
                aria-selected={selected === i}
                aria-controls="demo-output"
                className={`px-4 py-2 rounded-xl text-[12.5px] font-mono cursor-pointer border transition-all ${
                  selected === i
                    ? 'bg-accent text-forge-950 border-accent'
                    : 'bg-forge-900/60 text-forge-300 border-white/[0.07] hover:bg-forge-800 hover:text-forge-100'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Split view */}
        <Reveal delay={100}>
          <div className="grid grid-cols-1 md:grid-cols-2 rounded-2xl overflow-hidden border border-white/[0.07] bg-forge-950/40">
            {/* Input */}
            <div className="p-6 border-b md:border-b-0 md:border-r border-white/[0.06]">
              <p className="font-mono text-[10px] text-forge-500 uppercase tracking-[0.12em] m-0 mb-4">Prompt</p>
              <p className="text-[13px] text-forge-200 font-mono leading-relaxed m-0">&quot;{demo.prompt}&quot;</p>

              <Link
                href={`/compiler?prompt=${encodeURIComponent(demo.prompt)}`}
                className="group inline-flex items-center gap-1.5 mt-5 px-3 py-1.5 rounded-lg bg-accent-subtle border border-accent/20 text-accent-hover text-[11.5px] font-medium no-underline hover:bg-accent/15 transition-colors"
              >
                Try this prompt
                <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>

              <div className="mt-6 pt-5 border-t border-white/[0.06]">
                <p className="font-mono text-[10px] text-forge-500 uppercase tracking-[0.12em] m-0 mb-3">Result</p>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11.5px] font-mono">
                  <span className="text-success">✓ {demo.output.validation?.score}/100</span>
                  <span className="text-forge-400">{demo.output.database?.tables?.length || 0} tables</span>
                  <span className="text-forge-400">{demo.output.api?.endpoints?.length || 0} endpoints</span>
                </div>
              </div>
            </div>

            {/* Output */}
            <div id="demo-output" role="tabpanel" className="bg-forge-900/50 p-6 overflow-auto max-h-[600px]">
              <div className="flex justify-between items-center mb-4">
                <p className="font-mono text-[10px] text-forge-500 uppercase tracking-[0.12em] m-0">Output</p>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 text-[10.5px] font-mono text-forge-400 bg-transparent border-none cursor-pointer hover:text-forge-200 transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="text-[11.5px] font-mono text-forge-300 leading-6 m-0 whitespace-pre-wrap">
                {JSON.stringify(demo.output, null, 2)}
              </pre>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  )
}
