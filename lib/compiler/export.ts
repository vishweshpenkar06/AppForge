import { SchemaOutput, SystemDesign } from './core'
import type { Intent } from './core'

type FileStub = {
  path: string
  content: string
}

export interface ImplementationPlan {
  summary: string
  prismaSchema: string
  apiHandlers: FileStub[]
  uiPages: FileStub[]
  rbac: Record<string, string[]>
  checklist: string[]
}

export interface PlanningDocs {
  prd: string
  trd: string
  appFlow: string
  uiUxBrief: string
  backendSchema: string
  implementationPlan: string
}

function mapTypeToPrisma(type: string) {
  const t = type.toLowerCase()
  if (t.includes('uuid')) return 'String @id @default(cuid())'
  if (t.includes('int') || t.includes('integer') || t.includes('number')) return 'Int'
  if (t.includes('bool')) return 'Boolean'
  if (t.includes('date') || t.includes('time')) return 'DateTime'
  if (t.includes('json')) return 'Json'
  return 'String'
}

function generatePrismaModel(table: any) {
  const lines: string[] = []
  const modelName = table.name[0].toUpperCase() + table.name.slice(1)
  lines.push(`model ${modelName} {`)

  // ensure id + timestamps
  const hasId = table.columns.some((c: any) => c.name === 'id')
  if (!hasId) {
    lines.push('  id String @id @default(cuid())')
  }
  const hasCreated = table.columns.some((c: any) => c.name === 'createdAt')
  if (!hasCreated) lines.push('  createdAt DateTime @default(now())')
  const hasUpdated = table.columns.some((c: any) => c.name === 'updatedAt')
  if (!hasUpdated) lines.push('  updatedAt DateTime @updatedAt')

  for (const col of table.columns) {
    if (['id', 'createdAt', 'updatedAt'].includes(col.name)) continue
    const prismaType = mapTypeToPrisma(col.type || 'string')
    const req = col.required ? '' : '?'
    lines.push(`  ${col.name} ${prismaType}${req}`)
  }

  // relationships: simple FK fields
  for (const rel of table.relationships || []) {
    const fk = `${rel}Id String?`
    lines.push(`  ${fk}`)
  }

  lines.push('}')
  return lines.join('\n')
}

function generateApiHandler(endpoint: any) {
  const method = (endpoint.method || 'GET').toUpperCase()
  const route = endpoint.path || '/api/unknown'
  const name = route.replace(/[^a-z0-9]/gi, '_').replace(/^_+|_+$/g, '') || 'handler'

  const content = `import { NextResponse } from 'next/server'

export async function ${method === 'GET' ? 'GET' : method}(request: Request) {
  // TODO: Implement handler for ${route}
  // - Validation: ${JSON.stringify(endpoint.requestSchema || {})}
  // - Response shape: ${JSON.stringify(endpoint.responseSchema || {})}
  return NextResponse.json({ message: 'Not implemented' })
}
`

  return { path: `app/api${route}/route.ts`, content }
}

function generateUiPage(page: any) {
  const route = page.route || '/'
  const path = route === '/' ? 'app/page.tsx' : `app${route}/page.tsx`
  const content = `export default function Page() {
  return (
    <main>
      <h1>${page.route} (stub)</h1>
      <p>Components: ${JSON.stringify(page.components || [])}</p>
      <p>DataSource: ${page.dataSource || 'N/A'}</p>
    </main>
  )
}
`
  return { path, content }
}

export function buildImplementationPlan(schemas: SchemaOutput, design?: SystemDesign): ImplementationPlan {
  const summary = `Concrete implementation plan for ${design?.architecture || 'app'} with ${schemas.database.tables.length} tables, ${schemas.api.endpoints.length} endpoints, and ${schemas.ui.pages.length} pages.`

  const prismaParts = schemas.database.tables.map((t) => generatePrismaModel(t))
  const prismaSchema = `generator client {\n  provider = \"prisma-client-js\"\n}\n\n datasource db {\n  provider = \"postgresql\"\n  url = env(\"DATABASE_URL\")\n}\n\n${prismaParts.join('\n\n')}`

  const apiHandlers = (schemas.api.endpoints || []).map((e: any) => generateApiHandler(e))
  const uiPages = (schemas.ui.pages || []).map((p: any) => generateUiPage(p))

  const rbac = (design?.accessControl?.rolePermissions) || {}

  const checklist: string[] = []
  checklist.push('Create Prisma models from prismaSchema and run `npx prisma migrate dev`')
  apiHandlers.forEach((h) => checklist.push(`Create API handler: ${h.path}`))
  uiPages.forEach((p) => checklist.push(`Create UI page: ${p.path}`))
  checklist.push('Wire auth middleware + role checks per RBAC rules')
  checklist.push('Add tests for API endpoints and integration tests for pages')

  return {
    summary,
    prismaSchema,
    apiHandlers,
    uiPages,
    rbac,
    checklist,
  }
}

