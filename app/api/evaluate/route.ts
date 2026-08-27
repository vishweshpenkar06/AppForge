/**
 * GET /api/evaluate?action=history — return persisted eval run history
 * GET /api/evaluate (no params) — run evaluation, persist, and return results
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { runEvaluation, formatReport } from '@/lib/compiler/evaluation'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const action = request.nextUrl.searchParams.get('action')

  if (action === 'history') {
    return handleHistory()
  }

  return handleRunEvaluation()
}

async function handleHistory(): Promise<NextResponse> {
  try {
    const runs = await prisma.evalRun.findMany({
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
    console.error('[EVAL] History fetch error:', errorMessage)
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}

async function handleRunEvaluation(): Promise<NextResponse> {
  const { userId } = await auth()

  try {
    console.log('[EVAL] Starting evaluation framework...')
    const report = await runEvaluation()

    console.log('[EVAL] Evaluation complete')
    console.log(formatReport(report))

    const evalRun = await prisma.evalRun.create({
      data: {
        userId: userId || null,
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
    console.error('[EVAL] Error:', errorMessage)

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}
