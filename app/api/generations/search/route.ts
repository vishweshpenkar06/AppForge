import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { getOrCreateCurrentUserRecord } from '@/lib/clerk-user'

async function resolveUser() {
  let userId: string | null = null
  if (process.env.NODE_ENV !== 'production') {
    userId = 'dev-user'
  } else {
    const authResult = await auth()
    userId = authResult.userId
  }
  if (!userId) return null

  if (process.env.NODE_ENV === 'production') {
    const user = await getOrCreateCurrentUserRecord()
    if (!user || user.clerkId !== userId) return null
    return user
  }
  return prisma.user.upsert({
    where: { clerkId: 'dev-user' },
    update: {},
    create: { clerkId: 'dev-user', email: 'dev@appforge.local', displayName: 'Dev User' },
  })
}

export async function GET(request: NextRequest) {
  try {
    const user = await resolveUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim() || ''
    const favoritesOnly = searchParams.get('favorites') === '1'

    const where: any = { userId: user.id }
    if (q) {
      where.prompt = { contains: q, mode: 'insensitive' }
    }
    if (favoritesOnly) {
      where.isFavorite = true
    }

    const generations = await prisma.generation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        prompt: true,
        status: true,
        mode: true,
        createdAt: true,
        isFavorite: true,
      },
    })

    return NextResponse.json(generations)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await resolveUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, isFavorite } = await request.json()
    if (!id || typeof isFavorite !== 'boolean') {
      return NextResponse.json({ error: 'id and isFavorite required' }, { status: 400 })
    }

    const generation = await prisma.generation.findUnique({ where: { id }, select: { userId: true } })
    if (!generation || generation.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.generation.update({ where: { id }, data: { isFavorite } })
    return NextResponse.json({ id, isFavorite })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
