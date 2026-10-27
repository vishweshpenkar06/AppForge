import { describe, it, expect } from 'vitest'
import { assembleDeployFiles } from '@/lib/github-export'

const config = {
  metadata: { name: 'Test App' },
  runtime: { sql: 'CREATE TABLE users (id TEXT);' },
} as any

describe('assembleDeployFiles', () => {
  it('keeps SQL and Prisma schemas in separate files', () => {
    const files = assembleDeployFiles(config, {
      'prisma.schema': 'model User { id String @id }',
    })

    expect(files['database/schema.sql']).toContain('CREATE TABLE')
    expect(files['database/schema.prisma']).toContain('model User')
    expect(files['database/schema.sql']).not.toContain('model User')
  })

  it('puts only known planning docs in docs/ and skips code artifacts', () => {
    const files = assembleDeployFiles(config, {
      'PRD.md': '# PRD',
      'prisma.schema': 'model User { id String @id }',
      'app/api/users/route.ts': 'export async function GET() {}',
      'app/users/page.tsx': 'export default function Page() {}',
    })

    expect(files['docs/PRD - Product Requirements.md']).toBe('# PRD')
    expect(Object.keys(files).some((f) => f.startsWith('docs/') && f.endsWith('.md.md'))).toBe(false)
    expect(files['docs/app/api/users/route.ts.md']).toBeUndefined()
    expect(files['docs/prisma.schema.md']).toBeUndefined()
  })

  it('always includes a README', () => {
    const files = assembleDeployFiles({}, null)
    expect(files['README.md']).toContain('AppForge Export')
  })
})
