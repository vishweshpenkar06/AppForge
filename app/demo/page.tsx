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
        intent: { appType: 'crm', primaryFeatures: ['authentication', 'contacts', 'dashboard', 'payments', 'analytics'], userRoles: ['admin', 'user'], authRequired: true, paymentRequired: true, dataModels: ['users', 'contacts', 'deals'], complexities: ['role-based access', 'premium gating'], assumptions: ['Contact refers to a contacts management entity', 'Premium plan includes advanced analytics'] },
        database: { tables: [
          { name: 'users', columns: [{ name: 'id', type: 'uuid', required: true, primary_key: true }, { name: 'email', type: 'text', required: true }, { name: 'role', type: 'text', required: true }, { name: 'createdAt', type: 'timestamptz', required: true }] },
          { name: 'contacts', columns: [{ name: 'id', type: 'uuid', required: true, primary_key: true }, { name: 'name', type: 'text', required: true }, { name: 'email', type: 'text', required: false }, { name: 'userId', type: 'uuid', required: true, foreign_key: { table: 'users', column: 'id' } }, { name: 'createdAt', type: 'timestamptz', required: true }] },
          { name: 'deals', columns: [{ name: 'id', type: 'uuid', required: true, primary_key: true }, { name: 'title', type: 'text', required: true }, { name: 'value', type: 'decimal', required: true }, { name: 'contactId', type: 'uuid', required: true, foreign_key: { table: 'contacts', column: 'id' } }, { name: 'createdAt', type: 'timestamptz', required: true }] },
        ] },
        api: { endpoints: [
          { method: 'GET', route: '/api/contacts', description: 'List contacts', response: { contacts: 'array' }, auth_required: true, roles_allowed: ['admin', 'user'] },
          { method: 'POST', route: '/api/contacts', description: 'Create contact', requestBody: { name: { type: 'text', required: true }, email: { type: 'text', required: false } }, response: { contact: 'object' }, auth_required: true, roles_allowed: ['admin', 'user'] },
          { method: 'GET', route: '/api/deals', description: 'List deals', response: { deals: 'array' }, auth_required: true, roles_allowed: ['admin'] },
          { method: 'POST', route: '/api/deals', description: 'Create deal', requestBody: { title: { type: 'text', required: true }, value: { type: 'number', required: true } }, response: { deal: 'object' }, auth_required: true, roles_allowed: ['admin'] },
        ] },
        ui: { pages: [
          { id: 'dashboard', name: 'Dashboard', route: '/dashboard', layout: 'dashboard', components: [{ type: 'card', fields: [] }, { type: 'chart', fields: [] }], access: ['admin', 'user'] },
          { id: 'contacts', name: 'Contacts', route: '/contacts', layout: 'sidebar', components: [{ type: 'table', fields: [{ name: 'name', type: 'text', required: true }, { name: 'email', type: 'email', required: false }] }, { type: 'form', fields: [{ name: 'name', type: 'text', required: true }, { name: 'email', type: 'email', required: false }] }], access: ['admin', 'user'] },
          { id: 'deals', name: 'Deals', route: '/deals', layout: 'sidebar', components: [{ type: 'table', fields: [{ name: 'title', type: 'text', required: true }, { name: 'value', type: 'number', required: true }] }], access: ['admin'] },
          { id: 'analytics', name: 'Analytics', route: '/analytics', layout: 'dashboard', components: [{ type: 'chart', fields: [] }], access: ['admin'] },
        ] },
        auth: { provider: 'clerk', roles: [
          { name: 'admin', permissions: ['create', 'read', 'update', 'delete'], can_access_pages: ['Dashboard', 'Contacts', 'Deals', 'Analytics'], can_call_endpoints: ['GET /api/contacts', 'POST /api/contacts', 'GET /api/deals', 'POST /api/deals'], premium_required: false, can_perform: ['create', 'read', 'update', 'delete'] },
          { name: 'user', permissions: ['read', 'create'], can_access_pages: ['Dashboard', 'Contacts'], can_call_endpoints: ['GET /api/contacts', 'POST /api/contacts'], premium_required: true, can_perform: ['read', 'create'] },
        ], session_strategy: 'jwt', token_expiry: '24h', refresh_token: true, premium_gates: [{ feature: 'advanced_analytics', required_plan: 'pro', fallback_behavior: 'paywall' }], user_flows: [
          { role: 'admin', flow_name: 'admin_main_flow', steps: ['Login', 'Dashboard', 'View Analytics', 'Manage Contacts', 'Manage Deals'] },
          { role: 'user', flow_name: 'user_main_flow', steps: ['Login', 'Dashboard', 'View Contacts', 'Create Contact'] },
        ] },
      },
      validation: { valid: true, errors: [], warnings: [], repairs: [], score: 100 },
      execution: { executable: true, issues: [], readyForDeployment: true },
      runtime: {
        sql: `CREATE TABLE IF NOT EXISTS "users" (\n  "id" TEXT PRIMARY KEY NOT NULL,\n  "email" TEXT NOT NULL,\n  "role" TEXT NOT NULL,\n  "createdAt" TEXT NOT NULL\n);\n\nCREATE TABLE IF NOT EXISTS "contacts" (\n  "id" TEXT PRIMARY KEY NOT NULL,\n  "name" TEXT NOT NULL,\n  "email" TEXT,\n  "userId" TEXT NOT NULL,\n  "createdAt" TEXT NOT NULL,\n  FOREIGN KEY ("userId") REFERENCES "users"("id")\n);\n\nCREATE TABLE IF NOT EXISTS "deals" (\n  "id" TEXT PRIMARY KEY NOT NULL,\n  "title" TEXT NOT NULL,\n  "value" REAL NOT NULL,\n  "contactId" TEXT NOT NULL,\n  "createdAt" TEXT NOT NULL,\n  FOREIGN KEY ("contactId") REFERENCES "contacts"("id")\n);`,
        express: `const express = require('express');\nconst jwt = require('jsonwebtoken');\nconst app = express();\napp.use(express.json());\n\nconst JWT_SECRET = process.env.JWT_SECRET || 'change-me';\n\nfunction requireAuth(req, res, next) {\n  const token = req.headers.authorization?.split(' ')[1];\n  if (!token) return res.status(401).json({ error: 'Unauthorized' });\n  try { req.user = jwt.verify(token, JWT_SECRET); next(); }\n  catch { res.status(401).json({ error: 'Invalid token' }); }\n}\n\napp.get('/api/v1/contacts', requireAuth, async (req, res) => {\n  // TODO: implement List contacts\n  res.json({ success: true, data: null });\n});\n\napp.post('/api/v1/contacts', requireAuth, async (req, res) => {\n  // TODO: implement Create contact\n  res.json({ success: true, data: null });\n});\n\nconst PORT = process.env.PORT || 3001;\napp.listen(PORT, () => console.log('Server running on port ' + PORT));`,
        react: {
          'App.jsx': "import { BrowserRouter, Routes, Route } from 'react-router-dom';\nimport DashboardPage from './pages/Dashboard';\nimport ContactsPage from './pages/Contacts';\n\nexport default function App() {\n  return (\n    <BrowserRouter>\n      <Routes>\n        <Route path=\"/dashboard\" element={<DashboardPage />} />\n        <Route path=\"/contacts\" element={<ContactsPage />} />\n      </Routes>\n    </BrowserRouter>\n  );}",
          'pages/Dashboard.jsx': "export default function DashboardPage() {\n  return <div className=\"page dashboard\"><h1>Dashboard</h1></div>\n}",
          'pages/Contacts.jsx': "export default function ContactsPage() {\n  return <div className=\"page sidebar\"><h1>Contacts</h1></div>\n}",
        },
      },
      metrics: { latency: 8500, stageTimes: { 'intent-extraction': 1200, 'system-design': 1800, 'schema-generation': 2100, refinement: 1400, 'validation-repair': 1000, export: 1000 } },
    },
  },
  {
    label: 'LMS Platform',
    prompt: 'Build an LMS with courses, lessons, quizzes, student progress tracking, and instructor dashboards.',
    output: {
      success: true,
      config: {
        metadata: { name: 'Course App', description: 'Generated content blueprint with 5 pages and 8 endpoints.' },
        intent: { appType: 'content', primaryFeatures: ['courses', 'lessons', 'quizzes', 'progress_tracking', 'instructor_dashboard'], userRoles: ['instructor', 'student'], authRequired: true, paymentRequired: false, dataModels: ['courses', 'lessons', 'quizzes', 'progress'] },
        database: { tables: [
          { name: 'courses', columns: [{ name: 'id', type: 'uuid', required: true, primary_key: true }, { name: 'title', type: 'text', required: true }, { name: 'description', type: 'text', required: false }, { name: 'instructorId', type: 'uuid', required: true }, { name: 'createdAt', type: 'timestamptz', required: true }] },
          { name: 'lessons', columns: [{ name: 'id', type: 'uuid', required: true, primary_key: true }, { name: 'title', type: 'text', required: true }, { name: 'content', type: 'text', required: true }, { name: 'courseId', type: 'uuid', required: true, foreign_key: { table: 'courses', column: 'id' } }, { name: 'order', type: 'integer', required: true }, { name: 'createdAt', type: 'timestamptz', required: true }] },
          { name: 'quizzes', columns: [{ name: 'id', type: 'uuid', required: true, primary_key: true }, { name: 'title', type: 'text', required: true }, { name: 'questions', type: 'jsonb', required: true }, { name: 'lessonId', type: 'uuid', required: true, foreign_key: { table: 'lessons', column: 'id' } }, { name: 'createdAt', type: 'timestamptz', required: true }] },
          { name: 'progress', columns: [{ name: 'id', type: 'uuid', required: true, primary_key: true }, { name: 'studentId', type: 'uuid', required: true }, { name: 'lessonId', type: 'uuid', required: true, foreign_key: { table: 'lessons', column: 'id' } }, { name: 'completed', type: 'boolean', required: true }, { name: 'score', type: 'integer', required: false }, { name: 'createdAt', type: 'timestamptz', required: true }] },
        ] },
        api: { endpoints: [
          { method: 'GET', route: '/api/courses', description: 'List courses', response: { courses: 'array' }, auth_required: true, roles_allowed: ['instructor', 'student'] },
          { method: 'POST', route: '/api/courses', description: 'Create course', requestBody: { title: { type: 'text', required: true } }, response: { course: 'object' }, auth_required: true, roles_allowed: ['instructor'] },
          { method: 'GET', route: '/api/lessons', description: 'List lessons', response: { lessons: 'array' }, auth_required: true, roles_allowed: ['instructor', 'student'] },
          { method: 'GET', route: '/api/quizzes', description: 'List quizzes', response: { quizzes: 'array' }, auth_required: true, roles_allowed: ['instructor', 'student'] },
          { method: 'GET', route: '/api/progress', description: 'List progress', response: { progress: 'array' }, auth_required: true, roles_allowed: ['instructor', 'student'] },
        ] },
        ui: { pages: [
          { id: 'dashboard', name: 'Dashboard', route: '/dashboard', layout: 'dashboard', components: [{ type: 'card', fields: [] }], access: ['instructor', 'student'] },
          { id: 'courses', name: 'Courses', route: '/courses', layout: 'sidebar', components: [{ type: 'table', fields: [{ name: 'title', type: 'text', required: true }] }], access: ['instructor', 'student'] },
          { id: 'lessons', name: 'Lessons', route: '/courses/:id/lessons', layout: 'sidebar', components: [{ type: 'list', fields: [{ name: 'title', type: 'text', required: true }] }], access: ['instructor', 'student'] },
          { id: 'quizzes', name: 'Quizzes', route: '/quizzes', layout: 'sidebar', components: [{ type: 'form', fields: [{ name: 'answers', type: 'text', required: true }] }], access: ['student'] },
          { id: 'instructor', name: 'Instructor Dashboard', route: '/instructor', layout: 'dashboard', components: [{ type: 'chart', fields: [] }], access: ['instructor'] },
        ] },
        auth: { provider: 'clerk', roles: [
          { name: 'instructor', permissions: ['create', 'read', 'update', 'delete'], can_access_pages: ['Dashboard', 'Courses', 'Lessons', 'Instructor Dashboard'], can_call_endpoints: ['GET /api/courses', 'POST /api/courses', 'GET /api/lessons', 'GET /api/progress'], premium_required: false, can_perform: ['create', 'read', 'update', 'delete'] },
          { name: 'student', permissions: ['read', 'create'], can_access_pages: ['Dashboard', 'Courses', 'Lessons', 'Quizzes'], can_call_endpoints: ['GET /api/courses', 'GET /api/lessons', 'GET /api/quizzes', 'GET /api/progress'], premium_required: false, can_perform: ['read', 'create'] },
        ], session_strategy: 'jwt', token_expiry: '24h', refresh_token: true, premium_gates: [], user_flows: [
          { role: 'instructor', flow_name: 'instructor_flow', steps: ['Login', 'Dashboard', 'Create Course', 'Add Lessons', 'View Student Progress'] },
          { role: 'student', flow_name: 'student_flow', steps: ['Login', 'Dashboard', 'Browse Courses', 'Take Lessons', 'Complete Quizzes'] },
        ] },
      },
      validation: { valid: true, errors: [], warnings: [], repairs: [], score: 100 },
      execution: { executable: true, issues: [], readyForDeployment: true },
      runtime: { sql: '-- See CRM example for SQL pattern', express: '// See CRM example for Express pattern', react: {} },
      metrics: { latency: 9200, stageTimes: { 'intent-extraction': 1100, 'system-design': 2000, 'schema-generation': 2400, refinement: 1500, 'validation-repair': 1200, export: 1000 } },
    },
  },
  {
    label: 'Edge Case: Vague',
    prompt: 'Build an app',
    output: {
      success: true,
      config: {
        metadata: { name: 'Item App', description: 'Generated crud blueprint with 2 pages and 2 endpoints.' },
        intent: { appType: 'crud', primaryFeatures: ['basic_crud'], userRoles: ['user'], authRequired: false, paymentRequired: false, dataModels: ['items'], complexities: [], assumptions: ['Fallback intent parser used because model output was not valid JSON', 'Assumed basic CRUD application due to minimal input'] },
        database: { tables: [{ name: 'items', columns: [{ name: 'id', type: 'uuid', required: true, primary_key: true }, { name: 'createdAt', type: 'timestamptz', required: true }] }] },
        api: { endpoints: [{ method: 'GET', route: '/api/items', description: 'List items', response: { items: 'array' }, auth_required: false, roles_allowed: ['user'] }] },
        ui: { pages: [{ id: 'home', name: 'Home', route: '/', layout: 'blank', components: [{ type: 'card', fields: [] }], access: ['user'] }, { id: 'dashboard', name: 'Dashboard', route: '/dashboard', layout: 'dashboard', components: [{ type: 'card', fields: [] }], access: ['user'] }] },
        auth: { provider: 'clerk', roles: [{ name: 'user', permissions: ['read'], can_access_pages: ['Home', 'Dashboard'], can_call_endpoints: ['GET /api/items'], premium_required: false, can_perform: ['read'] }], session_strategy: 'jwt', token_expiry: '24h', refresh_token: true, premium_gates: [], user_flows: [{ role: 'user', flow_name: 'user_main_flow', steps: ['Login', 'Dashboard', 'View Data', 'Create Record', 'Edit Profile'] }] },
      },
      validation: { valid: true, errors: [], warnings: [], repairs: ['Added id column to table items', 'Added createdAt column to table items'], score: 90 },
      execution: { executable: true, issues: [], readyForDeployment: false },
      runtime: { sql: 'CREATE TABLE IF NOT EXISTS "items" (\n  "id" TEXT PRIMARY KEY NOT NULL,\n  "createdAt" TEXT NOT NULL\n);', express: 'const express = require(\'express\');\nconst app = express();\napp.use(express.json());\napp.get(\'/api/v1/items\', async (req, res) => {\n  res.json({ success: true, data: null });\n});\nconst PORT = process.env.PORT || 3001;\napp.listen(PORT, () => console.log(\'Server running on port \' + PORT));', react: {} },
      metrics: { latency: 3200, stageTimes: { 'intent-extraction': 400, 'system-design': 600, 'schema-generation': 800, refinement: 500, 'validation-repair': 400, export: 500 } },
    },
  },
]

