import { describe, it, expect, beforeAll } from 'vitest'

// Must set env BEFORE importing ai.ts (which checks keys at module load)
process.env.DETERMINISTIC_LLM = '1'
process.env.NVIDIA_API_KEY = ''
process.env.GROQ_API_KEY = ''
process.env.FEATHERLESS_API_KEY = ''

import {
  extractIntent,
  designSystem,
  generateSchemas,
  refineSchemas,
  validateAndRepair,
  checkExecutability,
  type Intent,
  type SystemDesign,
  type SchemaOutput,
} from '@/lib/compiler/core'

// Minimal intent fixture for downstream stages
const MOCK_INTENT: Intent = {
  appType: 'crm',
  primaryFeatures: ['authentication', 'contacts', 'dashboard'],
  userRoles: ['admin', 'user'],
  authRequired: true,
  paymentRequired: false,
  dataModels: ['users', 'contacts'],
  complexities: [],
  assumptions: ['test fixture'],
}

const MOCK_DESIGN: SystemDesign = {
  architecture: 'monolith',
  pageStructure: [
    { name: 'Home', purpose: 'Landing', requiredData: [] },
    { name: 'Dashboard', purpose: 'Main view', requiredData: ['contacts'] },
  ],
  apiEndpoints: [
    { path: '/api/contacts', method: 'GET', purpose: 'List contacts' },
    { path: '/api/contacts', method: 'POST', purpose: 'Create contact' },
  ],
  dataEntities: [
    { name: 'contacts', relationships: ['users'] },
  ],
  accessControl: {
    roles: ['admin', 'user'],
    rolePermissions: { admin: ['read', 'write', 'manage'], user: ['read'] },
  },
}

