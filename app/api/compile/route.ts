/**
 * POST /api/compile
 * Real AppForge Compiler Endpoint
 */

import { NextRequest, NextResponse } from 'next/server'
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
import { canCompile, canUseMode, PLAN_LIMITS, getDetailLevel, TOKEN_MULTIPLIER, type PlanTier } from '@/lib/plan-limits'
import { checkRateLimit, buildRateLimitKey } from '@/lib/rate-limit'
import { getCache, setCache } from '@/lib/cache'
import { authenticateViaApiKey, buildApiKeyRateLimitKey } from '@/middleware/verify-api-key'
import { createLogger } from '@/lib/logger'

type NormalizedComponent = {
  name: string
  description: string
}

type NormalizedInteraction = {
  title: string
  summary: string
  entryPoints: string[]
  primaryActions: string[]
  feedbackStates: string[]
  successCriteria: string[]
}

function buildComponentsFromDesign(design: { pageStructure: { name: string; purpose: string }[] }) {
  const components: NormalizedComponent[] = [
    { name: 'AppShell', description: 'Global shell, navigation, and layout scaffolding' },
  ]

  for (const page of design.pageStructure || []) {
    components.push({
      name: `${page.name.replace(/\s+/g, '')}Page`,
      description: page.purpose,
    })
  }

  return components
}

function buildInteractionPlan(prompt: string, intent: { userRoles: string[]; primaryFeatures: string[]; appType: string }, design: { pageStructure: { name: string; purpose: string }[] }): NormalizedInteraction {
  const roles = intent.userRoles.length > 0 ? intent.userRoles : ['user']
  const entryPoints = design.pageStructure.length > 0 ? design.pageStructure.map((page) => page.name) : ['Dashboard']
  const primaryActions = [
    `Review ${roles[0]}-focused content`,
    'Create a new record from the main form',
    'Inspect generated output and export it',
  ]

  const feedbackStates = [
    'Empty state when no generation has been selected',
    'Loading state while compilation is in progress',
    'Success state with export and download actions',
  ]

  return {
    title: `${intent.appType.charAt(0).toUpperCase() + intent.appType.slice(1)} interaction flow`,
    summary: `The interface should guide ${roles.join(', ')} users from prompt entry to review and export, with clear transitions and readable feedback at each step.`,
    entryPoints,
    primaryActions,
    feedbackStates,
    successCriteria: [
      'The user can understand what to do next without reading implementation details.',
      'Generated content is visible immediately after compilation.',
      'Export and download actions are always clearly discoverable.',
    ],
  }
}

interface CompileRequest {
  prompt: string
  mode?: 'fast' | 'balanced' | 'precise'
}

