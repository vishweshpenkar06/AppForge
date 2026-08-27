import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCacheStats } from '@/lib/cache'

export async function GET(_request: NextRequest) {
  let userId: string | null = null
  if (process.env.NODE_ENV === 'production') {
    const authResult = await auth()
    userId = authResult.userId
  } else {
    userId = 'dev-user'
  }

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const stats = await getCacheStats()
  return NextResponse.json({ admin: true, ...stats })
}
