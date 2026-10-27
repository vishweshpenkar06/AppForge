import { describe, it, expect } from 'vitest'
import { buildPlanningDocs } from '@/lib/compiler/export'
import type { Intent, SchemaOutput, SystemDesign } from '@/lib/compiler/core'
import type { ImplementationPlan } from '@/lib/compiler/export'

const intent: Intent = {
  appType: 'crud',
  primaryFeatures: [
    'Create a board',
    'Add cards to a board',
    'Move cards between columns',
    'Assign a card to a teammate',
  ],
  userRoles: ['admin', 'member'],
  authRequired: true,
  paymentRequired: false,
  dataModels: ['Board', 'Card', 'Comment'],
  complexities: ['Concurrent drag-and-drop updates'],
  assumptions: ['Single workspace per account'],
  premiumFeatures: [],
  userFlows: [
    { role: 'admin', flow_name: 'Admin setup', steps: ['Sign in', 'Create a board', 'Invite a member', 'Assign work'] },
    { role: 'member', flow_name: 'Member daily loop', steps: ['Sign in', 'Open the board', 'Move a card', 'Comment on a card'] },
  ],
}

const design: SystemDesign = {
  architecture: 'monolith',
  pageStructure: [
    { name: 'Boards', purpose: 'List all boards', requiredData: ['Board'] },
    { name: 'Board', purpose: 'Kanban board with columns and cards', requiredData: ['Board', 'Card'] },
  ],
  apiEndpoints: [
    { path: '/api/boards', method: 'GET', purpose: 'List boards' },
    { path: '/api/cards', method: 'POST', purpose: 'Create a card' },
  ],
  dataEntities: [
    { name: 'Board', relationships: ['Card'] },
    { name: 'Card', relationships: ['Board', 'Comment'] },
  ],
  accessControl: {
    roles: ['admin', 'member'],
    rolePermissions: { admin: ['create', 'read', 'update', 'delete'], member: ['create', 'read', 'update'] },
  },
}

const schemas: SchemaOutput = {
  database: {
    tables: [
      {
        name: 'Board',
        columns: [
          { name: 'id', type: 'uuid', required: true },
          { name: 'title', type: 'string', required: true },
          { name: 'ownerId', type: 'uuid', required: true },
          { name: 'createdAt', type: 'datetime', required: true },
        ],
        relationships: ['Card'],
      },
      {
        name: 'Card',
        columns: [
          { name: 'id', type: 'uuid', required: true },
          { name: 'title', type: 'string', required: true },
          { name: 'boardId', type: 'uuid', required: true },
          { name: 'assigneeId', type: 'uuid', required: false },
        ],
        relationships: ['Board'],
      },
    ],
  },
  api: {
    endpoints: [
      { path: '/api/boards', method: 'GET', requestSchema: {}, responseSchema: {} },
      { path: '/api/cards', method: 'POST', requestSchema: { title: 'string', boardId: 'uuid' }, responseSchema: {} },
    ],
  },
  ui: {
    pages: [
      { route: '/boards', components: ['BoardList', 'CreateBoardDialog'], dataSource: 'GET /api/boards' },
      { route: '/boards/[id]', components: ['KanbanBoard', 'CardDialog'], dataSource: 'GET /api/cards' },
    ],
  },
}

const implementationPlan: ImplementationPlan = {
  summary: 'Kanban board with cards',
  prismaSchema: 'model Board {\n  id String @id\n}\n\nmodel Card {\n  id String @id\n}',
  apiHandlers: [{ path: 'app/api/boards/route.ts', content: '' }],
  uiPages: [{ path: 'app/boards/page.tsx', content: '' }],
  rbac: { admin: ['manage'] },
  checklist: [],
}

const docs = buildPlanningDocs(
  'Build a kanban board where a team moves cards between columns',
  intent,
  design,
  schemas,
  implementationPlan
)

const all: Array<[string, string]> = Object.entries(docs)

describe('buildPlanningDocs', () => {
  it('produces substantial documents, not stubs', () => {
    for (const [name, content] of all) {
      expect(content.length, `${name} is too short`).toBeGreaterThan(800)
      expect(content.split('\n').length, `${name} has too few lines`).toBeGreaterThan(20)
    }
  })

  it('never describes the compiler instead of the user app', () => {
    for (const [name, content] of all) {
      expect(content, `${name} describes AppForge itself`).not.toMatch(/compiler workspace|natural-language app idea|Artifacts should be exportable/i)
    }
  })

  it('leaves no placeholder text', () => {
    for (const [name, content] of all) {
      expect(content, `${name} contains a placeholder`).not.toMatch(/\bTODO\b|\bTBD\b|Replace with|lorem ipsum|\bFIXME\b/i)
    }
  })

  it('names every table, page and endpoint it is built from', () => {
    const { prd, trd, appFlow, backendSchema, implementationPlan: plan } = docs

    for (const table of schemas.database.tables) {
      expect(backendSchema).toContain(table.name)
      expect(trd).toContain(table.name)
    }
    for (const page of schemas.ui.pages) {
      expect(appFlow).toContain(page.route)
      expect(trd).toContain(page.route)
    }
    for (const endpoint of schemas.api.endpoints) {
      expect(backendSchema).toContain(endpoint.path)
      expect(trd).toContain(endpoint.path)
    }
    expect(prd).toContain('admin')
    expect(prd).toContain('member')
    expect(plan).toContain('app/api/boards/route.ts')
  })

  it('carries the real Prisma schema and permissions into the backend doc', () => {
    expect(docs.backendSchema).toContain('model Board')
    expect(docs.backendSchema).toContain('model Card')
    expect(docs.backendSchema).toContain('Permissions Matrix')
    expect(docs.trd).toContain('create, read, update, delete')
  })

  it('cites the endpoint that matches each feature', () => {
    const rows = docs.prd.split('\n')
    expect(rows.find((row) => row.includes('Create a board'))).toContain('/api/boards')
    expect(rows.find((row) => row.includes('Move cards between columns'))).toContain('/api/cards')
  })

  it('explicitly states scope where a section could be empty', () => {
    expect(docs.prd).toContain('Explicitly Out Of Scope')
    expect(docs.prd).toContain('None')
    expect(docs.prd).not.toMatch(/## 5\. Premium \/ Gated Features\s*\n\s*\n##/)
  })
})
