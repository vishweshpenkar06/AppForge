import { SchemaOutput, SystemDesign } from './core'
import type { Intent } from './core'

type FileStub = {
  path: string
  content: string
}

type EndpointLike = {
  path?: string
  method?: string
  purpose?: string
  requestSchema?: unknown
  responseSchema?: unknown
}

function normalizeRoutePath(route: string) {
  const raw = route.trim() || '/'
    prd: `# Product Requirements Document\n\n## Product Name\n${appName}\n\n## Requirement Summary\n${prompt}\n\n## Product Vision\nConvert the user's description into an implementation-ready product plan with clear scope, assumptions, and exportable artifacts.\n\n## Target Users\n${bulletList(userRoles.length ? userRoles : ['user'])}\n\n## Core Value\n${bulletList(intent.primaryFeatures.length ? intent.primaryFeatures : ['structured app generation', 'reviewable docs', 'exportable implementation plan'])}\n\n## Detailed Goals\n${numberedList([\n      `Capture the requirement for a ${intent.appType} application without losing intent.`,\n      'Generate a detailed review package before code implementation starts.',\n      'Keep docs, schema, and code stubs synchronized.',\n      'Surface assumptions so the user can confirm or correct them quickly.',\n    ])}\n\n## Assumptions\n${bulletList(intent.assumptions.length ? intent.assumptions : ['No additional assumptions were required'])}\n\n## Complexity Notes\n${bulletList(intent.complexities.length ? intent.complexities : ['Standard product workflow'])}\n\n## User Stories\n${numberedList([\n      `As a ${userRoles[0] || 'user'}, I want the app idea translated into a clear build plan.`,\n      'As a reviewer, I want to inspect the six docs before implementation proceeds.',\n      'As an operator, I want the exported package to be detailed enough for production work.',\n    ])}\n\n## Functional Scope\n${bulletList(intent.primaryFeatures.length ? intent.primaryFeatures : ['prompt parsing', 'app structuring', 'artifact export'])}\n\n## Non-Functional Expectations\n${bulletList([\n      'Generated output should be consistent across all documents',\n      'The app plan should support validation and revision',\n      'Artifacts should be exportable and easy to hand off',\n    ])}\n\n## Success Metrics\n${bulletList([\n      'The generated docs clearly reflect the input requirement',\n      'Implementation files align with the PRD and TRD',\n      'The exported package can be used as a real starting point for development',\n    ])}`,
    trd: `# Technical Requirements Document\n\n## Summary\nThis system converts a natural-language app idea into a validated product blueprint, then emits technical guidance and route/page stubs that can be used to build the application.\n\n## Architecture\n- Frontend: Next.js App Router\n- Backend: Server route handlers and compiler pipeline\n- Database: PostgreSQL via Prisma\n- Auth: Clerk with role-aware authorization\n- Export: Markdown docs and file stubs in public/generated\n\n## Technical Decisions\n${numberedList([\n      'Normalize the requirement into a deterministic compiler input.',\n      'Group multiple HTTP methods for the same route into one file.',\n      'Keep the Prisma schema as the canonical source of truth.',\n      'Persist generated artifacts so the user can review or download them.',\n    ])}\n\n## Constraints\n${bulletList([\n      'Fallback outputs must still be valid when model output is missing',\n      'Route paths must not be double-prefixed with /api',\n      'All docs should agree on roles, pages, and entities',\n    ])}\n\n## Reliability and Validation\n${bulletList([\n      'Validate intent before design',\n      'Validate design before schema generation',\n      'Validate schema before export',\n      'Track stage-level timings for debugging and review',\n    ])}\n\n## Deployment Notes\n${bulletList([\n      'Generated output is written to public/generated for local inspection',\n      'Production compile access should remain authenticated',\n      'Generated route files should be reviewed before being merged into the app',\n    ])}`,
    appFlow: `# Application Flow\n\n## End-to-End Journey\n1. The user opens the compiler workspace.\n2. The user enters a natural-language requirement.\n3. The compiler derives intent, design, schema, validation, and implementation guidance.\n4. The user reviews the PRD, TRD, App Flow, UI/UX Brief, Backend Schema, and Implementation Plan.\n5. The user exports the generated package or continues into implementation.\n\n## Primary Pages\n${pageList}\n\n## API Surfaces\n${apiList}\n\n## Workflow States\n- Draft\n- Compiling\n- Review Ready\n- Exported\n\n## Edge Cases\n${bulletList([\n      'Prompt is vague and requires assumptions to be recorded',\n      'Multiple entities map to the same route and must be merged',\n      'The user may request an app structure that needs role normalization',\n    ])}`,
    uiUxBrief: `# UI/UX Brief\n\n## Visual Direction\nModern product-studio interface with dense but readable documentation panels, review-first layout, and strong hierarchy.\n\n## Layout Strategy\n${numberedList([\n      'Prompt editor on the left or top.',\n      'Generated docs and plan on the right or below.',\n      'Export actions should remain visible after generation.',\n      'Long documents should be grouped into accessible sections.',\n    ])}\n\n## Interaction Model\n${bulletList([\n      'Autosave prompt text',\n      'Preserve prompt history',\n      'Allow review of generated docs without leaving the page',\n      'Expose download actions for generated artifacts',\n    ])}\n\n## Accessibility\n${bulletList([\n      'High contrast text and surfaces',\n      'Keyboard-friendly tabs and actions',\n      'Explicit loading and error states',\n    ])}\n\n## Content Guidelines\nThe interface should help the user understand what is being built, why it was inferred, and how the generated files can be used in a production workflow.`,
    backendSchema: `# Backend Schema\n\n## Tables\n${tableList}\n\n## Core Entity Summary\n${numberedList(schemas.database.tables.map((table) => `${table.name} should include ${table.columns.length} documented fields and its relationships should be explicit.`))}\n\n## Roles\n${bulletList(userRoles.length ? userRoles : ['user'])}\n\n## Permissions\n${Object.entries(design.accessControl.rolePermissions).map(([role, permissions]) => `${role}: ${permissions.join(', ')}`).join('\n')}\n\n## API Contract Summary\n${numberedList(schemas.api.endpoints.map((endpoint) => `${endpoint.method} ${endpoint.path} - ${endpoint.purpose}`))}\n\n## Schema Guidance\n- Include stable IDs and timestamp fields where appropriate.\n- Keep route files aligned with the normalized route path.\n- Prefer explicit relationships over implicit assumptions.`,
    implementationPlan: `# Implementation Plan\n\n## Summary\n${implementationPlan.summary}\n\n## Delivery Phases\n${numberedList([\n      'Review the generated PRD and confirm assumptions.',\n      'Implement or refine the Prisma schema.',\n      'Build grouped route handlers and page stubs.',\n      'Apply auth and role checks.',\n      'Validate the output with tests and manual review.',\n      'Package the generated artifacts for download or handoff.',\n    ])}\n\n## Concrete Artifacts\n${bulletList([\n      `Prisma schema length: ${implementationPlan.prismaSchema.length} characters`,\n      `API route files: ${implementationPlan.apiHandlers.length}`,\n      `UI page files: ${implementationPlan.uiPages.length}`,\n      `Checklist items: ${implementationPlan.checklist.length}`,\n    ])}\n\n## File Inventory\n${bulletList([\n      ...implementationPlan.apiHandlers.map((item) => item.path),\n      ...implementationPlan.uiPages.map((item) => item.path),\n    ])}\n\n## Review Checklist\n${numberedList(implementationPlan.checklist)}\n\n## Handoff Notes\nThis document is intentionally detailed so the output can serve as a production-ready starting point rather than a minimal stub.`,
  const normalized = withoutApiPrefix.startsWith('/') ? withoutApiPrefix : `/${withoutApiPrefix}`
  return normalized === '' ? '/' : normalized
}

