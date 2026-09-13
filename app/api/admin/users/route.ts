import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { PLAN_LIMITS, type PlanTier } from '@/lib/plan-limits'
import { createLogger } from '@/lib/logger'

const routeLogger = createLogger({ route: '/api/admin/users' })

const VALID_PLANS: PlanTier[] = ['free', 'pro', 'team']

export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  try {
    const search = request.nextUrl.searchParams.get('search') || ''
    const plan = request.nextUrl.searchParams.get('plan') as PlanTier | null
    const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || '50'), 100)
    const cursor = request.nextUrl.searchParams.get('cursor')

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (plan && VALID_PLANS.includes(plan)) {
      where.plan = plan
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        clerkId: true,
        email: true,
        displayName: true,
        plan: true,
        isAdmin: true,
        compilesThisMonth: true,
        compilesResetAt: true,
        createdAt: true,
        _count: { select: { generations: true } },
      },
    })

    const hasMore = users.length > limit
    const items = hasMore ? users.slice(0, limit) : users
    const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null
    const totalCount = await prisma.user.count({ where })

    return NextResponse.json({
      users: items.map((u) => ({
        id: u.id,
        clerkId: u.clerkId,
        email: u.email,
        displayName: u.displayName,
        plan: u.plan,
        isAdmin: u.isAdmin,
        compilesThisMonth: u.compilesThisMonth,
        compilesLimit: PLAN_LIMITS[u.plan].compilesPerMonth,
        generationsCount: u._count.generations,
        createdAt: u.createdAt,
      })),
      nextCursor,
      totalCount,
    })
  } catch (error) {
    routeLogger.error({ err: error }, 'Users list error')
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const { userId, plan, isAdmin } = body as {
      userId?: string
      plan?: PlanTier
      isAdmin?: boolean
    }

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (plan !== undefined) {
      if (!VALID_PLANS.includes(plan)) {
        return NextResponse.json({ error: `Invalid plan. Must be one of: ${VALID_PLANS.join(', ')}` }, { status: 400 })
      }
      updateData.plan = plan
      updateData.planStartedAt = new Date()
      updateData.compilesThisMonth = 0
      updateData.compilesResetAt = new Date()
    }
    if (isAdmin !== undefined) {
      updateData.isAdmin = isAdmin
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        displayName: true,
        plan: true,
        isAdmin: true,
      },
    })

    return NextResponse.json({ user: updated })
  } catch (error) {
    routeLogger.error({ err: error }, 'User update error')
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
