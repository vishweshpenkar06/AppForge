import { describe, it, expect } from 'vitest'
import { coerceSchemas, normalizeDesign } from '@/lib/compiler/core'
import type { SystemDesign } from '@/lib/compiler/core'

const design: SystemDesign = {
  architecture: 'monolith',
  pageStructure: [
    { name: 'Game Play', purpose: 'Play the game', requiredData: ['Game'] },
    { name: 'High Scores', purpose: 'Leaderboard', requiredData: ['Score'] },
  ],
  apiEndpoints: [{ path: '/api/games', method: 'GET', purpose: 'List games' }],
  dataEntities: [{ name: 'Game', relationships: [] }],
  accessControl: { roles: ['player'], rolePermissions: { player: ['read'] } },
}

// Shapes observed from a real Groq response for the snake prompt.
const rawSchema = {
  database: {
    tables: [
      {
        name: 'games',
        columns: [
          { name: 'id', type: 'uuid', required: true },
          { name: 'bestScore', type: 'integer' },
        ],
        relationships: [{ name: 'scores' }],
      },
    ],
  },
  api: {
    endpoints: [{ path: '/api/games', method: 'patch', requestSchema: { score: 'number' } }],
  },
}

describe('coerceSchemas', () => {
  it('fills the fields a model drops instead of failing validation', () => {
    const coerced: any = coerceSchemas(rawSchema, design)

    expect(coerced.api.endpoints.map((endpoint: any) => endpoint.method)).toEqual(['GET', 'PUT'])
    const patch = coerced.api.endpoints[1]
    expect(patch.responseSchema).toEqual({})
    expect(patch.requestSchema).toEqual({ score: 'number' })
    expect(coerced.database.tables[0].columns[1].required).toBe(false)
    expect(coerced.database.tables[0].relationships).toEqual(['scores'])
    expect(coerced.ui.pages.map((page: any) => page.route)).toEqual(['/game-play', '/high-scores'])
  })

  it('keeps pages the model did provide', () => {
    const coerced: any = coerceSchemas(
      { ui: { pages: [{ route: '/play', components: [{ name: 'Board' }], dataSource: 'GET /api/games' }] } },
      design
    )
    expect(coerced.ui.pages).toHaveLength(1)
    expect(coerced.ui.pages[0].components).toEqual(['Board'])
  })

  it('merges design endpoints with the schema endpoints instead of trusting a shorter list', () => {
    const coerced: any = coerceSchemas({ api: { endpoints: [{ path: '/api/games', method: 'post', requestSchema: { title: 'string' } }] } }, design)
    expect(coerced.api.endpoints).toHaveLength(2)
    expect(coerced.api.endpoints.map((endpoint: any) => endpoint.method)).toEqual(['GET', 'POST'])
    expect(coerced.api.endpoints[1].requestSchema).toEqual({ title: 'string' })
  })

  it('backfills endpoints from the design when the model drops them', () => {
    const coerced: any = coerceSchemas({ api: { endpoints: [] } }, design)
    expect(coerced.api.endpoints).toEqual([
      { path: '/api/games', method: 'GET', purpose: 'List games', requestSchema: {}, responseSchema: {} },
    ])
  })
})

describe('normalizeDesign', () => {
  it('turns the shapes models return into the design schema', () => {
    const normalized: any = normalizeDesign({
      architecture: 'Modular monolith',
      pageStructure: [{ name: { name: 'Play' }, purpose: 'Gameplay', requiredData: [{ name: 'Game' }] }],
      apiEndpoints: [{ path: '/api/games', method: 'patch', purpose: 'Update a game' }],
      dataEntities: [{ name: 'Game', relationships: [{ name: 'Score' }] }],
      accessControl: { roles: [{ name: 'player' }], rolePermissions: { player: 'read' } },
    })

    expect(normalized.architecture).toBe('monolith')
    expect(normalized.pageStructure[0].name).toBe('Play')
    expect(normalized.apiEndpoints[0].method).toBe('PUT')
    expect(normalized.dataEntities[0].relationships).toEqual(['Score'])
    expect(normalized.accessControl.roles).toEqual(['player'])
    expect(normalized.accessControl.rolePermissions.player).toEqual(['read'])
  })
})
