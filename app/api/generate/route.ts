import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { getOrCreateCurrentUserRecord } from '@/lib/clerk-user'
import { generateApplication } from '@/lib/pipeline'
import { checkRateLimit, buildRateLimitKey } from '@/lib/rate-limit'
import { getCache, setCache } from '@/lib/cache'
import { createLogger } from '@/lib/logger'
import { dispatchWebhooks } from '@/lib/webhook-dispatch'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    const routeLogger = createLogger({ route: '/api/generate', userId })

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rlKey = buildRateLimitKey(userId)
    const rl = checkRateLimit(rlKey)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'rate_limited', resetAt: rl.resetAt.toISOString() },
        { status: 429 }
      )
    }

    const { prompt, mode = 'balanced' } = await request.json()

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    if (!['fast', 'balanced', 'precise'].includes(mode)) {
      return NextResponse.json(
        { error: 'Mode must be one of: fast, balanced, precise' },
        { status: 400 }
      )
    }

    // ── Cache check ──────────────────────────────────────────────
    const { hit: cacheHit, data: cachedResult } = await getCache(prompt, mode)
    if (cacheHit) {
      console.log(`[Cache] Hit for generate prompt: ${prompt.substring(0, 50)}...`)
      return NextResponse.json({ ...cachedResult, cached: true })
    }

    // Create or sync the database user on demand so webhooks are not a hard dependency.
    const user = await getOrCreateCurrentUserRecord()

    if (!user || user.clerkId !== userId) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      )
    }

    // Create generation job record
    const generation = await prisma.generation.create({
      data: {
        userId: user.id,
        prompt,
        mode,
        status: 'pending',
      },
    })

    // Start async pipeline execution
    // In production, this would be a background job (BullMQ/Redis)
    // For now, we'll start it and let it run asynchronously
    generateApplication(generation.id, prompt, mode)
      .then(async (result) => {
        if (result.success) {
          await setCache(prompt, mode, {
            jobId: generation.id,
            status: 'completed',
            config: result.appConfig,
            implementationPlan: result.implementationPlan,
            docs: result.docs,
            stages: result.stages,
            totalLatencyMs: result.totalLatencyMs,
          }).catch(() => {})
        }
        // Dispatch webhooks for this user
        dispatchWebhooks(user.id, 'generation.completed', {
          jobId: generation.id,
          prompt: prompt.substring(0, 200),
          mode,
          success: result.success,
          totalLatencyMs: result.totalLatencyMs,
        }).catch(() => {})
      })
      .catch((error) => {
        console.error(`[Pipeline Error] Generation ${generation.id}:`, error)
        // Update generation record with error
        prisma.generation.update({
          where: { id: generation.id },
          data: {
            status: 'failed',
            errorMessage: error.message || 'Unknown error during generation',
          },
        }).catch(console.error)
        // Dispatch webhooks for failure
        dispatchWebhooks(user.id, 'generation.failed', {
          jobId: generation.id,
          prompt: prompt.substring(0, 200),
          mode,
          error: error.message || 'Unknown error',
        }).catch(() => {})
      })

    return NextResponse.json({
      jobId: generation.id,
      status: 'pending',
      message: 'Generation started',
    })
  } catch (error) {
    const routeLogger = createLogger({ route: '/api/generate' })
    routeLogger.error({ err: error, route: '/api/generate' }, 'Request failed')
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
