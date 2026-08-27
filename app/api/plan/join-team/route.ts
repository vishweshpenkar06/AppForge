import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getOrCreateCurrentUserRecord } from '@/lib/clerk-user'
import { createLogger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    let user
    if (process.env.NODE_ENV !== 'production') {
      user = await prisma.user.upsert({
        where: { clerkId: 'dev-user' },
        update: {},
        create: { clerkId: 'dev-user', email: 'dev@appforge.local', displayName: 'Dev User' },
      })
    } else {
      user = await getOrCreateCurrentUserRecord()
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code } = await request.json()
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Team code is required' }, { status: 400 })
    }

    const teamCode = await prisma.teamCode.findUnique({ where: { code: code.toUpperCase() } })

    if (!teamCode) {
      return NextResponse.json({ error: 'Invalid team code' }, { status: 404 })
    }

    if (teamCode.seatsUsed >= teamCode.maxSeats) {
      return NextResponse.json({ error: 'This team is full (5/5 seats used)' }, { status: 409 })
    }

    if (teamCode.ownerId === user.id) {
      return NextResponse.json({ error: 'You already own this team' }, { status: 400 })
    }

    // Atomic transaction: update user plan + increment seat count
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { plan: 'team', memberOfTeamId: teamCode.id, planStartedAt: new Date() },
      }),
      prisma.teamCode.update({
        where: { id: teamCode.id },
        data: { seatsUsed: { increment: 1 } },
      }),
    ])

    return NextResponse.json({ success: true, plan: 'team' })
  } catch (error) {
    console.error('[API Error] /api/plan/join-team:', error)
    return NextResponse.json({ error: 'Failed to join team' }, { status: 500 })
  }
}
