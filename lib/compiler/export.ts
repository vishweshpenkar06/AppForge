import type { Intent, SchemaOutput, SystemDesign } from './core'

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

function normalizeRoutePath(route: string) {
  const raw = (route || '/').trim() || '/'
  if (raw === '/api') return '/'
  if (raw.startsWith('/api/')) return raw.slice(4)
  return raw.startsWith('/') ? raw : `/${raw}`
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

function mapTypeToPrisma(type: string) {
  const normalized = type.toLowerCase()
  if (normalized.includes('uuid')) return 'String @id @default(cuid())'
  if (normalized.includes('int') || normalized.includes('integer') || normalized.includes('number')) return 'Int'
  if (normalized.includes('bool')) return 'Boolean'
  if (normalized.includes('date') || normalized.includes('time')) return 'DateTime'
  if (normalized.includes('json')) return 'Json'
  return 'String'
}

function pluralizePrismaModel(name: string): string {
  const lower = name.toLowerCase()
  // Irregular plurals
  const irregulars: Record<string, string> = {
    person: 'people',
    child: 'children',
    mouse: 'mice',
    goose: 'geese',
    ox: 'oxen',
    man: 'men',
    woman: 'women',
    tooth: 'teeth',
    foot: 'feet',
    die: 'dice',
    analysis: 'analyses',
    basis: 'bases',
    crisis: 'crises',
    diagnosis: 'diagnoses',
    hypothesis: 'hypotheses',
    thesis: 'theses',
    criterion: 'criteria',
    phenomenon: 'phenomena',
  }
  if (irregulars[lower]) {
    return name[0].toUpperCase() + irregulars[lower].slice(1)
  }
  // Standard English pluralization rules
  if (lower.endsWith('s') || lower.endsWith('ss') || lower.endsWith('sh') || lower.endsWith('ch') || lower.endsWith('x') || lower.endsWith('z')) {
    return `${name}es`
  }
  if (lower.endsWith('y') && !/[aeiou]$/.test(lower.slice(0, -1))) {
    return `${name.slice(0, -1)}ies`
  }
  if (lower.endsWith('f')) {
    return `${name.slice(0, -1)}ves`
  }
  if (lower.endsWith('fe')) {
    return `${name.slice(0, -2)}ves`
  }
  return `${name}s`
}

function generatePrismaModel(table: any, allTables: any[]) {
  const modelName = table.name[0].toUpperCase() + table.name.slice(1)
  const lines: string[] = [`model ${modelName} {`]
  const hasId = table.columns.some((column: any) => column.name === 'id')
  const hasCreatedAt = table.columns.some((column: any) => column.name === 'createdAt')
  const hasUpdatedAt = table.columns.some((column: any) => column.name === 'updatedAt')

  if (!hasId) lines.push('  id        String   @id @default(cuid())')

  // Add regular columns
  for (const column of table.columns) {
    if (column.name === 'id' || column.name === 'createdAt' || column.name === 'updatedAt') continue
    const prismaType = mapTypeToPrisma(column.type || 'string')
    const optional = column.required ? '' : '?'
    lines.push(`  ${column.name.padEnd(12)} ${prismaType}${optional}`)
  }

  if (!hasCreatedAt) lines.push('  createdAt DateTime @default(now())')
  if (!hasUpdatedAt) lines.push('  updatedAt DateTime @updatedAt')

  // Add relation fields and reverse relations
  for (const relation of table.relationships || []) {
    const relatedModelName = relation[0].toUpperCase() + relation.slice(1)
    const relatedTable = allTables.find((t: any) => t.name.toLowerCase() === relation.toLowerCase())

    if (relatedTable) {
      // Check if the related table has a FK back to this table
      const hasBackRef = relatedTable.columns?.some(
        (c: any) => c.name.toLowerCase() === `${table.name.toLowerCase()}id`
      ) || relatedTable.relationships?.some(
        (r: string) => r.toLowerCase() === table.name.toLowerCase()
      )

      if (hasBackRef) {
        // This is the "one" side - add a reverse relation field
        const pluralName = pluralizePrismaModel(relatedModelName)
        lines.push(`  ${pluralName.padEnd(12)} ${relatedModelName}[]`)
      } else {
        // This is the "many" side - add FK + relation
        const fkCol = `${relation.toLowerCase()}Id`
        const hasFkCol = table.columns.some((c: any) => c.name === fkCol)
        if (!hasFkCol) {
          lines.push(`  ${fkCol.padEnd(12)} String`)
        }
        lines.push(`  ${relation.toLowerCase().padEnd(12)} ${relatedModelName}  @relation(fields: [${fkCol}], references: [id])`)
      }
    } else {
      // Just add a basic FK column
      const fkCol = `${relation.toLowerCase()}Id`
      const hasFkCol = table.columns.some((c: any) => c.name === fkCol)
      if (!hasFkCol) {
        lines.push(`  ${fkCol.padEnd(12)} String?`)
      }
    }
  }

  lines.push('}')
  return lines.join('\n')
}

function generateApiHandler(group: { route: string; endpoints: EndpointLike[] }) {
  const methods = [...new Set(group.endpoints.map((endpoint) => (endpoint.method || 'GET').toUpperCase()))]
  const entityName = group.route.replace(/-/g, '_').split('/').filter(Boolean).pop() || 'item'
  const modelName = entityName.charAt(0).toUpperCase() + entityName.slice(1)
  const pluralModelName = pluralizePrismaModel(modelName)

  const methodBlocks = methods.map((method) => {
    switch (method) {
      case 'GET':
        return `export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      const item = await prisma.${entityName}.findUnique({ where: { id } })
      if (!item) {
        return NextResponse.json({ error: '${modelName} not found' }, { status: 404 })
      }
      return NextResponse.json(item)
    }

    const items = await prisma.${entityName}.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(items)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch ${pluralModelName}' },
      { status: 500 }
    )
  }
}`
      case 'POST':
        return `export async function POST(request: Request) {
  try {
    const body = await request.json()

    const item = await prisma.${entityName}.create({
      data: body,
    })
    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create ${modelName}' },
      { status: 500 }
    )
  }
}`
      case 'PUT':
        return `export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const item = await prisma.${entityName}.update({
      where: { id },
      data: body,
    })
    return NextResponse.json(item)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update ${modelName}' },
      { status: 500 }
    )
  }
}`
      case 'DELETE':
        return `export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await prisma.${entityName}.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete ${modelName}' },
      { status: 500 }
    )
  }
}`
      default:
        return `export async function ${method}(request: Request) {
  return NextResponse.json({ error: 'Method ${method} not implemented' }, { status: 501 })
}`
    }
  })

  return {
    path: routeToFilePath(group.route),
    content: `import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

${methodBlocks.join('\n\n')}`,
  }
}

function generateUiPage(page: any) {
  const route = page.route || '/'
  const path = route === '/' ? 'app/page.tsx' : `app${route}/page.tsx`
  const entityName = route.replace(/^\//, '').replace(/-/g, '_').split('/').filter(Boolean).pop() || 'item'
  const displayName = entityName.charAt(0).toUpperCase() + entityName.slice(1)
  const apiPath = `/api/${entityName}`
  const componentName = `${displayName}Page`

  const content = `'use client'

import { useEffect, useState } from 'react'

interface ${displayName} {
  id: string
  [key: string]: any
}

export default function ${componentName}() {
  const [items, setItems] = useState<${displayName}[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('${apiPath}')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json()
      })
      .then((data) => {
        setItems(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <main style={{ padding: '2rem' }}>
        <p>Loading ${displayName}s...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main style={{ padding: '2rem' }}>
        <p style={{ color: 'red' }}>Error: {error}</p>
      </main>
    )
  }

  return (
    <main style={{ padding: '2rem' }}>
      <h1>${displayName}s</h1>
      <p>Route: ${route}</p>
      <p>Data source: ${page.dataSource || `GET ${apiPath}`}</p>

      {items.length === 0 ? (
        <p>No ${displayName.toLowerCase()}s found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {Object.keys(items[0] || {}).filter(k => k !== 'id').map((key) => (
                <th key={key} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                {Object.entries(item).filter(([k]) => k !== 'id').map(([key, value]) => (
                  <td key={key} style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {String(value ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}`

  return { path, content }
}

function bulletList(items: string[]) {
  return items.filter(Boolean).map((item) => `- ${item}`).join('\n')
}

function numberedList(items: string[]) {
  return items.filter(Boolean).map((item, index) => `${index + 1}. ${item}`).join('\n')
}

function uniqueStrings(items: string[]) {
  return [...new Set(items.filter(Boolean))]
}

function joinedOrFallback(items: string[], fallback: string) {
  return items.filter(Boolean).join(', ') || fallback
}

export function buildImplementationPlan(schemas: SchemaOutput, design?: SystemDesign): ImplementationPlan {
  const summary = `Concrete implementation plan for ${design?.architecture || 'app'} with ${schemas.database.tables.length} tables, ${schemas.api.endpoints.length} endpoints, and ${schemas.ui.pages.length} pages.`
  const prismaParts = schemas.database.tables.map((table) => generatePrismaModel(table, schemas.database.tables))
  const prismaSchema = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url = env("DATABASE_URL")
}

${prismaParts.join('\n\n')}`

  const apiHandlers = groupEndpoints(schemas.api.endpoints || []).map((group) => generateApiHandler(group))
  const uiPages = Array.from(
    new Map((schemas.ui.pages || []).map((page: any) => {
      const generated = generateUiPage(page)
      return [generated.path, generated]
    })).values()
  )

  const checklist = uniqueStrings([
    'Create Prisma models from prismaSchema and run npx prisma migrate dev',
    ...apiHandlers.map((handler) => `Create API handler: ${handler.path}`),
    ...uiPages.map((page) => `Create UI page: ${page.path}`),
    'Wire auth middleware and role checks per RBAC rules',
    'Add tests for API endpoints and integration tests for pages',
  ])

  return {
    summary,
    prismaSchema,
    apiHandlers,
    uiPages,
    rbac: design?.accessControl?.rolePermissions || {},
    checklist,
  }
}

// ── Planning doc helpers ─────────────────────────────────────

const APP_TYPE_LABEL: Record<Intent['appType'], string> = {
  crud: 'Application',
  marketplace: 'Marketplace',
  crm: 'CRM',
  saas: 'SaaS Platform',
  content: 'Content Platform',
  ecommerce: 'Storefront',
  analytics: 'Analytics Platform',
  social: 'Social App',
  other: 'Application',
}

function titleCase(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function mdTable(headers: string[], rows: string[][]) {
  const cell = (value: string) => (value || '').replace(/\|/g, '\\|') || '—'
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.map(cell).join(' | ')} |`),
  ].join('\n')
}