function bulletList(items: string[]) {
  return items.filter(Boolean).map((item) => `- ${item}`).join('\n')
}

export function buildPlanningDocs(
  prompt: string,
  intent: Intent,
  design: SystemDesign,
  schemas: SchemaOutput,
  implementationPlan: ImplementationPlan
): PlanningDocs {
  const appName = intent.dataModels[0] ? `${intent.dataModels[0].replace(/\b\w/g, (m) => m.toUpperCase())} Builder` : 'AppForge App'
  const userRoles = intent.userRoles.length ? intent.userRoles : design.accessControl.roles
  const pageList = design.pageStructure.map((page) => `${page.name}: ${page.purpose}`).join('\n')
  const apiList = design.apiEndpoints.map((endpoint) => `${endpoint.method} ${endpoint.path} - ${endpoint.purpose}`).join('\n')
  const tableList = schemas.database.tables.map((table) => `${table.name} (${table.columns.map((c) => `${c.name}:${c.type}`).join(', ')})`).join('\n')

  return {
    prd: `# PRD\n\n## App Name\n${appName}\n\n## Tagline\n${intent.primaryFeatures.slice(0, 3).join(' + ') || 'AI-generated application'}\n\n## Problem Statement\n${prompt}\n\n## Target Users\n${userRoles.join(', ')}\n\n## Core Features\n${bulletList(intent.primaryFeatures)}\n\n## Nice-to-Have Features\n${bulletList([
      intent.paymentRequired ? 'billing and subscriptions' : '',
      intent.authRequired ? 'authentication and account management' : '',
      'audit trail',
      'search and filtering',
    ])}\n\n## User Stories\n${bulletList([
      `As a ${userRoles[0] || 'user'}, I want to complete the main workflow for ${intent.appType}.`,
      `As an admin, I want to manage data and access.`,
      `As a member, I want to use the core features without extra setup.`,
    ])}\n\n## Success Metrics\n${bulletList([
      'Users can navigate from landing to the main workspace in under 3 clicks',
      'Generated app config remains valid across validation stages',
      'The generated implementation plan is exportable and actionable',
    ])}`,
    trd: `# TRD\n\n## Frontend\nNext.js App Router\n\n## Backend\nNext.js Route Handlers + Prisma\n\n## Database\nPostgreSQL\n\n## Auth\nClerk with multi-tenant RBAC\n\n## AI / Compiler\nFeatherless-compatible LLM calls with deterministic fallbacks\n\n## Hosting\nVercel for app hosting, Neon/PostgreSQL for database\n\n## Constraints\n${bulletList([
      'Always generate a canonical JSON config first',
      'Fallback output must work when LLM responses are malformed',
      'All docs must agree on entities, pages, and roles',
    ])}`,
    appFlow: `# App Flow\n\nLanding Page\n  -> Sign In / Sign Up\n  -> Onboarding / Prompt Entry\n  -> Compiler Workspace\n  -> Generated App Config Preview\n  -> Implementation Plan\n  -> Export / Deploy\n\n## Primary Pages\n${pageList}\n\n## API Surfaces\n${apiList}`,
    uiUxBrief: `# UI/UX Brief\n\n## Style\nDark mode, modern enterprise, rounded geometry, dense data views\n\n## Typography\nInter-style neutral sans for body, bold oversized headings\n\n## Layout\nTwo-pane builder: prompt/editor on the left, preview/docs on the right\n\n## Interaction Model\nAutosave prompt text, preserve history, render docs tabs for PRD/TRD/App Flow/UI/Backend/Plan\n\n## Reference Feel\nVercel v0, Base44, shadcn-like surfaces`,
    backendSchema: `# Backend Schema\n\n## Tables\n${tableList}\n\n## Roles\n${bulletList(userRoles)}\n\n## Permissions\n${Object.entries(design.accessControl.rolePermissions)
      .map(([role, permissions]) => `${role}: ${permissions.join(', ')}`)
      .join('\n')}\n\n## Auth Strategy\nWorkspace-aware Clerk auth with role checks`,
    implementationPlan: `# Implementation Plan\n\n1. Confirm the PRD and technical assumptions\n2. Create or update Prisma models and migrate the database\n3. Implement auth and RBAC checks\n4. Build the core app pages and API routes\n5. Connect generated docs to previews and exports\n6. Polish UI and add tests\n\n## Concrete Artifacts\n- Prisma schema length: ${implementationPlan.prismaSchema.length} chars\n- API stubs: ${implementationPlan.apiHandlers.length}\n- UI stubs: ${implementationPlan.uiPages.length}\n- Checklist items: ${implementationPlan.checklist.length}`,
  }
}
