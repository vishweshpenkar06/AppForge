import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { PLAN_LIMITS, type PlanTier } from '@/lib/plan-limits'

const VALID_PLANS: PlanTier[] = ['free', 'pro', 'team']

export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  try {
    const search = request.nextUrl.searchParams.get('search') || ''
    const plan = request.nextUrl.searchParams.get('plan') as PlanTier | null

    const where: any = {}
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
      take: 100,
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

    return NextResponse.json({
      users: users.map((u) => ({
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
    })
  } catch (error) {
    console.error('[Admin] Users list error:', error)
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

    const updateData: any = {}
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
    console.error('[Admin] User update error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