function orNone(items: string[], message: string) {
  return items.length ? bulletList(items) : message
}

function withArticle(label: string) {
  return `${/^[aeiou]/i.test(label) ? 'An' : 'A'} ${label}`
}

function countOf(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}

function fieldList(schema: Record<string, unknown> | undefined) {
  const keys = schema ? Object.keys(schema) : []
  return keys.length ? keys.join(', ') : 'no body'
}

/**
 * Builds the six planning documents from the compiled config.
 * Every section is derived from the actual intent/design/schema so the output can
 * be handed to a coding agent without rewriting placeholders. Deliberately
 * deterministic: no extra LLM call, no chance of drifting from the schema.
 */
export function buildPlanningDocs(
  prompt: string,
  intent: Intent,
  design: SystemDesign,
  schemas: SchemaOutput,
  implementationPlan: ImplementationPlan
): PlanningDocs {
  const primaryEntity = intent.dataModels[0] || 'Item'
  const appName = `${titleCase(primaryEntity)} ${APP_TYPE_LABEL[intent.appType]}`
  const roles = uniqueStrings([...intent.userRoles, ...design.accessControl.roles])
  const effectiveRoles = roles.length ? roles : ['user']
  const pages = schemas.ui.pages
  const endpoints = schemas.api.endpoints
  const tables = schemas.database.tables
  const permissions = Object.keys(design.accessControl.rolePermissions).length
    ? design.accessControl.rolePermissions
    : effectiveRoles.reduce<Record<string, string[]>>((acc, role) => {
        acc[role] = role === 'admin' ? ['create', 'read', 'update', 'delete', 'manage'] : ['read', 'create']
        return acc
      }, {})

  const flows = intent.userFlows.length
    ? intent.userFlows
    : effectiveRoles.map((role) => ({
        role,
        flow_name: `${titleCase(role)} primary journey`,
        steps: [
          `Signs in and lands on ${pages[0]?.route || '/'}`,
          ...pages.slice(1, 4).map((page) => `Opens ${page.route} to work with ${primaryEntity}`),
          `Creates or updates a ${primaryEntity} record`,
          'Confirms the change persisted after reload',
        ],
      }))

  // Point each feature at the endpoint its words match, not blindly at the first route.
  const endpointFor = (feature: string) => {
    const words = feature.toLowerCase().split(/[^a-z]+/).filter((word) => word.length > 3)
    return (
      [...endpoints]
        .sort(
          (a, b) =>
            words.filter((word) => b.path.toLowerCase().includes(word)).length -
            words.filter((word) => a.path.toLowerCase().includes(word)).length
        )[0]?.path || '/api'
    )
  }
  // ── PRD ────────────────────────────────────────────────────────────
  const prd = [
    `# Product Requirements Document — ${appName}`,
    '',
    '## 1. Requirement As Given',
    `> ${prompt.replace(/\n+/g, ' ').trim()}`,
    '',
    '## 2. Product Summary',
    `${withArticle(APP_TYPE_LABEL[intent.appType].toLowerCase())} where ${effectiveRoles.join(', ')} work with ${intent.dataModels.join(', ') || primaryEntity}. ` +
      `The build ships ${intent.primaryFeatures.length || 'the core'} features across ${countOf(pages.length, 'screen')} and ${countOf(endpoints.length, 'API endpoint')}, ` +
      `backed by ${tables.length} tables. Authentication is ${intent.authRequired ? 'required' : 'not required'} and billing is ${intent.paymentRequired ? 'in scope' : 'out of scope'}.`,
    '',
    '## 3. Target Roles',
    mdTable(
      ['Role', 'Primary job', 'Permissions'],
      effectiveRoles.map((role) => [
        titleCase(role),
        `Uses ${appName} to manage ${primaryEntity.toLowerCase()} data`,
        (permissions[role] || ['read']).join(', '),
      ])
    ),
    '',
    '## 4. Core Features',
    mdTable(
      ['#', 'Feature', 'Behaviour', 'Surfaces'],
      (intent.primaryFeatures.length ? intent.primaryFeatures : [`Manage ${primaryEntity}`]).map((feature, index) => [
        String(index + 1),
        feature,
        `The system supports "${feature}" end to end: the UI collects input, ${endpointFor(feature)} persists it, and the result is visible after reload.`,
        pages.length ? pages.map((page) => page.route).join(', ') : endpoints.map((e) => e.path).join(', '),
      ])
    ),
    '',
    '## 5. Premium / Gated Features',
    intent.premiumFeatures.length
      ? mdTable(['Gated feature', 'Gate'], intent.premiumFeatures.map((feature) => [feature, 'Paid plan (paymentRequired = true)']))
      : 'None. Every feature above ships in the base tier — no paywall logic is required.',
    '',
    '## 6. Data Entities',
    mdTable(
      ['Entity', 'Fields', 'Relationships'],
      tables.map((table) => [
        table.name,
        table.columns.map((column) => `${column.name}: ${column.type}${column.required ? '' : '?'}`).join(', '),
        table.relationships.length ? table.relationships.join(', ') : 'none',
      ])
    ),
    '',
    '## 7. User Flows',
    ...flows.flatMap((flow, index) => [
      `### 7.${index + 1} ${flow.flow_name || titleCase(flow.role)} (${flow.role})`,
      numberedList(flow.steps.length ? flow.steps : ['Sign in', `Open ${pages[0]?.route || '/'}`, `Create a ${primaryEntity}`]),
      '',
    ]),
    '## 8. Assumptions & Decisions',
    orNone(
      intent.assumptions,
      `No ambiguity was flagged in the request. Baseline decisions: single tenant, ${intent.authRequired ? 'authenticated' : 'public'} access, ${APP_TYPE_LABEL[intent.appType].toLowerCase()} scope as described above.`
    ),
    '',
    '## 9. Complexity & Risks',
    orNone(intent.complexities, 'No unusual complexity detected — the build follows the standard flow for this app type.'),
    '',
    '## 10. Explicitly Out Of Scope',
    bulletList([
      intent.paymentRequired ? 'Refunds and invoicing (billing covers plan selection only)' : 'Payments and billing',
      intent.authRequired ? 'SSO / SAML providers' : 'Multi-tenant account switching',
      'Native mobile apps (responsive web only)',
      'Localisation beyond English',
      'Data import from third-party systems',
    ]),
    '',
    '## 11. Definition Of Done',
    numberedList([
      ...pages.map((page) => `${page.route} renders with loading, empty and error states.`),
      ...endpoints.map((endpoint) => `${endpoint.method} ${endpoint.path} returns the documented shape and rejects invalid input with 400.`),
      `Every table in §6 exists in the database with the listed columns and constraints.`,
      `Each role in §3 can complete the flow in §7 and cannot reach the others' permissions.`,
      'Typecheck passes and the checklist in the Implementation Plan is complete.',
    ]),
  ].join('\n')

  // ── TRD ────────────────────────────────────────────────────────────
  const trd = [
    `# Technical Requirements Document — ${appName}`,
    '',
    '## 1. Overview',
    `${appName} is a ${design.architecture} application. ${pages.length} screens call ${endpoints.length} endpoints over ${tables.length} tables. ` +
      'This document is the contract between the UI, the API and the database — implement it exactly as written.',
    '',
    '## 2. Architecture',
    mdTable(
      ['Layer', 'Responsibility', 'Concrete pieces'],
      [
        ['Presentation', 'Renders routes and collects input', pages.map((page) => page.route).join(', ') || 'no pages defined'],
        ['API', 'Validates input, enforces permissions, returns JSON', endpoints.map((e) => `${e.method} ${e.path}`).join(', ') || 'no endpoints defined'],
        ['Persistence', 'Stores entities and relationships', tables.map((t) => t.name).join(', ') || 'no tables defined'],
        ['Auth', intent.authRequired ? `Session-based; roles: ${effectiveRoles.join(', ')}` : 'No authentication layer required', intent.authRequired ? 'Enforce on every write endpoint' : 'Skip entirely'],
      ]
    ),
    '',
    '## 3. Data Model',
    ...tables.flatMap((table) => [
      `### 3.${tables.indexOf(table) + 1} ${table.name}`,
      mdTable(
        ['Column', 'Type', 'Required', 'Notes'],
        table.columns.map((column) => [
          column.name,
          column.type,
          column.required ? 'yes' : 'no',
          column.name === 'id' ? 'Primary key' : /createdAt|updatedAt|deletedAt/.test(column.name) ? 'Timestamp, set by the server' : 'Domain field',
        ])
      ),
      table.relationships.length
        ? `**Relationships:** ${table.relationships.join(', ')}`
        : '**Relationships:** none — this table stands alone.',
      '',
    ]),
    '## 4. API Contract',
    mdTable(
      ['Method', 'Path', 'Purpose', 'Auth', 'Request body', 'Response'],
      endpoints.map((endpoint) => {
        const purpose =
          design.apiEndpoints.find((d) => d.path === endpoint.path && d.method === endpoint.method)?.purpose ||
          `${endpoint.method === 'GET' ? 'Read' : endpoint.method === 'DELETE' ? 'Delete' : 'Write'} ${primaryEntity}`
        return [
          endpoint.method,
          endpoint.path,
          purpose,
          intent.authRequired ? 'required' : 'public',
          fieldList(endpoint.requestSchema),
          endpoint.method === 'GET' ? 'JSON list or single object' : 'JSON object with the created/updated record',
        ]
      })
    ),
    '',
    '## 5. Auth & Authorization',
    `Authentication: **${intent.authRequired ? 'required' : 'not required'}**.`,
    '',
    mdTable(
      ['Role', 'Allowed actions'],
      Object.entries(permissions).map(([role, actions]) => [titleCase(role), actions.join(', ')])
    ),
    '',
    '## 6. Non-Functional Requirements',
    mdTable(
      ['Concern', 'Requirement'],
      [
        ['Latency', endpoints.some((e) => e.method === 'GET') ? 'List endpoints under 300ms p95 with pagination' : 'Endpoints under 300ms p95'],
        ['Pagination', endpoints.some((e) => e.method === 'GET') ? 'Cursor or offset pagination, default 20, max 100' : 'Not applicable'],
        ['Validation', 'Every write endpoint rejects missing required fields with 400 and a field map'],
        ['Accessibility', 'WCAG 2.1 AA: keyboard reachable controls, visible focus, 4.5:1 text contrast'],
        ['Responsive', 'Usable at 390px, 768px and 1440px widths'],
        ['Data safety', 'Soft delete via deletedAt where the entity is referenced by others'],
        ['Observability', 'Structured log line per request: route, status, duration'],
      ]
    ),
    '',
    '## 7. Error Handling',
    mdTable(
      ['Condition', 'Status', 'Body'],
      [
        ['Missing or malformed body', '400', '{ error, fields }'],
        ['Not signed in', '401', '{ error: "Unauthorized" }'],
        ['Signed in but wrong role', '403', '{ error: "Forbidden" }'],
        [`${primaryEntity} not found`, '404', '{ error: "Not found" }'],
        ['Validation passed but write failed', '422', '{ error, reason }'],
        ['Unexpected failure', '500', '{ error: "Internal server error" }'],
      ]
    ),
    '',
    '## 8. Risks & Mitigations',
    mdTable(
      ['Risk', 'Mitigation'],
      [
        ['Schema and API drift apart', 'Generate both from the tables in §3; run the validation step before export'],
        ['Permission gaps on write routes', 'Apply the §5 matrix as middleware, not per handler'],
        ['Unbounded list queries', 'Pagination enforced at the data layer, not the UI'],
        ['Lost updates', 'Use optimistic concurrency (version column) where two roles edit the same record'],
      ]
    ),
  ].join('\n')

  // ── App Flow ───────────────────────────────────────────────────────
  const appFlow = [
    `# Application Flow — ${appName}`,
    '',
    '## 1. Entry Point',
    `Unauthenticated visitors land on \`${pages[0]?.route || '/'}\`. ${intent.authRequired ? 'Any write action redirects to sign-in and returns to the same route afterwards.' : 'All routes are public; no redirect flow is needed.'}`,
    '',
    '## 2. Navigation Map',
    mdTable(
      ['Route', 'Purpose', 'Components', 'Data source'],
      pages.map((page) => [
        page.route,
        design.pageStructure.find((d) => d.name.toLowerCase() === page.route.replace('/', '').toLowerCase())?.purpose || `Primary ${primaryEntity} surface`,
        page.components.join(', ') || 'page shell',
        page.dataSource || 'local state',
      ])
    ),
    '',
    '## 3. Role Flows',
    ...flows.flatMap((flow, index) => [
      `### 3.${index + 1} ${flow.flow_name || titleCase(flow.role)}`,
      `**Role:** ${flow.role}`,
      '',
      numberedList(flow.steps),
      '',
    ]),
    '## 4. Screen By Screen',
    ...pages.flatMap((page, index) => [
      `### 4.${index + 1} ${page.route}`,
      bulletList([
        `**Shows:** ${page.components.join(', ') || 'a list and a form'}`,
        `**Reads:** ${page.dataSource || 'client state'}`,
        '**Loading:** skeleton rows matching the final layout',
        `**Empty:** "No ${primaryEntity.toLowerCase()} yet" plus the primary call to action`,
        '**Error:** inline message with a retry button, form values preserved',
        '**Success:** toast confirmation plus the list refreshes',
      ]),
      '',
    ]),
    '## 5. API Call Sequence',
    numberedList(
      flows.flatMap((flow) =>
        flow.steps.map(
          (step, index) =>
            `${flow.role}: "${step}" → ${endpoints[index % Math.max(endpoints.length, 1)]?.method || 'GET'} ${endpoints[index % Math.max(endpoints.length, 1)]?.path || '/api'}`
        )
      )
    ),
    '',
    '## 6. Edge Cases & Recovery',
    bulletList([
      `Two users edit the same ${primaryEntity.toLowerCase()} — the second save is rejected with 422 and a reload prompt`,
      'Network drops mid-save — the form keeps its values and offers retry',
      'Session expires — redirect to sign-in, then restore the pending route',
      `Empty database on first run — ${pages[0]?.route || 'the first page'} shows the empty state, not an error`,
      ...(intent.authRequired ? ['User lacks the role for an action — the control is hidden, and the API returns 403 if called directly'] : []),
    ]),
    '',
    `## 7. ${primaryEntity} Lifecycle`,
    numberedList([
      'Created — minimum required fields present, owner recorded',
      'Active — visible in lists, editable by owner and admins',
      'Updated — timestamps refreshed, version incremented',
      'Archived — hidden from default lists, still readable by admins',
      'Deleted — soft deleted; hard delete available to admins only',
    ]),
  ].join('\n')

  // ── UI/UX Brief ────────────────────────────────────────────────────
  const sharedComponents = uniqueStrings([
    ...pages.flatMap((page) => page.components),
    'Button',
    'Input',
    'FormField',
    'DataTable',
    'EmptyState',
    'Toast',
    'Dialog',
  ])

  const uiUxBrief = [
    `# UI/UX Brief — ${appName}`,
    '',
    '## 1. Design Direction',
    `Functional, ${APP_TYPE_LABEL[intent.appType].toLowerCase()} tooling aesthetic: dense information, clear hierarchy, minimal decoration. ` +
      `Users are ${effectiveRoles.join(' and ')}, so every screen optimises for the task in §4 of the PRD rather than marketing.`,
    '',
    '## 2. Layout System',
    mdTable(
      ['Token', 'Value'],
      [
        ['Max content width', '1200px, centred'],
        ['Spacing scale', '4 / 8 / 12 / 16 / 24 / 32 / 48px'],
        ['Breakpoints', '390px (mobile) · 768px (tablet) · 1440px (desktop)'],
        ['Type scale', '12 / 14 / 16 / 20 / 24 / 32px'],
        ['Radius', '8px controls · 12px cards'],
        ['Surface', 'One elevated card per logical group, 1px border, no heavy shadows'],
      ]
    ),
    '',
    '## 3. Page Specs',
    ...pages.flatMap((page, index) => [
      `### 3.${index + 1} ${page.route}`,
      bulletList([
        `**Layout:** header with title and primary action, then ${page.components.length > 2 ? 'a two-column grid (list + detail)' : 'a single column stack'}`,
        `**Components:** ${page.components.join(', ') || 'shell, list, form'}`,
        `**Primary action:** create a ${primaryEntity.toLowerCase()}`,
        '**States:** loading skeleton, empty state with CTA, error banner with retry, success toast',
        '**Keyboard:** Tab order follows visual order; Cmd/Ctrl+Enter submits the form',
      ]),
      '',
    ]),
    '## 4. Component Inventory',
    mdTable(
      ['Component', 'Used on', 'Notes'],
      sharedComponents.map((component) => [
        component,
        pages.filter((page) => page.components.includes(component)).map((p) => p.route).join(', ') || 'shared',
        /Table/i.test(component) ? 'Sortable header, row actions, pagination footer' : /Form|Input/i.test(component) ? 'Label, hint, error text, required marker' : 'Standard interactive states',
      ])
    ),
    '',
    '## 5. Interaction Specs',
    bulletList([
      'Destructive actions require a confirm dialog naming the record',
      'Saves are optimistic only where the API is idempotent; otherwise show a pending state',
      'Lists preserve sort, filter and page in the URL so refresh keeps context',
      'Inline validation fires on blur, not on every keystroke',
      'Every async action has a disabled + spinner state to prevent double submit',
    ]),
    '',
    '## 6. Accessibility',
    bulletList([
      'Every input has a programmatic label; errors are linked with aria-describedby',
      'Focus is moved to the first invalid field after a failed submit',
      'Dialogs trap focus and restore it on close',
      'Colour is never the only signal for status — pair with text or icon',
      'Text contrast at least 4.5:1, large text 3:1',
      'All interactive elements reachable by keyboard with a visible focus ring',
    ]),
    '',
    '## 7. Empty & Error Copy',
    mdTable(
      ['Situation', 'Copy'],
      [
        [`No ${primaryEntity.toLowerCase()} records`, `No ${primaryEntity.toLowerCase()} yet — create the first one to get started.`],
        ['List failed to load', 'Could not load this list. Check your connection and retry.'],
        ['Save failed', 'Your changes were not saved. Nothing was lost — retry when ready.'],
        ['Permission denied', 'Your role does not allow this action. Ask an admin for access.'],
      ]
    ),
  ].join('\n')

  // ── Backend Schema ─────────────────────────────────────────────────
  const backendSchema = [
    `# Backend Schema — ${appName}`,
    '',
    '## 1. Tables',
    ...tables.flatMap((table, index) => [
      `### 1.${index + 1} ${table.name}`,
      mdTable(
        ['Column', 'Type', 'Required', 'Constraint'],
        table.columns.map((column) => [
          column.name,
          column.type,
          column.required ? 'yes' : 'no',
          column.name === 'id' ? 'PRIMARY KEY' : /At$/.test(column.name) ? 'DEFAULT now()' : /email/i.test(column.name) ? 'UNIQUE' : '—',
        ])
      ),
      '',
    ]),
    '## 2. Relationships',
    orNone(
      tables.flatMap((table) => table.relationships.map((relation) => `${table.name} → ${relation}`)),
      'No foreign keys required — the tables are independent.'
    ),
    '',
    '## 3. Prisma Schema',
    '```prisma',
    implementationPlan.prismaSchema.trim() || '// no models generated',
    '```',
    '',
    '## 4. Indexes',
    orNone(
      tables.flatMap((table) =>
        table.columns
          .filter((column) => /Id$/.test(column.name) && column.name !== 'id')
          .map((column) => `${table.name}(${column.name}) — foreign key index`)
      ),
      'Only primary keys are indexed; add indexes when query patterns emerge.'
    ),
    '',
    '## 5. Permissions Matrix',
    mdTable(
      ['Role', ...['create', 'read', 'update', 'delete'].map((action) => titleCase(action))],
      Object.entries(permissions).map(([role, actions]) => [
        titleCase(role),
        ...['create', 'read', 'update', 'delete'].map((action) => (actions.some((a) => a.toLowerCase().includes(action)) ? 'yes' : 'no')),
      ])
    ),
    '',
    '## 6. Endpoint Contracts',
    mdTable(
      ['Method', 'Path', 'Request', 'Response', 'Errors'],
      endpoints.map((endpoint) => [
        endpoint.method,
        endpoint.path,
        fieldList(endpoint.requestSchema),
        endpoint.method === 'DELETE' ? '204 No Content' : '200 JSON record',
        endpoint.method === 'GET' ? '401, 500' : '400, 401, 403, 422, 500',
      ])
    ),
    '',
    '## 7. Data Integrity Rules',
    numberedList([
      'Every foreign key is enforced in the database, not only in application code',
      'Required columns are NOT NULL with no client-side-only default',
      'Timestamps are server-generated; clients cannot set them',
      'Deletes cascade or soft-delete explicitly — never leave orphans',
      `Unique constraints on natural keys (${tables.flatMap((t) => t.columns.filter((c) => /email|slug|name/i.test(c.name)).map((c) => `${t.name}.${c.name}`)).join(', ') || 'none required'})`,
    ]),
    '',
    '## 8. Migration Notes',
    bulletList([
      'Apply with `prisma db push` for a new database, or `prisma migrate dev` once the schema is stable',
      'Seed reference data before enabling writes in production',
      'Run the validation step after every schema change — the API contract in §6 must still match',
    ]),
  ].join('\n')

  // ── Implementation Plan ────────────────────────────────────────────
  const fileMap = [
    ...implementationPlan.apiHandlers.map((file) => ({ ...file, kind: 'API route handler' })),
    ...implementationPlan.uiPages.map((file) => ({ ...file, kind: 'UI page' })),
  ]

  const implementationPlanDoc = [
    `# Implementation Plan — ${appName}`,
    '',
    '## 1. Summary',
    implementationPlan.summary || `Implement ${appName}: ${tables.length} tables, ${endpoints.length} endpoints, ${pages.length} screens.`,
    '',
    '## 2. Build Order',
    numberedList([
      'Create the database schema (§3 of the Backend Schema) and run the migration.',
      'Implement shared types derived from the schema — no hand-written duplicates.',
      ...implementationPlan.apiHandlers.map((file) => `Implement ${file.path}.`),
      ...implementationPlan.uiPages.map((file) => `Build ${file.path}.`),
      'Wire auth middleware to the permission matrix.',
      'Add loading, empty and error states to every screen.',
      'Run the verification commands in §5.',
    ]),
    '',
    '## 3. File Map',
    fileMap.length
      ? mdTable(['File', 'Kind', 'Responsibility'], fileMap.map((file) => [file.path, file.kind, describeFile(file.path, file.kind)]))
      : 'No file stubs were generated for this config — create routes under app/api and pages under app/.',
    '',
    '## 4. Task Breakdown',
    ...tables.flatMap((table, index) => [
      `### 4.${index + 1} ${table.name} data layer`,
      numberedList([
        `Define the model with ${table.columns.length} fields exactly as listed.`,
        table.relationships.length ? `Add relations: ${table.relationships.join(', ')}.` : 'No relations required.',
        'Add list query with pagination and a single-record fetch.',
        'Add create and update with field validation.',
        'Add soft delete where the entity is referenced by other tables.',
      ]),
      '',
    ]),
    '## 5. Verification',
    mdTable(
      ['Check', 'Command or step', 'Pass condition'],
      [
        ['Types', '`npm run build`', 'Exits 0 with no type errors'],
        ['Lint', '`npm run lint`', 'No errors'],
        ['Tests', '`npm test`', 'All green'],
        ['Schema', '`npx prisma validate`', 'Schema valid'],
        ['API smoke', `Call each endpoint: ${endpoints.map((e) => `${e.method} ${e.path}`).join(', ')}`, 'Documented status codes returned'],
        ['UI smoke', `Visit ${pages.map((p) => p.route).join(', ')}`, 'Loading, empty and error states all reachable'],
      ]
    ),
    '',
    '## 6. Handoff Contract',
    bulletList([
      'Implement this plan exactly — do not redesign the schema or rename routes.',
      'Every screen keeps its loading, empty and error states; none may ship unimplemented.',
      'Every endpoint validates input and returns the documented status codes.',
      'No unfinished comments, no stubbed handlers, no `any` in new code.',
      'If a requirement is genuinely ambiguous, record it in the PRD assumptions rather than inventing a silent choice.',
    ]),
    '',
    '## 7. Checklist',
    numberedList(
      implementationPlan.checklist.length
        ? implementationPlan.checklist
        : [
            'Schema applied to the database',
            'Endpoints implemented and validated',
            'Screens built with all states',
            'Permissions enforced server-side',
            'Verification in §5 complete',
          ]
    ),
  ].join('\n')

  return {
    prd,
    trd,
    appFlow,
    uiUxBrief,
    backendSchema,
    implementationPlan: implementationPlanDoc,
  }
}

function describeFile(path: string, kind: string) {
  const name = path.split('/').pop() || path
  if (kind === 'API route handler') {
    return `Handles requests for ${name.replace(/\.(ts|tsx)$/, '').replace(/route$/, '') || 'this resource'}`
  }
  const segment = path.split('/').slice(-2, -1)[0] || 'page'
  return `Renders the ${titleCase(segment)} screen`
}
