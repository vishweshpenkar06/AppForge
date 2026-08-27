/**
 * POST /api/compile-stream
 * SSE endpoint that streams progress events after each pipeline stage.
 * Wraps the SAME stage functions from lib/compiler/core.ts — no duplication.
 */

import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import {
  extractIntent,
  designSystem,
  generateSchemas,
  refineSchemas,
  validateAndRepair,
  checkExecutability,
} from '@/lib/compiler/core'
import { buildImplementationPlan, buildPlanningDocs } from '@/lib/compiler/export'
import { generateSQL, generateExpressServer, generateReactApp } from '@/lib/runtime/generators'
import { prisma } from '@/lib/db'
import { getOrCreateCurrentUserRecord } from '@/lib/clerk-user'
import { analyzePromptClarity } from '@/lib/validation'
import { canCompile, canUseMode, getDetailLevel, PLAN_LIMITS, type PlanTier } from '@/lib/plan-limits'
import { checkRateLimit, buildRateLimitKey } from '@/lib/rate-limit'

const STAGE_NAMES = [
  'intent-extraction',
  'system-design',
  'schema-generation',
  'refinement',
  'validation-repair',
  'export',
] as const

interface StageEvent {
  stage: string
  stageOrder: number
  status: 'active' | 'completed' | 'error'
  latencyMs: number
}

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

