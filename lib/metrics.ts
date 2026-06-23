import { prisma } from './db'

export interface GenerationMetrics {
  jobId: string
  userId: string
  mode: 'fast' | 'balanced' | 'precise'
  totalDuration: number
  totalTokens: number
  success: boolean
  errorRate: number
  completionRate: number
  quality?: number
  consistency?: number
  timestamp: Date
}

export interface QualityScore {
  nameConsistency: number // 0-100: Are names consistent across layers?
  schemaCompleteness: number // 0-100: Are all required fields present?
  relationshipValidity: number // 0-100: Are relationships valid?
  typeCorrectness: number // 0-100: Are types correct?
  overall: number // 0-100: Overall quality score
}

/**
 * Calculate quality score for generated app config
 */
export function calculateQualityScore(config: any): QualityScore {
  let nameConsistency = 100
  let schemaCompleteness = 100
  let relationshipValidity = 100
  let typeCorrectness = 100

  // Check 1: Name Consistency
  const tables = config.database?.tables || []
  const apiEndpoints = config.api?.endpoints || config.api?.routes || []
  const components = config.components || config.ui?.pages || []

  const allNames = new Set<string>()
  tables.forEach((t: any) => {
    allNames.add(t.name.toLowerCase())
    t.columns?.forEach((c: any) => allNames.add(c.name.toLowerCase()))
  })

  apiEndpoints.forEach((r: any) => {
    const matches = (r.path || r.route || '').match(/\{(\w+)\}/g) || []
    matches.forEach((m: string) => {
      const paramName = m.replace(/[{}]/g, '').toLowerCase()
      if (!allNames.has(paramName)) {
        nameConsistency -= 5
      }
    })
  })

  // Check 2: Schema Completeness
  if (tables.length === 0) schemaCompleteness = 0
  tables.forEach((table: any) => {
    if (!table.columns || table.columns.length === 0) {
      schemaCompleteness -= 20
    }
  })

  // Check 3: Relationship Validity
  tables.forEach((table: any) => {
    table.columns?.forEach((col: any) => {
      if (col.type?.includes('FK') || col.type?.includes('foreign')) {
        const refTable = col.references
        if (refTable && !tables.some((t: any) => t.name === refTable)) {
          relationshipValidity -= 10
        }
      }
    })
  })

  // Check 4: Type Correctness
  const validTypes = [
    'string',
    'number',
    'boolean',
    'date',
    'timestamp',
    'uuid',
    'json',
    'array',
    'integer',
    'text',
    'varchar',
  ]
  tables.forEach((table: any) => {
    table.columns?.forEach((col: any) => {
      const colType = col.type?.toLowerCase() || ''
      if (
        colType &&
        !validTypes.some((vt) => colType.includes(vt)) &&
        !colType.includes('FK')
      ) {
        typeCorrectness -= 5
      }
    })
  })

  // Ensure scores are between 0-100
  const scores = {
    nameConsistency: Math.max(0, Math.min(100, nameConsistency)),
    schemaCompleteness: Math.max(0, Math.min(100, schemaCompleteness)),
    relationshipValidity: Math.max(0, Math.min(100, relationshipValidity)),
    typeCorrectness: Math.max(0, Math.min(100, typeCorrectness)),
    overall: 0,
  }

  // Calculate overall score as weighted average
  scores.overall = Math.round(
    scores.nameConsistency * 0.2 +
      scores.schemaCompleteness * 0.3 +
      scores.relationshipValidity * 0.3 +
      scores.typeCorrectness * 0.2
  )

  return scores
}

/**
 * Record metrics for a generation in the database
 */
export async function recordGenerationMetrics(
  jobId: string,
  userId: string,
  metrics: Partial<GenerationMetrics>
) {
  try {
    // Store in a simple JSON format for now
    // In production, you might want a dedicated metrics table
    console.log('[Metrics] Recording:', {
      jobId,
      userId,
      ...metrics,
    })

    // You could store this in a metrics table or send to an analytics service
    // await prisma.metric.create({ data: { jobId, userId, ...metrics } })
  } catch (error) {
    console.error('[Metrics] Error recording metrics:', error)
  }
}

/**
 * Get aggregated metrics for a user
 */
export async function getUserMetrics(userId: string) {
  try {
    const generations = await prisma.generation.findMany({
      where: { userId },
      select: {
        id: true,
        status: true,
        mode: true,
        createdAt: true,
        completedAt: true,
        totalLatencyMs: true,
        pipelineStages: {
          select: {
            inputTokens: true,
            outputTokens: true,
          },
        },
      },
    })

    const totalGenerations = generations.length
    const completedGenerations = generations.filter((g) =>
      ['completed', 'success'].includes(g.status)
    ).length
    const failedGenerations = generations.filter((g) => g.status === 'failed').length

    const modes = {
      fast: 0,
      balanced: 0,
      precise: 0,
    }

    let totalTokens = 0
    let totalDuration = 0

    generations.forEach((gen) => {
      if (gen.mode) {
        modes[gen.mode as keyof typeof modes]++
      }

      // Sum tokens from pipeline stages when available
      if (gen.pipelineStages && gen.pipelineStages.length > 0) {
        gen.pipelineStages.forEach((s: any) => {
          if (s.inputTokens) totalTokens += s.inputTokens
          if (s.outputTokens) totalTokens += s.outputTokens
        })
      }

      if (typeof gen.totalLatencyMs === 'number') {
        totalDuration += gen.totalLatencyMs
      }
    })

    return {
      totalGenerations,
      completedGenerations,
      failedGenerations,
      successRate: totalGenerations > 0 ? (completedGenerations / totalGenerations) * 100 : 0,
      modes,
      averageTokensPerGeneration: totalGenerations > 0 ? Math.round(totalTokens / totalGenerations) : 0,
      averageDuration: totalGenerations > 0 ? Math.round(totalDuration / totalGenerations) : 0,
    }
  } catch (error) {
    console.error('[Metrics] Error getting user metrics:', error)
    return null
  }
}

/**
 * Get system-wide metrics
 */
export async function getSystemMetrics() {
  try {
    const totalGenerations = await prisma.generation.count()
    const completedGenerations = await prisma.generation.count({
      where: { status: { in: ['completed', 'success'] } },
    })
    const failedGenerations = await prisma.generation.count({
      where: { status: 'failed' },
    })

    const generations = await prisma.generation.findMany({
      select: {
        mode: true,
        pipelineStages: {
          select: {
            inputTokens: true,
            outputTokens: true,
          },
        },
      },
    })

    const modes = {
      fast: 0,
      balanced: 0,
      precise: 0,
    }

    let totalTokens = 0

    generations.forEach((gen) => {
      if (gen.mode) {
        modes[gen.mode as keyof typeof modes]++
      }
      if (gen.pipelineStages && gen.pipelineStages.length > 0) {
        gen.pipelineStages.forEach((s: any) => {
          if (s.inputTokens) totalTokens += s.inputTokens
          if (s.outputTokens) totalTokens += s.outputTokens
        })
      }
    })

    return {
      totalGenerations,
      completedGenerations,
      failedGenerations,
      successRate: totalGenerations > 0 ? (completedGenerations / totalGenerations) * 100 : 0,
      modes,
      estimatedCost:
        (totalTokens / 1000000) * 3 + (totalTokens / 1000000) * 15 * 0.5, // Conservative estimate
    }
  } catch (error) {
    console.error('[Metrics] Error getting system metrics:', error)
    return null
  }
}
