import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { getOrCreateCurrentUserRecord } from '@/lib/clerk-user'
import { createLogger } from '@/lib/logger'

export async function GET(request: NextRequest) {
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

    let user = null
    if (process.env.ENABLE_DEV_AUTH === 'true') {
      user = await prisma.user.upsert({
        where: { clerkId: 'dev-user' },
        update: {},
        create: { clerkId: 'dev-user', email: 'dev@appforge.local', displayName: 'Dev User' },
      })
    } else {
      user = await getOrCreateCurrentUserRecord()
      if (!user || user.clerkId !== userId) {
        return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
      }
    }

    // Pagination params
    const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || '20'), 50)
    const cursor = request.nextUrl.searchParams.get('cursor')

    const generations = await prisma.generation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        prompt: true,
        status: true,
        mode: true,
        createdAt: true,
        isFavorite: true,
      },
    })

    const hasMore = generations.length > limit
    const items = hasMore ? generations.slice(0, limit) : generations
    const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null

    return NextResponse.json({ items, nextCursor })
  } catch (error) {
    const routeLogger = createLogger({ route: '/api/generations' })
    routeLogger.error({ err: error, route: '/api/generations' }, 'Request failed')
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