function createStreamError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function POST(request: NextRequest): Promise<Response> {
  let userId: string | null = null
  if (process.env.NODE_ENV === 'production') {
    const authResult = await auth()
    userId = authResult.userId
  } else {
    userId = 'dev-user'
  }

  if (!userId) {
    return createStreamError('Unauthorized', 401)
  }

  if (process.env.NODE_ENV === 'production') {
    const rlKey = buildRateLimitKey(userId)
    const rl = checkRateLimit(rlKey)
    if (!rl.allowed) {
      return createStreamError('rate_limited', 429)
    }
  }

  let prompt: string
  let mode: 'fast' | 'balanced' | 'precise'

  try {
    const body = await request.json()
    prompt = body.prompt
    mode = body.mode || 'balanced'
  } catch {
    return createStreamError('Invalid request body', 400)
  }

  if (!prompt || prompt.trim().length === 0) {
    return createStreamError('Prompt cannot be empty', 400)
  }
  if (prompt.length > 5000) {
    return createStreamError('Prompt exceeds maximum length (5000 characters)', 400)
  }

  let generation: { id: string } | null = null

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sseEvent(event, data)))
      }

      const startTime = Date.now()
      const stageTimes: Record<string, number> = {}

      try {
        let user
        if (process.env.NODE_ENV === 'production') {
          user = await getOrCreateCurrentUserRecord()
        } else {
          user = await prisma.user.upsert({
            where: { clerkId: 'dev-user' },
            update: {},
            create: { clerkId: 'dev-user', email: 'dev@appforge.local', displayName: 'Dev User' },
          })
        }

        if (!user) {
          send('error', { error: 'User record not found' })
          controller.close()
          return
        }

        const plan = (user.plan as PlanTier) || 'free'
        const now = new Date()
        if (user.compilesResetAt < new Date(now.getFullYear(), now.getMonth(), 1)) {
          await prisma.user.update({
            where: { id: user.id },
            data: { compilesThisMonth: 0, compilesResetAt: now },
          })
          user.compilesThisMonth = 0
        }

        if (!canCompile(plan, user.compilesThisMonth)) {
          send('error', {
            error: `You've hit your ${plan} plan limit of ${PLAN_LIMITS[plan].compilesPerMonth} compiles this month.`,
            upgradeRequired: true,
            currentPlan: plan,
          })
          controller.close()
          return
        }

        if (!canUseMode(plan, mode)) {
          send('error', {
            error: `The "${mode}" mode requires a Pro or Team plan.`,
            upgradeRequired: true,
            currentPlan: plan,
          })
          controller.close()
          return
        }

        const detailLevel = getDetailLevel(plan)

        generation = await prisma.generation.create({
          data: {
            userId: user.id,
            prompt: prompt!.slice(0, 2000),
            mode,
            status: 'pending',
          },
        })

        send('job-created', { jobId: generation.id })

        const promptAnalysis = analyzePromptClarity(prompt!)
        if (promptAnalysis.needsClarification) {
          await prisma.generation.update({
            where: { id: generation.id },
            data: {
              status: 'failed',
              errorMessage: 'Prompt needs clarification',
              metadata: { promptAnalysis } as any,
            },
          })
          send('needs-clarification', {
            confidence: promptAnalysis.confidence,
            detectedIssues: promptAnalysis.detectedIssues,
            clarificationQuestions: promptAnalysis.clarificationQuestions,
          })
          controller.close()
          return
        }

        // ── Stage 1: Intent ─────────────────────────────────────
        send('stage-start', { stage: STAGE_NAMES[0], stageOrder: 1, status: 'active' })
        let stageStart = Date.now()
        const intent = await extractIntent(prompt!, detailLevel)
        stageTimes[STAGE_NAMES[0]] = Date.now() - stageStart
        send('stage-complete', {
          stage: STAGE_NAMES[0],
          stageOrder: 1,
          status: 'completed',
          latencyMs: stageTimes[STAGE_NAMES[0]],
        })

        // ── Stage 2: Design ─────────────────────────────────────
        send('stage-start', { stage: STAGE_NAMES[1], stageOrder: 2, status: 'active' })
        stageStart = Date.now()
        const design = await designSystem(intent, detailLevel)
        stageTimes[STAGE_NAMES[1]] = Date.now() - stageStart
        send('stage-complete', {
          stage: STAGE_NAMES[1],
          stageOrder: 2,
          status: 'completed',
          latencyMs: stageTimes[STAGE_NAMES[1]],
        })

        // ── Stage 3: Schemas ────────────────────────────────────
        send('stage-start', { stage: STAGE_NAMES[2], stageOrder: 3, status: 'active' })
        stageStart = Date.now()
        const schemas = await generateSchemas(design, intent, detailLevel)
        stageTimes[STAGE_NAMES[2]] = Date.now() - stageStart
        send('stage-complete', {
          stage: STAGE_NAMES[2],
          stageOrder: 3,
          status: 'completed',
          latencyMs: stageTimes[STAGE_NAMES[2]],
        })

        // ── Stage 4: Refinement ─────────────────────────────────
        send('stage-start', { stage: STAGE_NAMES[3], stageOrder: 4, status: 'active' })
        stageStart = Date.now()
        const refined = await refineSchemas(schemas, design, detailLevel)
        stageTimes[STAGE_NAMES[3]] = Date.now() - stageStart
        send('stage-complete', {
          stage: STAGE_NAMES[3],
          stageOrder: 4,
          status: 'completed',
          latencyMs: stageTimes[STAGE_NAMES[3]],
        })

        // ── Stage 5: Validation ─────────────────────────────────
        send('stage-start', { stage: STAGE_NAMES[4], stageOrder: 5, status: 'active' })
        stageStart = Date.now()
        const validation = await validateAndRepair(refined)
        stageTimes[STAGE_NAMES[4]] = Date.now() - stageStart
        send('stage-complete', {
          stage: STAGE_NAMES[4],
          stageOrder: 5,
          status: 'completed',
          latencyMs: stageTimes[STAGE_NAMES[4]],
        })

        // ── Stage 6: Export ─────────────────────────────────────
        send('stage-start', { stage: STAGE_NAMES[5], stageOrder: 6, status: 'active' })
        stageStart = Date.now()

        const execution = checkExecutability(refined, validation)
        const implementationPlan = buildImplementationPlan(refined, design)
        const docs = buildPlanningDocs(prompt!, intent, design, refined, implementationPlan)

        let runtimeSql = ''
        let runtimeExpress = ''
        let runtimeReact: Record<string, string> = {}
        try {
          const appConfigForRuntime = {
            meta: { name: 'App' },
            ui: refined.ui,
            api: { endpoints: refined.api.endpoints.map((e) => ({ ...e, route: e.path })) },
            database: refined.database,
            auth: { provider: 'clerk', roles: intent.userRoles.map((r) => ({ name: r, permissions: ['read'] })), session_strategy: 'jwt' },
          } as any
          runtimeSql = generateSQL(appConfigForRuntime)
          runtimeExpress = generateExpressServer(appConfigForRuntime)
          runtimeReact = generateReactApp(appConfigForRuntime)
        } catch {
          // Runtime generation is best-effort
        }

        stageTimes[STAGE_NAMES[5]] = Date.now() - stageStart
        send('stage-complete', {
          stage: STAGE_NAMES[5],
          stageOrder: 6,
          status: 'completed',
          latencyMs: stageTimes[STAGE_NAMES[5]],
        })

        // ── Build final result ──────────────────────────────────
        const totalLatency = Date.now() - startTime

        const normalizedConfig = {
          metadata: {
            name: intent.dataModels[0] ? `${intent.dataModels[0].replace(/\b\w/g, (m) => m.toUpperCase())} App` : 'AppForge App',
            description: `Generated ${intent.appType} blueprint with ${design.pageStructure.length} pages and ${design.apiEndpoints.length} endpoints.`,
          },
          intent,
          design,
          database: refined.database,
          api: {
            endpoints: refined.api.endpoints,
            routes: design.apiEndpoints.map((e) => ({ method: e.method, path: e.path, description: e.purpose })),
          },
          ui: refined.ui,
          auth: {
            provider: 'clerk',
            roles: intent.userRoles.map((role) => ({ name: role, permissions: ['read'] })),
            session_strategy: 'jwt',
          },
        }

        // Persist
        try {
          if (generation) {
            const artifacts: Record<string, string> = {
              'PRD.md': docs.prd,
              'TRD.md': docs.trd,
              'AppFlow.md': docs.appFlow,
              'UI-UX-BRIEF.md': docs.uiUxBrief,
              'BACKEND-SCHEMA.md': docs.backendSchema,
              'IMPLEMENTATION-PLAN.md': docs.implementationPlan,
              'prisma.schema': implementationPlan.prismaSchema,
            }
            for (const h of implementationPlan.apiHandlers) artifacts[h.path] = h.content
            for (const p of implementationPlan.uiPages) artifacts[p.path] = p.content

            await prisma.appConfig.upsert({
              where: { generationId: generation.id },
              create: { generationId: generation.id, config: normalizedConfig as any, artifacts: artifacts as any, validationPassed: validation.valid },
              update: { config: normalizedConfig as any, artifacts: artifacts as any, validationPassed: validation.valid },
            })

            await prisma.generation.update({
              where: { id: generation.id },
              data: { status: execution.executable ? 'completed' : 'failed', completedAt: new Date(), totalLatencyMs: totalLatency },
            })

            const stageEntries = STAGE_NAMES.map((name, i) => ({
              generationId: generation!.id,
              stageName: name,
              stageOrder: i + 1,
              status: 'success' as const,
              latencyMs: stageTimes[name] ?? 0,
              inputTokens: 0,
              outputTokens: 0,
            }))
            await prisma.pipelineStage.createMany({ data: stageEntries })

            await prisma.user.update({
              where: { id: user.id },
              data: { compilesThisMonth: { increment: 1 } },
            })
          }
        } catch (err) {
          console.warn('[compile-stream] Failed to persist:', err)
        }

        // ── Send final result ───────────────────────────────────
        send('complete', {
          success: true,
          jobId: generation?.id,
          config: normalizedConfig,
          docs,
          implementationPlan,
          downloadUrl: generation ? `/api/generations/${generation.id}/export?format=zip` : undefined,
          validation: {
            valid: validation.valid,
            errors: validation.errors,
            warnings: validation.warnings,
            repairs: validation.repairs,
            score: validation.score,
          },
          execution: {
            executable: execution.executable,
            issues: execution.issues,
            readyForDeployment: execution.readyForDeployment,
          },
          metrics: {
            latency: totalLatency,
            inputTokens: 0,
            outputTokens: 0,
            stageTimes,
          },
          runtime: {
            sql: runtimeSql,
            express: runtimeExpress,
            react: runtimeReact,
          },
        })

        controller.close()
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error during compilation'
        console.error(`[compile-stream] Error:`, errorMessage)

        if (generation?.id) {
          try {
            await prisma.generation.update({
              where: { id: generation.id },
              data: { status: 'failed', errorMessage },
            })
          } catch {
            // best effort
          }
        }

        send('error', { error: errorMessage })
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
