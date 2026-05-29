import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserMetrics, getSystemMetrics } from '@/lib/metrics'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    const scope = request.nextUrl.searchParams.get('scope') || 'user'

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let metrics

    if (scope === 'system') {
      // Only allow admins to view system metrics (can be enhanced with role-based access)
      metrics = await getSystemMetrics()
    } else {
      // User metrics
      metrics = await getUserMetrics(userId)
    }

    if (!metrics) {
      return NextResponse.json(
        { error: 'Failed to retrieve metrics' },
        { status: 500 }
      )
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('[API Error] /api/metrics:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
