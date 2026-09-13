import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCacheStats } from '@/lib/cache'
import { getAdminUser } from '@/lib/admin-auth'

export async function GET(_request: NextRequest) {
  try {
    let userId: string | null = null
    if (process.env.ENABLE_DEV_AUTH === 'true') {
      userId = 'dev-user'
    } else {
      const authResult = await auth()
      userId = authResult.userId
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await getAdminUser()
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const stats = await getCacheStats()
    return NextResponse.json({ admin: true, ...stats })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch cache stats' },
      { status: 500 }
    )
  }
}
