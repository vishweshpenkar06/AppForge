import { describe, it, expect } from 'vitest'
import { generateSQL, generateExpressServer } from '@/lib/runtime/generators'
import type { AppConfig } from '@/lib/schemas'

// Minimal valid AppConfig fixture for generators
function makeFixture(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    meta: {
      appName: 'TestApp',
      description: 'A test application',
      version: '1.0',
      generatedAt: '2026-01-01T00:00:00Z',
      assumptions: [],
    },
    database: {
      tables: [
        {
          name: 'users',
          columns: [
            { name: 'id', type: 'uuid', primary_key: true, nullable: false },
            { name: 'email', type: 'text', nullable: false },
            { name: 'name', type: 'text', nullable: true },
            { name: 'createdAt', type: 'timestamptz', nullable: false },
          ],
        },
        {
          name: 'posts',
          columns: [
            { name: 'id', type: 'uuid', primary_key: true, nullable: false },
            { name: 'title', type: 'text', nullable: false },
            { name: 'authorId', type: 'uuid', nullable: false, foreign_key: { table: 'users', column: 'id' } },
            { name: 'createdAt', type: 'timestamptz', nullable: false },
          ],
        },
      ],
    },
    api: {
      endpoints: [
        {
          method: 'GET',
          route: '/users',
          description: 'List all users',
          response: {},
          auth_required: false,
          roles_allowed: [],
        },
        {
          method: 'POST',
          route: '/users',
          description: 'Create a user',
          requestBody: { email: { type: 'text', required: true } },
          response: {},
          auth_required: true,
          roles_allowed: ['admin'],
        },
        {
          method: 'DELETE',
          route: '/users/:id',
          description: 'Delete a user',
          response: {},
          auth_required: true,
          roles_allowed: ['admin'],
        },
      ],
    },
    ui: {
      pages: [
        {
          id: 'home',
          name: 'Home',
          route: '/',
          layout: 'default',
          components: [{ type: 'card' }],
          access: ['user'],
        },
      ],
    },
    auth: {
      provider: 'local',
      roles: [
        { name: 'admin', permissions: ['read', 'write', 'delete'], can_access_pages: [], can_call_endpoints: [], premium_required: false, can_perform: ['create', 'read', 'update', 'delete'] },
        { name: 'user', permissions: ['read'], can_access_pages: [], can_call_endpoints: [], premium_required: false, can_perform: ['read'] },
      ],
      session_strategy: 'jwt',
      token_expiry: '24h',
      refresh_token: true,
      premium_gates: [],
      user_flows: [],
    },
    ...overrides,
  } as AppConfig
}

describe('generateSQL', () => {
  it('produces a string', () => {
    const sql = generateSQL(makeFixture())
    expect(typeof sql).toBe('string')
  })

  it('contains CREATE TABLE statements', () => {
    const sql = generateSQL(makeFixture())
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS')
  })

  it('contains all table names', () => {
    const sql = generateSQL(makeFixture())
    expect(sql).toContain('"users"')
    expect(sql).toContain('"posts"')
  })

  it('maps uuid to TEXT', () => {
    const sql = generateSQL(makeFixture())
    expect(sql).toContain('"id" TEXT')
  })

  it('marks non-nullable columns as NOT NULL', () => {
    const sql = generateSQL(makeFixture())
    expect(sql).toContain('"email" TEXT NOT NULL')
  })

  it('includes PRIMARY KEY for primary_key columns', () => {
    const sql = generateSQL(makeFixture())
    expect(sql).toContain('PRIMARY KEY')
  })

  it('generates FOREIGN KEY constraints', () => {
    const sql = generateSQL(makeFixture())
    expect(sql).toContain('FOREIGN KEY')
    expect(sql).toContain('REFERENCES "users"("id")')
  })

  it('handles tables with no columns gracefully', () => {
    const fixture = makeFixture()
    fixture.database.tables.push({ name: 'empty', columns: [] })
    const sql = generateSQL(fixture)
    expect(sql).toContain('"empty"')
  })

  it('output is valid SQL structure', () => {
    const sql = generateSQL(makeFixture())
    expect(sql.startsWith('-- AppForge Generated Schema')).toBe(true)
  })
})

describe('generateExpressServer', () => {
  it('produces a string', () => {
    const server = generateExpressServer(makeFixture())
    expect(typeof server).toBe('string')
  })

  it('contains express require', () => {
    const server = generateExpressServer(makeFixture())
    expect(server).toContain("require('express')")
  })

  it('contains auth middleware', () => {
    const server = generateExpressServer(makeFixture())
    expect(server).toContain('requireAuth')
    expect(server).toContain('requireRole')
  })

  it('generates route handlers for each endpoint', () => {
    const server = generateExpressServer(makeFixture())
    expect(server).toContain("app.get('/api/v1/users'")
    expect(server).toContain("app.post('/api/v1/users'")
    expect(server).toContain("app.delete('/api/v1/users/:id'")
  })

  it('includes auth middleware on protected routes', () => {
    const server = generateExpressServer(makeFixture())
    // POST /users has auth_required: true
    const postLine = server.split('\n').find((l) => l.includes("app.post('/api/v1/users'"))
    expect(postLine).toContain('requireAuth')
    expect(postLine).toContain('requireRole')
  })

  it('includes login route', () => {
    const server = generateExpressServer(makeFixture())
    expect(server).toContain('/api/v1/auth/login')
  })

  it('uses token_expiry from config', () => {
    const fixture = makeFixture()
    fixture.auth.token_expiry = '12h'
    const server = generateExpressServer(fixture)
    expect(server).toContain('12h')
  })

  it('sets up server on PORT from env', () => {
    const server = generateExpressServer(makeFixture())
    expect(server).toContain('process.env.PORT || 3001')
  })

  it('includes error handling in route handlers', () => {
    const server = generateExpressServer(makeFixture())
    expect(server).toContain('catch')
    expect(server).toContain('res.status(500)')
  })

  it('output has the base path /api/v1', () => {
    const server = generateExpressServer(makeFixture())
    expect(server).toContain('/api/v1')
  })
})
