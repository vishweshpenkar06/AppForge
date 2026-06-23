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
        const pluralName = relatedModelName.endsWith('s')
          ? `${relatedModelName}es`
          : `${relatedModelName}s`
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
  const pluralModelName = modelName.endsWith('s') ? `${modelName}es` : `${modelName}s`

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

export function buildPlanningDocs(
  prompt: string,
  intent: Intent,
  design: SystemDesign,
  schemas: SchemaOutput,
  implementationPlan: ImplementationPlan
): PlanningDocs {
  const appName = intent.dataModels[0]
    ? `${intent.dataModels[0].replace(/\b\w/g, (match) => match.toUpperCase())} Builder`
    : 'AppForge App'
  const userRoles = intent.userRoles.length ? intent.userRoles : design.accessControl.roles
  const pageList = design.pageStructure.map((page) => `${page.name}: ${page.purpose}`).join('\n')
  const apiList = design.apiEndpoints.map((endpoint) => `${endpoint.method} ${endpoint.path} - ${endpoint.purpose}`).join('\n')
  const tableList = schemas.database.tables
    .map((table) => `${table.name} (${table.columns.map((column) => `${column.name}:${column.type}`).join(', ')})`)
    .join('\n')
  const roleSummary = joinedOrFallback(userRoles, 'user')
  const featureSummary = joinedOrFallback(intent.primaryFeatures, 'structured app generation')
  const assumptionSummary = joinedOrFallback(intent.assumptions, 'No explicit assumptions were required')
  const complexitySummary = joinedOrFallback(intent.complexities, 'Standard product workflow')

  const prd = [
    '# Product Requirements Document',
    '',
    '## Product Name',
    appName,
    '',
    '## Requirement Summary',
    prompt,
    '',
    '## Product Vision',
    'Convert the user input into an implementation-ready product plan with clear scope, assumptions, and exportable artifacts.',
    '',
    '## Target Users',
    bulletList(userRoles.length ? userRoles : ['user']),
    '',
    '## Core Value',
    bulletList(intent.primaryFeatures.length ? intent.primaryFeatures : ['reviewable docs', 'exportable plan', 'production-ready scaffold']),
    '',
    '## Detailed Goals',
    numberedList([
      `Capture the requirement for a ${intent.appType} application without losing intent.`,
      'Generate a detailed review package before implementation starts.',
      'Keep docs, schema, and code stubs synchronized.',
      'Surface assumptions so the user can confirm or correct them quickly.',
    ]),
    '',
    '## Assumptions',
    bulletList(intent.assumptions.length ? intent.assumptions : ['No additional assumptions were required']),
    '',
    '## Complexity Notes',
    bulletList(intent.complexities.length ? intent.complexities : ['Standard product workflow']),
    '',
    '## User Stories',
    numberedList([
      `As a ${userRoles[0] || 'user'}, I want the app idea translated into a clear build plan.`,
      'As a reviewer, I want to inspect the six docs before implementation proceeds.',
      'As an operator, I want the exported package to be detailed enough for production work.',
    ]),
    '',
    '## Functional Scope',
    bulletList(intent.primaryFeatures.length ? intent.primaryFeatures : ['prompt parsing', 'app structuring', 'artifact export']),
    '',
    '## Non-Functional Expectations',
    bulletList([
      'Generated output should be consistent across all documents',
      'The app plan should support validation and revision',
      'Artifacts should be exportable and easy to hand off',
    ]),
    '',
    '## Success Metrics',
    bulletList([
      'The generated docs clearly reflect the input requirement',
      'Implementation files align with the PRD and TRD',
      'The exported package can be used as a real starting point for development',
    ]),
    '',
    '## Explicit Review Notes',
    bulletList([
      `Roles inferred: ${roleSummary}`,
      `Features inferred: ${featureSummary}`,
      `Assumptions: ${assumptionSummary}`,
      `Complexity: ${complexitySummary}`,
    ]),
  ].join('\n')

  const trd = [
    '# Technical Requirements Document',
    '',
    '## Summary',
    'This system converts a natural-language app idea into a validated product blueprint, then emits technical guidance and route/page stubs that can be used to build the application.',
    '',
    '## Architecture',
    '- Frontend: Next.js App Router',
    '- Backend: Server route handlers and compiler pipeline',
    '- Database: PostgreSQL via Prisma',
    '- Auth: Clerk with role-aware authorization',
    '- Export: Markdown docs and file stubs in public/generated',
    '',
    '## Technical Decisions',
    numberedList([
      'Normalize the requirement into a deterministic compiler input.',
      'Group multiple HTTP methods for the same route into one file.',
      'Keep the Prisma schema as the canonical source of truth.',
      'Persist generated artifacts so the user can review or download them.',
    ]),
    '',
    '## Constraints',
    bulletList([
      'Fallback outputs must still be valid when model output is missing',
      'Route paths must not be double-prefixed with /api',
      'All docs should agree on roles, pages, and entities',
    ]),
    '',
    '## Reliability and Validation',
    bulletList([
      'Validate intent before design',
      'Validate design before schema generation',
      'Validate schema before export',
      'Track stage-level timings for debugging and review',
    ]),
    '',
    '## Deployment Notes',
    bulletList([
      'Generated output is written to public/generated for local inspection',
      'Production compile access should remain authenticated',
      'Generated route files should be reviewed before being merged into the app',
    ]),
  ].join('\n')

  const appFlow = [
    '# Application Flow',
    '',
    '## End-to-End Journey',
    '1. The user opens the compiler workspace.',
    '2. The user enters a natural-language requirement.',
    '3. The compiler derives intent, design, schema, validation, and implementation guidance.',
    '4. The user reviews the PRD, TRD, App Flow, UI/UX Brief, Backend Schema, and Implementation Plan.',
    '5. The user exports the generated package or continues into implementation.',
    '',
    '## Primary Pages',
    pageList,
    '',
    '## API Surfaces',
    apiList,
    '',
    '## Workflow States',
    '- Draft',
    '- Compiling',
    '- Review Ready',
    '- Exported',
    '',
    '## Edge Cases',
    bulletList([
      'Prompt is vague and requires assumptions to be recorded',
      'Multiple entities map to the same route and must be merged',
      'The user may request an app structure that needs role normalization',
    ]),
  ].join('\n')

  const uiUxBrief = [
    '# UI/UX Brief',
    '',
    '## Visual Direction',
    'Modern product-studio interface with dense but readable documentation panels, review-first layout, and strong hierarchy.',
    '',
    '## Layout Strategy',
    numberedList([
      'Prompt editor on the left or top.',
      'Generated docs and plan on the right or below.',
      'Export actions should remain visible after generation.',
      'Long documents should be grouped into accessible sections.',
    ]),
    '',
    '## Interaction Model',
    bulletList([
      'Autosave prompt text',
      'Preserve prompt history',
      'Allow review of generated docs without leaving the page',
      'Expose download actions for generated artifacts',
    ]),
    '',
    '## Accessibility',
    bulletList([
      'High contrast text and surfaces',
      'Keyboard-friendly tabs and actions',
      'Explicit loading and error states',
    ]),
    '',
    '## Content Guidelines',
    'The interface should help the user understand what is being built, why it was inferred, and how the generated files can be used in a production workflow.',
  ].join('\n')

  const backendSchema = [
    '# Backend Schema',
    '',
    '## Tables',
    tableList,
    '',
    '## Core Entity Summary',
    numberedList(
      schemas.database.tables.map(
        (table) => `${table.name} should include ${table.columns.length} documented fields and its relationships should be explicit.`
      )
    ),
    '',
    '## Roles',
    bulletList(userRoles.length ? userRoles : ['user']),
    '',
    '## Permissions',
    Object.entries(design.accessControl.rolePermissions)
      .map(([role, permissions]) => `${role}: ${permissions.join(', ')}`)
      .join('\n'),
    '',
    '## API Contract Summary',
    numberedList(schemas.api.endpoints.map((endpoint) => `${endpoint.method} ${endpoint.path}`)),
    '',
    '## Schema Guidance',
    '- Include stable IDs and timestamp fields where appropriate.',
    '- Keep route files aligned with the normalized route path.',
    '- Prefer explicit relationships over implicit assumptions.',
  ].join('\n')

  const implementationPlanDoc = [
    '# Implementation Plan',
    '',
    '## Summary',
    implementationPlan.summary,
    '',
    '## Delivery Phases',
    numberedList([
      'Review the generated PRD and confirm assumptions.',
      'Implement or refine the Prisma schema.',
      'Build grouped route handlers and page stubs.',
      'Apply auth and role checks.',
      'Validate the output with tests and manual review.',
      'Package the generated artifacts for download or handoff.',
    ]),
    '',
    '## Concrete Artifacts',
    bulletList([
      `Prisma schema length: ${implementationPlan.prismaSchema.length} characters`,
      `API route files: ${implementationPlan.apiHandlers.length}`,
      `UI page files: ${implementationPlan.uiPages.length}`,
      `Checklist items: ${implementationPlan.checklist.length}`,
    ]),
    '',
    '## File Inventory',
    bulletList([
      ...implementationPlan.apiHandlers.map((item) => item.path),
      ...implementationPlan.uiPages.map((item) => item.path),
    ]),
    '',
    '## Review Checklist',
    numberedList(implementationPlan.checklist),
    '',
    '## Handoff Notes',
    'This document is intentionally detailed so the output can serve as a production-ready starting point rather than a minimal stub.',
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