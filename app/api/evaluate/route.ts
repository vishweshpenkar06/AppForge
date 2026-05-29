/**
 * GET /api/evaluate
 * Run the evaluation framework and return metrics
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { runEvaluation, formatReport } from '@/lib/compiler/evaluation'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { userId } = await auth()

  // For now, allow unauthenticated access to evaluation
  // In production, restrict to admins or specific users

  try {
    console.log('[EVAL] Starting evaluation framework...')
    const report = await runEvaluation()

    console.log('[EVAL] Evaluation complete')
    console.log(formatReport(report))

    return NextResponse.json({
      success: true,
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
