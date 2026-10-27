/**
 * GET /api/evaluate — return the current user's persisted eval run history
 * POST /api/evaluate — run evaluation, persist, and return results
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { runEvaluation } from '@/lib/compiler/evaluation'
import { createLogger } from '@/lib/logger'
import { prisma } from '@/lib/db'
import { getOrCreateCurrentUserRecord } from '@/lib/clerk-user'
import { checkRateLimit } from '@/lib/rate-limit'

async function resolveUser() {
  if (process.env.ENABLE_DEV_AUTH === 'true') {
    return prisma.user.upsert({
      where: { clerkId: 'dev-user' },
      update: {},
      create: { clerkId: 'dev-user', email: 'dev@appforge.local', displayName: 'Dev User' },
    })
  }
  return getOrCreateCurrentUserRecord()
}

export async function GET(_request: NextRequest): Promise<NextResponse> {
  return handleHistory()
}

export async function POST(_request: NextRequest): Promise<NextResponse> {
  return handleRunEvaluation()
}

async function handleHistory(): Promise<NextResponse> {
  const routeLogger = createLogger({ route: '/api/evaluate/history' })
  try {
    const user = await resolveUser()
    // No session: show nothing rather than every user's runs.
    if (!user) return NextResponse.json({ success: true, runs: [] })

    const runs = await prisma.evalRun.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        results: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    return NextResponse.json({ success: true, runs })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch history'
    routeLogger.error({ err: error, route: '/api/evaluate/history' }, errorMessage)
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}

async function handleRunEvaluation(): Promise<NextResponse> {
  const routeLogger = createLogger({ route: '/api/evaluate' })

  try {
    const user = await resolveUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Evaluation runs every prompt against the full pipeline — throttle it.
    const rl = checkRateLimit(`eval:${user.id}`)
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Rate limited. Try again later.', resetAt: rl.resetAt.toISOString() },
        { status: 429 },
      )
    }

    const report = await runEvaluation()

    const evalRun = await prisma.evalRun.create({
      data: {
        userId: user.id,
        name: `Eval #${Date.now()}`,
        description: `Success rate: ${report.successRate.toFixed(1)}%`,
        results: {
          create: report.results.map((r) => ({
            promptCategory: r.category || null,
            success: r.success,
            retryCount: r.retries,
            latencyMs: r.latency,
            failureReason: r.errors.length > 0 ? r.errors.join('; ') : null,
            notes: r.warnings.length > 0 ? r.warnings.join('; ') : null,
          })),
        },
      },
      include: { results: true },
    })

    return NextResponse.json({
      success: true,
      runId: evalRun.id,
      report,
      summary: {
        successRate: `${report.successRate.toFixed(1)}%`,
        avgLatency: `${report.avgLatency.toFixed(0)}ms`,
        avgValidationScore: `${report.avgValidationScore.toFixed(1)}/100`,
        executionRate: `${report.executionRate.toFixed(1)}%`,
        averageRetries: report.averageRetries.toFixed(2),
        totalCost: `$${report.totalCost.toFixed(4)}`,
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Evaluation failed'
    routeLogger.error({ err: error, route: '/api/evaluate' }, errorMessage)

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}
