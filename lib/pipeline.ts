import { prisma } from './db'
import { callLLM, STAGE_CONFIGS, SYSTEM_PROMPTS, getConfigsByMode, extractJSON } from './ai'
import { validateAppConfig, repairAppConfig } from './validation'
import { AppConfig, appConfigSchema } from './schemas'
import { buildImplementationPlan } from './compiler/export'

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
  appConfig?: AppConfig
  stages: PipelineStageResult[]
  totalLatencyMs: number
  totalTokens: number
  errorMessage?: string
}

/**
 * Main pipeline orchestrator for generating applications
 */
export async function generateApplication(
  jobId: string,
  prompt: string,
  mode: 'fast' | 'balanced' | 'precise'
): Promise<PipelineExecutionResult> {
  const pipelineStartTime = Date.now()
  const stages: PipelineStageResult[] = []
  const configs = getConfigsByMode(mode)
  let appConfig: AppConfig | null = null

  try {
    // ========================================
    // STAGE 1: INTENT EXTRACTION
    // ========================================
    console.log('[Pipeline] Stage 1: Intent Extraction')
    let intentResult = await executeStage(
      'intent',
      SYSTEM_PROMPTS.intent,
      [{ role: 'user' as const, content: prompt }],
      configs.intent
    )
    stages.push(intentResult)

    if (!intentResult.success || !intentResult.output) {
      throw new Error('Intent extraction failed')
    }

    const intent = extractJSON(intentResult.output)
    if (!intent) {
      throw new Error('Failed to parse intent JSON')
    }

    console.log('[Pipeline] Intent extracted:', intent)

    // ========================================
    // STAGE 2: DESIGN ARCHITECTURE
    // ========================================
    console.log('[Pipeline] Stage 2: Design Architecture')
    const designResult = await executeStage(
      'design',
      SYSTEM_PROMPTS.design,
      [{ role: 'user' as const, content: JSON.stringify(intent) }],
      configs.design
    )
    stages.push(designResult)

    if (!designResult.success || !designResult.output) {
      throw new Error('Design architecture failed')
    }

    const design = extractJSON(designResult.output)
    if (!design) {
      throw new Error('Failed to parse design JSON')
    }

    console.log('[Pipeline] Design created:', design)

    // ========================================
    // STAGE 3: GENERATE SCHEMAS
    // ========================================
    console.log('[Pipeline] Stage 3: Generate Schemas')

    // 3a. Database Schema
    const dbSchemaResult = await executeStage(
      'schema:db',
      SYSTEM_PROMPTS.schema + `\n\nYou are generating ONLY the database tables schema. Return an array of table definitions with columns, types, relationships, and indexes. Context: ${JSON.stringify(design)}`,
      [{ role: 'user' as const, content: 'Generate database tables schema' }],
      configs.schema
    )
    stages.push(dbSchemaResult)

    if (!dbSchemaResult.success) {
      throw new Error('Database schema generation failed')
    }

    const dbTables = extractJSON(dbSchemaResult.output)

    // 3b. API Routes Schema
    const apiSchemaResult = await executeStage(
      'schema:api',
      SYSTEM_PROMPTS.schema + `\n\nYou are generating ONLY the API routes schema. Return an array of route definitions with methods, paths, request/response types, and authentication. Context: ${JSON.stringify(design)}`,
      [{ role: 'user' as const, content: 'Generate API routes schema' }],
      configs.schema
    )
    stages.push(apiSchemaResult)

    if (!apiSchemaResult.success) {
      throw new Error('API schema generation failed')
    }

    const apiRoutes = extractJSON(apiSchemaResult.output)

    // 3c. Components Schema
    const componentsSchemaResult = await executeStage(
      'schema:components',
      SYSTEM_PROMPTS.schema + `\n\nYou are generating ONLY the React components schema. Return an array of component definitions with props, state, interactions, and accessibility. Context: ${JSON.stringify(design)}`,
      [{ role: 'user' as const, content: 'Generate React components schema' }],
      configs.schema
    )
    stages.push(componentsSchemaResult)

    if (!componentsSchemaResult.success) {
      throw new Error('Components schema generation failed')
    }

    const components = extractJSON(componentsSchemaResult.output)

    // ========================================
    // STAGE 4: MERGE AND REFINE
    // ========================================
    console.log('[Pipeline] Stage 4: Merge and Refine')
    
    // Construct AppConfig from all schemas
    appConfig = {
      metadata: {
        name: intent.appType || 'Application',
        description: intent.description || '',
        version: '1.0.0',
        createdAt: new Date(),
      },
      intent,
      design,
      database: {
        tables: dbTables || [],
        relationships: [], // Will be populated in refinement
      },
      api: {
        routes: apiRoutes || [],
      },
      components,
      deployment: {
        platform: 'vercel',
        environment: 'production',
      },
    }

    const refinementResult = await executeStage(
      'refinement',
      SYSTEM_PROMPTS.refinement,
      [{ role: 'user' as const, content: JSON.stringify(appConfig) }],
      configs.refinement
    )
    stages.push(refinementResult)

    if (!refinementResult.success || !refinementResult.output) {
      throw new Error('Refinement failed')
    }

    const refinedConfig = extractJSON(refinementResult.output)
    if (refinedConfig) {
      appConfig = { ...appConfig, ...refinedConfig }
    }

    console.log('[Pipeline] Refinement complete')

    // ========================================
    // STAGE 5: VALIDATION & REPAIR
    // ========================================
    console.log('[Pipeline] Stage 5: Validation & Repair')
    
    const validationResult = validateAppConfig(appConfig)
    
    if (!validationResult.valid && validationResult.errors.length > 0) {
      console.log('[Pipeline] Validation errors found, attempting repair')
      
      const repairResult = await executeStage(
        'repair',
        SYSTEM_PROMPTS.repair,
        [
          {
            role: 'user' as const,
            content: JSON.stringify({
              config: appConfig,
              errors: validationResult.errors,
              section: 'full',
            }),
          },
        ],
        configs.repair
      )
      stages.push(repairResult)

      if (repairResult.success && repairResult.output) {
        const repairedData = extractJSON(repairResult.output)
        if (repairedData && repairedData.repairedSection) {
          if (repairedData.section === 'full') {
            appConfig = repairedData.repairedSection
          } else {
            // Merge repaired section
            appConfig = {
              ...appConfig,
              [repairedData.section]: repairedData.repairedSection,
            }
          }
        }
      }
    }

    // Final validation
    const finalValidation = validateAppConfig(appConfig)
    if (!finalValidation.valid) {
      console.warn('[Pipeline] Final validation has errors:', finalValidation.errors)
    }

    // ========================================
    // STAGE 6: EXPORT TO IMPLEMENTATION PLAN
    // ========================================
    console.log('[Pipeline] Stage 6: Build implementation plan')
    let implementationPlan = null
    try {
      implementationPlan = buildImplementationPlan(appConfig as any, design)
      // attach to appConfig for persistence
      ;(appConfig as any).implementationPlan = implementationPlan
    } catch (err) {
      console.warn('[Pipeline] Failed to build implementation plan:', err)
    }

    // ========================================
    // SAVE RESULTS
    // ========================================
    console.log('[Pipeline] Saving results to database')
    
    const totalLatencyMs = Date.now() - pipelineStartTime
    const totalTokens = stages.reduce((sum, s) => sum + s.inputTokens + s.outputTokens, 0)

    await prisma.generation.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        config: appConfig as any, // Prisma will serialize to JSON
        metadata: {
          stages,
          totalLatencyMs,
          totalTokens,
          mode,
        } as any,
        completedAt: new Date(),
      },
    })

    return {
      jobId,
      success: true,
      appConfig,
      implementationPlan,
      stages,
      totalLatencyMs,
      totalTokens,
    }
  } catch (error) {
    console.error('[Pipeline] Fatal error:', error)
    
    const totalLatencyMs = Date.now() - pipelineStartTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Save error state
    await prisma.generation.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        errorMessage,
        metadata: {
          stages,
          totalLatencyMs,
          mode,
        } as any,
      },
    }).catch(console.error)

    return {
      jobId,
      success: false,
      stages,
      totalLatencyMs,
      totalTokens: stages.reduce((sum, s) => sum + s.inputTokens + s.outputTokens, 0),
      errorMessage,
    }
  }
}

/**
 * Execute a single pipeline stage
 */
async function executeStage(
  stageName: string,
  system: string,
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  config: { model: string; max_tokens: number; temperature: number }
): Promise<PipelineStageResult> {
  try {
    const result = await callLLM({
      model: config.model,
      max_tokens: config.max_tokens,
      temperature: config.temperature,
      messages,
      system,
    })

    return {
      stage: stageName,
      success: result.success,
      output: result.output,
      latencyMs: result.latencyMs,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
    }
  } catch (error) {
    return {
      stage: stageName,
      success: false,
      output: null,
      latencyMs: 0,
      inputTokens: 0,
      outputTokens: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