export default function DemoPage() {
  const [selected, setSelected] = useState(0)
  const [activeTab, setActiveTab] = useState('config')
  const [copied, setCopied] = useState(false)

  const demo = DEMO_CASES[selected]

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(demo.output, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight">AppForge — Live Examples</h1>
          <p className="mt-2 text-zinc-400">Pre-generated outputs. Use the <a href="/compiler" className="text-sky-400 hover:underline">compiler</a> to run your own prompt.</p>
        </div>

        <div className="flex gap-2">
          {DEMO_CASES.map((c, i) => (
            <button
              key={i}
              onClick={() => { setSelected(i); setActiveTab('config') }}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                selected === i
                  ? 'bg-white text-black border-white'
                  : 'bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wide">Input Prompt</p>
          <p className="text-sm text-zinc-300">{demo.prompt}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0b0d12] p-1">
          <div className="flex items-center gap-1 px-2 pt-2">
            {['config', 'sql', 'express', 'validation'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  activeTab === tab ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
            <button
              onClick={handleCopy}
              className="ml-auto flex items-center gap-1 px-2 py-1 rounded text-xs text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
            >
              {copied ? '✓ Copied' : 'Copy JSON'}
            </button>
          </div>

          <div className="p-4">
            {activeTab === 'config' && (
              <pre className="text-xs text-emerald-300/80 overflow-auto max-h-[500px] whitespace-pre-wrap font-mono">
                {JSON.stringify(demo.output.config, null, 2)}
              </pre>
            )}
            {activeTab === 'sql' && (
              <pre className="text-xs text-emerald-300/80 overflow-auto max-h-[500px] whitespace-pre-wrap font-mono">
                {demo.output.runtime?.sql || '-- No SQL generated'}
              </pre>
            )}
            {activeTab === 'express' && (
              <pre className="text-xs text-amber-300/80 overflow-auto max-h-[500px] whitespace-pre-wrap font-mono">
                {demo.output.runtime?.express || '// No Express server generated'}
              </pre>
            )}
            {activeTab === 'validation' && (
              <div className="space-y-3">
                <div className={`px-3 py-2 rounded text-sm inline-block ${demo.output.validation?.valid ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}>
                  {demo.output.validation?.valid ? 'VALID' : 'INVALID'} — Score: {demo.output.validation?.score}/100
                </div>
                {demo.output.validation?.repairs && demo.output.validation.repairs.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-emerald-400 mb-1">Repairs:</p>
                    {demo.output.validation.repairs.map((r: string, i: number) => (
                      <p key={i} className="text-xs text-emerald-300">✓ {r}</p>
                    ))}
                  </div>
                )}
                <pre className="text-xs text-zinc-400 overflow-auto max-h-[300px] whitespace-pre-wrap font-mono">
                  {JSON.stringify({ validation: demo.output.validation, execution: demo.output.execution, metrics: demo.output.metrics }, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