interface CompileResponse {
  success: boolean
  status?: string
  config?: any
  docs?: {
    prd: string
    trd: string
    appFlow: string
    uiUxBrief: string
    backendSchema: string
    implementationPlan: string
  }
  implementationPlan?: {
    summary: string
    prismaSchema: string
    apiHandlers: { path: string; content: string }[]
    uiPages: { path: string; content: string }[]
    rbac: Record<string, string[]>
    checklist: string[]
  }
  downloadUrl?: string
  validation?: {
    valid: boolean
    errors: string[]
    warnings: string[]
    repairs?: string[]
    score: number
  }
  execution?: {
    executable: boolean
    issues: string[]
    readyForDeployment: boolean
  }
  metrics?: {
    latency: number
    inputTokens: number
    outputTokens: number
    stageTimes: Record<string, number>
  }
  runtime?: {
    sql: string
    express: string
    react: Record<string, string>
  }
  assumptions?: string[]
  confidence?: number
  detectedIssues?: string[]
  clarificationQuestions?: string[]
  error?: string
  jobId?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<CompileResponse>> {
  // ── Auth: API key first, then Clerk session fallback ──────────
  let userId: string | null = null
  let apiKeyId: string | null = null

  if (process.env.ENABLE_DEV_AUTH === 'true') {
    // Dev mode: skip auth entirely
    userId = 'dev-user'
  } else {
    // 1) Try API key from Authorization header
    const apiKeyAuth = await authenticateViaApiKey(request)
    if (apiKeyAuth) {
      userId = apiKeyAuth.userId
      apiKeyId = apiKeyAuth.keyId
    }

    // 2) Fall back to Clerk session
    if (!userId) {
      const authResult = await auth()
      userId = authResult.userId
    }
  }

  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Rate-limit: 5 generations/day per user (skipped in dev mode)
  if (process.env.ENABLE_DEV_AUTH !== 'true') {
    const rlKey = apiKeyId
      ? buildApiKeyRateLimitKey(apiKeyId)
      : buildRateLimitKey(userId)
    const rl = checkRateLimit(rlKey)
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'rate_limited', resetAt: rl.resetAt.toISOString() },
        { status: 429 }
      )
    }
  }

  let generation: { id: string } | null = null
  const routeLogger = createLogger({ route: '/api/compile', userId })

  try {
    const { prompt, mode = 'balanced' } = (await request.json()) as CompileRequest

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Prompt cannot be empty' },
        { status: 400 }
      )
    }

    if (prompt.length > 5000) {
      return NextResponse.json(
        { success: false, error: 'Prompt exceeds maximum length (5000 characters)' },
        { status: 400 }
      )
    }

    if (!['fast', 'balanced', 'precise'].includes(mode)) {
      return NextResponse.json(
        { success: false, error: 'Mode must be one of: fast, balanced, precise' },
        { status: 400 }
      )
    }

    // ── Cache check ──────────────────────────────────────────────
    const { hit: cacheHit, data: cachedResult } = await getCache(prompt, `${mode}:compile`)
    if (cacheHit) {
      console.log(`[${userId}] Cache hit for prompt: ${prompt.substring(0, 50)}...`)
      return NextResponse.json({ success: true, ...cachedResult, cached: true })
    }

    const startTime = Date.now()
    const stageTimes: Record<string, number> = {}

    // Ensure we have a DB user record to attach this generation to
    let user
    if (process.env.ENABLE_DEV_AUTH !== 'true') {
      if (apiKeyId) {
        // API-key auth: look up user by clerkId (no Clerk session available)
        user = await prisma.user.findUnique({ where: { clerkId: userId! } })
      } else {
        user = await getOrCreateCurrentUserRecord()
      }
    } else {
      // Dev mode: find or create a dev user
      user = await prisma.user.upsert({
        where: { clerkId: 'dev-user' },
        update: {},
        create: { clerkId: 'dev-user', email: 'dev@appforge.local', displayName: 'Dev User' },
      })
    }

    if (!user) {
      return NextResponse.json({ success: false, error: 'User record not found' }, { status: 404 })
    }

    // ── Plan gating ──────────────────────────────────────────────
    const plan = (user.plan as PlanTier) || 'free'

    // Reset monthly counter if a new month started
    const now = new Date()
    if (user.compilesResetAt < new Date(now.getFullYear(), now.getMonth(), 1)) {
      await prisma.user.update({
        where: { id: user.id },
        data: { compilesThisMonth: 0, compilesResetAt: now },
      })
      user.compilesThisMonth = 0
    }

    if (!canCompile(plan, user.compilesThisMonth)) {
      return NextResponse.json(
        {
          success: false,
          error: `You've hit your ${plan} plan limit of ${PLAN_LIMITS[plan].compilesPerMonth} compiles this month.`,
          upgradeRequired: true,
          currentPlan: plan,
        },
        { status: 429 }
      )
    }

    const requestedMode = mode || 'fast'
    if (!canUseMode(plan, requestedMode)) {
      return NextResponse.json(
        {
          success: false,
          error: `The "${requestedMode}" mode requires a Pro or Team plan.`,
          upgradeRequired: true,
          currentPlan: plan,
        },
        { status: 403 }
      )
    }

    const detailLevel = getDetailLevel(plan)

    // Create a generation record so the frontend can poll and display results
    generation = await prisma.generation.create({
      data: {
        userId: user.id,
        prompt: prompt.slice(0, 2000),
        mode,
        status: 'pending',
      },
    })

    // ========================================================================
    // PROMPT ANALYSIS GATE
    // ========================================================================
    const promptAnalysis = analyzePromptClarity(prompt)
    if (promptAnalysis.needsClarification) {
      console.log(`[${userId}] Prompt needs clarification (confidence: ${promptAnalysis.confidence})`)

      await prisma.generation.update({
        where: { id: generation.id },
        data: {
          status: 'failed',
          errorMessage: 'Prompt needs clarification',
          metadata: {
            promptAnalysis,
            confidence: promptAnalysis.confidence,
            detectedIssues: promptAnalysis.detectedIssues,
          } as any,
        },
      })

      return NextResponse.json({
        success: false,
        status: 'needs_clarification',
        confidence: promptAnalysis.confidence,
        detectedIssues: promptAnalysis.detectedIssues,
        clarificationQuestions: promptAnalysis.clarificationQuestions,
        metrics: { latency: Date.now() - startTime, inputTokens: 0, outputTokens: 0, stageTimes: {} },
      })
    }

    // ========================================================================
    // STAGE 1: INTENT EXTRACTION
    // ========================================================================
    let stageStart = Date.now()
    console.log(`[${userId}] Starting Intent Extraction for prompt: ${prompt.substring(0, 50)}...`)

    const intent = await extractIntent(prompt, detailLevel)
    stageTimes['intent-extraction'] = Date.now() - stageStart

    console.log(`[${userId}] Intent extracted:`, intent.appType)

    // ========================================================================
    // STAGE 2: SYSTEM DESIGN
    // ========================================================================
    stageStart = Date.now()
    console.log(`[${userId}] Starting System Design`)

    const design = await designSystem(intent, detailLevel)
    stageTimes['system-design'] = Date.now() - stageStart

    console.log(`[${userId}] Design created with ${design.pageStructure.length} pages`)

    // ========================================================================
    // STAGE 3: SCHEMA GENERATION
    // ========================================================================
    stageStart = Date.now()
    console.log(`[${userId}] Starting Schema Generation`)

    const schemas = await generateSchemas(design, intent, detailLevel)
    stageTimes['schema-generation'] = Date.now() - stageStart

    console.log(
      `[${userId}] Schemas generated: ${schemas.database.tables.length} tables, ${schemas.api.endpoints.length} endpoints`
    )

    // ========================================================================
    // STAGE 4: REFINEMENT
    // ========================================================================
    stageStart = Date.now()
    console.log(`[${userId}] Starting Refinement`)

    const refined = await refineSchemas(schemas, design, detailLevel)
    stageTimes['refinement'] = Date.now() - stageStart

    console.log(`[${userId}] Schemas refined`)

    // ========================================================================
    // STAGE 5: VALIDATION & REPAIR
    // ========================================================================
    stageStart = Date.now()
    console.log(`[${userId}] Starting Validation & Repair`)

    const validation = await validateAndRepair(refined)
    stageTimes['validation-repair'] = Date.now() - stageStart

    console.log(`[${userId}] Validation complete: ${validation.valid ? 'VALID' : 'INVALID'} (score: ${validation.score})`)

    // ========================================================================
    // EXECUTION CHECK
    // ========================================================================
    const execution = checkExecutability(refined, validation)

    const implementationPlan = buildImplementationPlan(refined, design)
    const docs = buildPlanningDocs(prompt, intent, design, refined, implementationPlan)

    const interaction = buildInteractionPlan(prompt, intent, design)

    const rolePermissions: Record<string, { can_access_pages: string[]; can_call_endpoints: string[]; premium_required: boolean; can_perform: string[] }> = {}
    for (const role of intent.userRoles) {
      const isPremium = intent.paymentRequired && role !== 'admin'
      rolePermissions[role] = {
        can_access_pages: design.pageStructure
          .filter(p => p.purpose && (role === 'admin' || !p.purpose.toLowerCase().includes('admin')))
          .map(p => p.name),
        can_call_endpoints: design.apiEndpoints.map(e => `${e.method} ${e.path}`),
        premium_required: isPremium,
        can_perform: role === 'admin' ? ['create', 'read', 'update', 'delete'] : ['read', 'create'],
      }
    }

    const premiumGates = (intent.premiumFeatures || []).map(feature => ({
      feature,
      required_plan: 'pro',
      fallback_behavior: 'paywall' as const,
    }))

    const normalizedConfig = {
      metadata: {
        name: intent.dataModels[0] ? `${intent.dataModels[0].replace(/\b\w/g, (match) => match.toUpperCase())} App` : 'AppForge App',
        description: `Generated ${intent.appType} blueprint with ${design.pageStructure.length} pages and ${design.apiEndpoints.length} endpoints.`,
      },
      intent,
      design,
      database: refined.database,
      api: {
        endpoints: refined.api.endpoints,
        routes: design.apiEndpoints.map((endpoint) => ({
          method: endpoint.method,
          path: endpoint.path,
          description: endpoint.purpose,
        })),
      },
      ui: refined.ui,
      auth: {
        provider: 'clerk',
        roles: intent.userRoles.map(role => ({
          name: role,
          permissions: rolePermissions[role]?.can_perform || ['read'],
          can_access_pages: rolePermissions[role]?.can_access_pages || [],
          can_call_endpoints: rolePermissions[role]?.can_call_endpoints || [],
          premium_required: rolePermissions[role]?.premium_required || false,
        })),
        session_strategy: 'jwt',
        token_expiry: '24h',
        refresh_token: true,
        premium_gates: premiumGates,
        user_flows: intent.userFlows || [],
      },
      components: buildComponentsFromDesign(design),
      interaction,
    }

    // Generate portable runtime stubs
    let runtimeSql = ''
    let runtimeExpress = ''
    let runtimeReact: Record<string, string> = {}
    try {
      const appConfigForRuntime = {
        meta: normalizedConfig.metadata as any,
        ui: normalizedConfig.ui,
        api: { endpoints: normalizedConfig.api.endpoints.map((e: any) => ({ ...e, route: e.path || e.route })) },
        database: normalizedConfig.database,
        auth: normalizedConfig.auth,
      } as any
      runtimeSql = generateSQL(appConfigForRuntime)
      runtimeExpress = generateExpressServer(appConfigForRuntime)
      runtimeReact = generateReactApp(appConfigForRuntime)
    } catch (err) {
      console.warn('[Compile] Runtime generation failed:', err)
    }

    const totalLatency = Date.now() - startTime

    // Persist generated artifacts in the database instead of filesystem
    const artifacts: Record<string, string> = {
      'PRD.md': docs.prd,
      'TRD.md': docs.trd,
      'AppFlow.md': docs.appFlow,
      'UI-UX-BRIEF.md': docs.uiUxBrief,
      'BACKEND-SCHEMA.md': docs.backendSchema,
      'IMPLEMENTATION-PLAN.md': docs.implementationPlan,
      'prisma.schema': implementationPlan.prismaSchema,
    }
    for (const h of implementationPlan.apiHandlers) {
      artifacts[h.path] = h.content
    }
    for (const p of implementationPlan.uiPages) {
      artifacts[p.path] = p.content
    }

    console.log(
      `[${userId}] Compilation complete in ${totalLatency}ms. Executable: ${execution.executable}`
    )

    // Increment compile counter
    try {
      await prisma.user.update({
        where: { id: user!.id },
        data: { compilesThisMonth: { increment: 1 } },
      })
    } catch (err) {
      console.warn('[Compile] Failed to increment compile count:', err)
    }

    // Persist app config into AppConfig table and update generation status
    try {
      // Ensure normalizedConfig is not empty before saving
      if (!normalizedConfig || Object.keys(normalizedConfig).length === 0) {
        console.warn('[Compile] normalizedConfig is empty, skipping AppConfig save')
      } else {
        await prisma.appConfig.upsert({
          where: { generationId: generation.id },
          create: {
            generationId: generation.id,
            config: normalizedConfig as any,
            artifacts: artifacts as any,
            validationPassed: validation.valid,
          },
          update: {
            config: normalizedConfig as any,
            artifacts: artifacts as any,
            validationPassed: validation.valid,
          },
        })
      }

      await prisma.generation.update({
        where: { id: generation.id },
        data: { status: execution.executable ? 'completed' : 'failed', completedAt: new Date(), totalLatencyMs: totalLatency },
      })

      // Persist per-stage metrics
      const stageEntries = [
        { name: 'intent-extraction', order: 1 },
        { name: 'system-design', order: 2 },
        { name: 'schema-generation', order: 3 },
        { name: 'refinement', order: 4 },
        { name: 'validation-repair', order: 5 },
        { name: 'export', order: 6 },
      ]
      if (generation) {
        await prisma.pipelineStage.createMany({
          data: stageEntries.map(s => ({
            generationId: generation!.id,
            stageName: s.name,
            stageOrder: s.order,
            status: 'success',
            latencyMs: stageTimes[s.name] ?? 0,
            inputTokens: 0,
            outputTokens: 0,
          })),
        })
      }
    } catch (err) {
      console.warn('Failed to persist generation/appConfig', err)
    }

    const compileResponse = {
      success: true,
      jobId: generation.id,
      config: normalizedConfig,
      docs,
      implementationPlan,
      downloadUrl: `/api/generations/${generation.id}/export?format=zip`,
      assumptions: intent.assumptions,
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
    }
    await setCache(prompt, `${mode}:compile`, compileResponse).catch(() => {})
    return NextResponse.json(compileResponse)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during compilation'

    routeLogger.error({ err: error, generationId: generation?.id }, errorMessage)

    try {
      if (generation?.id) {
        await prisma.generation.update({
          where: { id: generation.id },
          data: { status: 'failed', errorMessage },
        })
      }
    } catch (e) {
      console.warn('Failed to mark generation as failed', e)
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}
