import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { getOrCreateCurrentUserRecord } from '@/lib/clerk-user'
import { createLogger } from '@/lib/logger'

const routeLogger = createLogger({ route: '/api/notifications' })

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

    const user = await getOrCreateCurrentUserRecord()
    if (!user || user.clerkId !== userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || '20'), 50)
    const unreadOnly = request.nextUrl.searchParams.get('unread') === 'true'

    const where = { userId: user.id, ...(unreadOnly ? { read: false } : {}) }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.notification.count({
        where: { userId: user.id, read: false },
      }),
    ])

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    routeLogger.error({ err: error }, 'Failed to fetch notifications')
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
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

    const user = await getOrCreateCurrentUserRecord()
    if (!user || user.clerkId !== userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { notificationId, markAllRead } = body as {
      notificationId?: string
      markAllRead?: boolean
    }

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: { userId: user.id, read: false },
        data: { read: true },
      })
      return NextResponse.json({ success: true })
    }

    if (notificationId) {
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      })

      if (!notification || notification.userId !== user.id) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }

      await prisma.notification.update({
        where: { id: notificationId },
        data: { read: true },
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'notificationId or markAllRead required' }, { status: 400 })
  } catch (error) {
    routeLogger.error({ err: error }, 'Failed to update notification')
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