function routeToFilePath(route: string) {
  const normalized = normalizeRoutePath(route)
  return normalized === '/' ? 'app/api/route.ts' : `app/api${normalized}/route.ts`
}

function groupEndpoints(endpoints: EndpointLike[]) {
  const groups = new Map<string, { route: string; endpoints: EndpointLike[] }>()

  for (const endpoint of endpoints || []) {
    const route = normalizeRoutePath(endpoint.path || '/api/unknown')
    const existing = groups.get(route)
    if (existing) {
      existing.endpoints.push(endpoint)
    } else {
      groups.set(route, { route, endpoints: [endpoint] })
    }
  }

  return [...groups.values()]
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

function generateApiHandler(group: { route: string; endpoints: EndpointLike[] }) {
  const methods = [...new Set(group.endpoints.map((endpoint) => (endpoint.method || 'GET').toUpperCase()))]

  const content = `import { NextResponse } from 'next/server'

${methods
  .map((method) => {
    const endpoint = group.endpoints.find((item) => (item.method || 'GET').toUpperCase() === method) || group.endpoints[0]
    return `export async function ${method}(request: Request) {
  // Route: ${group.route}
  // Purpose: ${endpoint?.purpose || 'Generated route handler'}
  // Request schema: ${JSON.stringify(endpoint?.requestSchema || {}, null, 2)}
  // Response schema: ${JSON.stringify(endpoint?.responseSchema || {}, null, 2)}
  return NextResponse.json({ ok: true, route: '${group.route}', method: '${method}' })
}`
  })
  .join('\n\n')}
`

  return { path: routeToFilePath(group.route), content }
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

  const apiHandlers = groupEndpoints(schemas.api.endpoints || []).map((group) => generateApiHandler(group))
  const uiPages = Array.from(
    new Map((schemas.ui.pages || []).map((page: any) => {
      const generated = generateUiPage(page)
      return [generated.path, generated]
    })).values()
  )

  const rbac = (design?.accessControl?.rolePermissions) || {}

  const checklistSet = new Set<string>()
  const checklist: string[] = []
  const addChecklist = (item: string) => {
    if (!item || checklistSet.has(item)) return
    checklistSet.add(item)
    checklist.push(item)
  }

  addChecklist('Create Prisma models from prismaSchema and run `npx prisma migrate dev`')
  apiHandlers.forEach((h) => addChecklist(`Create API handler: ${h.path}`))
  uiPages.forEach((p) => addChecklist(`Create UI page: ${p.path}`))
  addChecklist('Wire auth middleware + role checks per RBAC rules')
  addChecklist('Add tests for API endpoints and integration tests for pages')

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

function numberedList(items: string[]) {
  return items.filter(Boolean).map((item, index) => `${index + 1}. ${item}`).join('\n')
}

function joinedOrFallback(items: string[], fallback: string) {
  return items.filter(Boolean).join(', ') || fallback
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