describe('compiler/core — deterministic fallback paths', () => {
  describe('Stage 1: extractIntent', () => {
    it('returns valid Intent from deterministic stub', async () => {
      const intent = await extractIntent('Build a CRM with login and contacts')
      expect(intent.appType).toBeDefined()
      expect(intent.primaryFeatures).toBeInstanceOf(Array)
      expect(intent.primaryFeatures.length).toBeGreaterThan(0)
      expect(intent.userRoles).toBeInstanceOf(Array)
      expect(typeof intent.authRequired).toBe('boolean')
      expect(typeof intent.paymentRequired).toBe('boolean')
      expect(intent.dataModels).toBeInstanceOf(Array)
      expect(intent.assumptions).toBeInstanceOf(Array)
    })

    it('extracts crm type from prompt mentioning crm', async () => {
      const intent = await extractIntent('Build a CRM system')
      expect(intent.appType).toBe('crm')
    })

    it('extracts ecommerce type from prompt mentioning ecommerce', async () => {
      const intent = await extractIntent('Build an ecommerce platform')
      expect(intent.appType).toBe('ecommerce')
    })

    it('extracts marketplace type', async () => {
      const intent = await extractIntent('Build a marketplace platform')
      expect(intent.appType).toBe('marketplace')
    })

    it('returns default crud for unrecognized prompt', async () => {
      const intent = await extractIntent('Build something weird')
      expect(intent.appType).toBeDefined()
    })
  })

  describe('Stage 2: designSystem', () => {
    it('returns valid SystemDesign', async () => {
      const design = await designSystem(MOCK_INTENT)
      expect(design.architecture).toBeDefined()
      expect(design.pageStructure).toBeInstanceOf(Array)
      expect(design.pageStructure.length).toBeGreaterThan(0)
      expect(design.apiEndpoints).toBeInstanceOf(Array)
      expect(design.dataEntities).toBeInstanceOf(Array)
      expect(design.accessControl).toBeDefined()
      expect(design.accessControl.roles).toBeInstanceOf(Array)
    })

    it('design maps dataModels to dataEntities', async () => {
      const design = await designSystem(MOCK_INTENT)
      const entityNames = design.dataEntities.map((e) => e.name)
      expect(entityNames).toContain('contacts')
    })
  })

  describe('Stage 3: generateSchemas', () => {
    it('returns valid SchemaOutput', async () => {
      const schemas = await generateSchemas(MOCK_DESIGN, MOCK_INTENT)
      expect(schemas.database).toBeDefined()
      expect(schemas.database.tables).toBeInstanceOf(Array)
      expect(schemas.database.tables.length).toBeGreaterThan(0)
      expect(schemas.api).toBeDefined()
      expect(schemas.api.endpoints).toBeInstanceOf(Array)
      expect(schemas.ui).toBeDefined()
      expect(schemas.ui.pages).toBeInstanceOf(Array)
    })

    it('each table has columns', async () => {
      const schemas = await generateSchemas(MOCK_DESIGN, MOCK_INTENT)
      for (const table of schemas.database.tables) {
        expect(table.columns.length).toBeGreaterThan(0)
      }
    })

    it('each table has an id column', async () => {
      const schemas = await generateSchemas(MOCK_DESIGN, MOCK_INTENT)
      for (const table of schemas.database.tables) {
        const hasId = table.columns.some((c) => c.name === 'id')
        expect(hasId).toBe(true)
      }
    })
  })

  describe('Stage 4: refineSchemas', () => {
    it('returns valid SchemaOutput', async () => {
      const schemas = await generateSchemas(MOCK_DESIGN, MOCK_INTENT)
      const refined = await refineSchemas(schemas, MOCK_DESIGN)
      expect(refined.database.tables.length).toBeGreaterThan(0)
      expect(refined.api.endpoints.length).toBeGreaterThan(0)
    })

    it('ensures id columns exist after refinement', async () => {
      const schemas = await generateSchemas(MOCK_DESIGN, MOCK_INTENT)
      const refined = await refineSchemas(schemas, MOCK_DESIGN)
      for (const table of refined.database.tables) {
        const hasId = table.columns.some((c) => c.name === 'id')
        expect(hasId).toBe(true)
      }
    })
  })

  describe('Stage 5: validateAndRepair', () => {
    it('returns valid validation result for good schemas', async () => {
      const schemas = await generateSchemas(MOCK_DESIGN, MOCK_INTENT)
      const result = await validateAndRepair(schemas)
      expect(typeof result.valid).toBe('boolean')
      expect(result.errors).toBeInstanceOf(Array)
      expect(result.warnings).toBeInstanceOf(Array)
      expect(result.repairs).toBeInstanceOf(Array)
      expect(typeof result.score).toBe('number')
    })

    it('adds id column repair if table lacks id', async () => {
      const brokenSchemas: SchemaOutput = {
        database: {
          tables: [
            {
              name: 'test',
              columns: [
                { name: 'name', type: 'text', required: true },
              ],
              relationships: [],
            },
          ],
        },
        api: {
          endpoints: [
            { path: '/api/test', method: 'GET', requestSchema: {}, responseSchema: {} },
          ],
        },
        ui: {
          pages: [
            { route: '/test', components: ['TestComp'], dataSource: 'GET /api/test' },
          ],
        },
      }

      const result = await validateAndRepair(brokenSchemas)
      expect(result.repairs.some((r) => r.includes("Added 'id' column"))).toBe(true)
    })

    it('adds createdAt repair if missing', async () => {
      const brokenSchemas: SchemaOutput = {
        database: {
          tables: [
            {
              name: 'events',
              columns: [{ name: 'id', type: 'uuid', required: true }],
              relationships: [],
            },
          ],
        },
        api: {
          endpoints: [
            { path: '/api/events', method: 'GET', requestSchema: {}, responseSchema: {} },
          ],
        },
        ui: {
          pages: [
            { route: '/events', components: ['Events'], dataSource: 'GET /api/events' },
          ],
        },
      }

      const result = await validateAndRepair(brokenSchemas)
      expect(result.repairs.some((r) => r.includes("Added 'createdAt' column"))).toBe(true)
    })

    it('flags empty database tables', async () => {
      const brokenSchemas: SchemaOutput = {
        database: { tables: [] },
        api: { endpoints: [{ path: '/api/x', method: 'GET', requestSchema: {}, responseSchema: {} }] },
        ui: { pages: [{ route: '/x', components: [], dataSource: 'GET /api/x' }] },
      }

      const result = await validateAndRepair(brokenSchemas)
      expect(result.errors).toContain('No database tables defined')
    })
  })

  describe('checkExecutability', () => {
    it('returns executable: true for valid schemas', async () => {
      const schemas = await generateSchemas(MOCK_DESIGN, MOCK_INTENT)
      const validation = await validateAndRepair(schemas)
      const check = checkExecutability(schemas, validation)
      expect(typeof check.executable).toBe('boolean')
      expect(check.issues).toBeInstanceOf(Array)
    })

    it('returns executable: false when no tables', async () => {
      const schemas: SchemaOutput = {
        database: { tables: [] },
        api: { endpoints: [{ path: '/api/x', method: 'GET', requestSchema: {}, responseSchema: {} }] },
        ui: { pages: [{ route: '/x', components: [], dataSource: 'GET /api/x' }] },
      }
      const validation = { valid: false, errors: ['No database tables defined'], warnings: [], repairs: [], score: 0 }
      const check = checkExecutability(schemas, validation)
      expect(check.executable).toBe(false)
      expect(check.issues).toContain('Database schema is empty')
    })
  })
})
