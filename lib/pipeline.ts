// Legacy pipeline — consolidated into lib/compiler/core.ts
// This file delegates to core.ts stages and preserves DB persistence.

import { prisma } from './db'
import { extractIntent, designSystem, generateSchemas, refineSchemas, validateAndRepair, checkExecutability } from './compiler/core'
import { buildImplementationPlan, buildPlanningDocs } from './compiler/export'

// Re-export stage functions for backward compatibility
export { extractIntent as runStage1 } from './compiler/core'
export { designSystem as runStage2 } from './compiler/core'
export { generateSchemas as runStage3 } from './compiler/core'
export { refineSchemas as runStage4 } from './compiler/core'
export { validateAndRepair as runStage5 } from './compiler/core'

export interface PipelineStageResult {
  stage: string
  success: boolean
  output: any
  latencyMs: number
  inputTokens: number
  outputTokens: number
  error?: string
}

export interface PipelineExecutionResult {
  jobId: string
  success: boolean
  appConfig?: any | null
  implementationPlan?: any
  docs?: any
  stages: PipelineStageResult[]
  totalLatencyMs: number
  totalTokens: number
  errorMessage?: string
}

/**
 * Main pipeline orchestrator — delegates to core.ts stages,
 * handles DB persistence, and returns a PipelineExecutionResult.
 */
export async function generateApplication(
  jobId: string,
  prompt: string,
  mode: 'fast' | 'balanced' | 'precise'
): Promise<PipelineExecutionResult> {
  const pipelineStartTime = Date.now()
  const stages: PipelineStageResult[] = []
  let totalInputTokens = 0
  let totalOutputTokens = 0

  function recordStage(name: string, startMs: number, success: boolean, inputTokens = 0, outputTokens = 0, error?: string) {
    const latencyMs = Date.now() - startMs
    totalInputTokens += inputTokens
    totalOutputTokens += outputTokens
    stages.push({ stage: name, success, output: null, latencyMs, inputTokens, outputTokens, error })
  }

  try {
    // Stage 1: Intent
    let start = Date.now()
    const intent = await extractIntent(prompt)
    recordStage('intent', start, true)

    // Stage 2: Design
    start = Date.now()
    const design = await designSystem(intent)
    recordStage('design', start, true)

    // Stage 3: Schemas
    start = Date.now()
    const schemas = await generateSchemas(design, intent)
    recordStage('schema', start, true)

    // Stage 4: Refinement
    start = Date.now()
    const refined = await refineSchemas(schemas, design)
    recordStage('refinement', start, true)

    // Stage 5: Validation & Repair
    start = Date.now()
    const validation = await validateAndRepair(refined)
    recordStage('validation', start, validation.valid, 0, 0, validation.errors.length > 0 ? validation.errors.join(', ') : undefined)

    const execution = checkExecutability(refined, validation)

    // Stage 6: Implementation plan + docs
    start = Date.now()
    let implementationPlan = null
    let docs = null
    try {
      implementationPlan = buildImplementationPlan(refined, design)
      docs = buildPlanningDocs(prompt, intent, design, refined, implementationPlan)
    } catch (err) {
      console.warn('[Pipeline] Failed to build implementation plan:', err)
    }
    recordStage('export', start, implementationPlan !== null)

    // Persist with artifacts
    const totalLatencyMs = Date.now() - pipelineStartTime
    const artifacts: Record<string, string> = {}
    if (docs) {
      artifacts['PRD.md'] = docs.prd
      artifacts['TRD.md'] = docs.trd
      artifacts['AppFlow.md'] = docs.appFlow
      artifacts['UI-UX-BRIEF.md'] = docs.uiUxBrief
      artifacts['BACKEND-SCHEMA.md'] = docs.backendSchema
      artifacts['IMPLEMENTATION-PLAN.md'] = docs.implementationPlan
    }
    if (implementationPlan) {
      artifacts['prisma.schema'] = implementationPlan.prismaSchema
      for (const h of implementationPlan.apiHandlers) artifacts[h.path] = h.content
      for (const p of implementationPlan.uiPages) artifacts[p.path] = p.content
    }

    try {
      await prisma.appConfig.create({
        data: {
          generationId: jobId,
          config: refined as any,
          artifacts: Object.keys(artifacts).length > 0 ? artifacts : undefined,
          validationPassed: validation.valid,
        },
      })
    } catch (err) {
      console.warn('[Pipeline] Failed to persist appConfig:', err)
    }

    await prisma.generation.update({
      where: { id: jobId },
      data: {
        status: execution.executable ? 'completed' : 'failed',
        config: refined as any,
        metadata: { stages, totalLatencyMs, mode } as any,
        completedAt: new Date(),
      },
    })

    return {
      jobId,
      success: execution.executable,
      appConfig: refined,
      implementationPlan,
      docs,
      stages,
      totalLatencyMs,
      totalTokens: totalInputTokens + totalOutputTokens,
    }
  } catch (error) {
    const totalLatencyMs = Date.now() - pipelineStartTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    await prisma.generation.update({
      where: { id: jobId },
      data: { status: 'failed', errorMessage, metadata: { stages, totalLatencyMs, mode } as any },
    }).catch(console.error)

    return {
      jobId,
      success: false,
      stages,
      totalLatencyMs,
      totalTokens: totalInputTokens + totalOutputTokens,
      errorMessage,
    }
  }
}
