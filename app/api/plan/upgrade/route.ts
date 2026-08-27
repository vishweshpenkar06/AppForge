import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getOrCreateCurrentUserRecord } from '@/lib/clerk-user'
import { createTeamCode } from '@/lib/team-code'
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

    const { plan } = await request.json()
    if (!['free', 'pro', 'team'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Generate team code if upgrading to team
    let teamCode: string | null = null
    if (plan === 'team') {
      const existing = await prisma.teamCode.findUnique({ where: { ownerId: user.id } })
      if (existing) {
        teamCode = existing.code
      } else {
        let code = createTeamCode()
        // Ensure uniqueness (retry on collision)
        let attempts = 0
        while (await prisma.teamCode.findUnique({ where: { code } }) && attempts < 10) {
          code = createTeamCode()
          attempts++
        }
        await prisma.teamCode.create({
          data: { code, ownerId: user.id, seatsUsed: 1, maxSeats: 5 },
        })
        teamCode = code
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { plan, planStartedAt: new Date() },
    })

    return NextResponse.json({ success: true, plan: updated.plan, teamCode })
  } catch (error) {
    console.error('[API Error] /api/plan/upgrade:', error)
    return NextResponse.json({ error: 'Failed to upgrade' }, { status: 500 })
  }
}
