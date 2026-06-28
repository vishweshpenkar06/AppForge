// Legacy pipeline — consolidated into lib/compiler/core.ts
// This file delegates to core.ts stages and preserves DB persistence.

import { prisma } from './db'
import { extractIntent, designSystem, generateSchemas, refineSchemas, validateAndRepair, checkExecutability } from './compiler/core'
import { buildImplementationPlan } from './compiler/export'

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

  function recordStage(name: string, startMs: number, success: boolean, error?: string) {
    const latencyMs = Date.now() - startMs
    stages.push({ stage: name, success, output: null, latencyMs, inputTokens: 0, outputTokens: 0, error })
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
    recordStage('validation', start, validation.valid, validation.errors.join(', '))

    const execution = checkExecutability(refined, validation)

    // Stage 6: Implementation plan
    start = Date.now()
    let implementationPlan = null
    try {
      implementationPlan = buildImplementationPlan(refined, design)
    } catch (err) {
      console.warn('[Pipeline] Failed to build implementation plan:', err)
    }
    recordStage('export', start, implementationPlan !== null)

    // Persist
    const totalLatencyMs = Date.now() - pipelineStartTime
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
      stages,
      totalLatencyMs,
      totalTokens: 0,
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
      totalTokens: 0,
      errorMessage,
    }
  }
}
