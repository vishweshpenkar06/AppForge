import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserMetrics, getSystemMetrics } from '@/lib/metrics'
import { getOrCreateCurrentUserRecord } from '@/lib/clerk-user'

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
      const user = await getOrCreateCurrentUserRecord()

      if (!user || user.clerkId !== userId) {
        return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
      }

      metrics = await getUserMetrics(user.id)
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
