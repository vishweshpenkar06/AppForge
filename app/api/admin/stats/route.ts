import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { getSystemMetrics } from '@/lib/metrics'

export async function GET() {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  try {
    const [systemMetrics, userCounts, generationStatusCounts, recentGenerations] =
      await Promise.all([
        getSystemMetrics(),
        prisma.user.groupBy({ by: ['plan'], _count: true }),
        prisma.generation.groupBy({ by: ['status'], _count: true }),
        prisma.generation.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            prompt: true,
            status: true,
            mode: true,
            createdAt: true,
            user: { select: { displayName: true, email: true } },
          },
        }),
      ])

    const planBreakdown = Object.fromEntries(
      userCounts.map((p) => [p.plan, p._count])
    )

    const statusBreakdown = Object.fromEntries(
      generationStatusCounts.map((s) => [s.status, s._count])
    )

    return NextResponse.json({
      metrics: systemMetrics,
      users: {
        total: userCounts.reduce((sum, p) => sum + p._count, 0),
        byPlan: planBreakdown,
      },
      generations: {
        byStatus: statusBreakdown,
      },
      recentGenerations,
    })
  } catch (error) {
    console.error('[Admin] Stats error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
