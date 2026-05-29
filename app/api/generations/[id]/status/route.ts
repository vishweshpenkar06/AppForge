import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { getOrCreateCurrentUserRecord } from '@/lib/clerk-user'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const user = await getOrCreateCurrentUserRecord()

    if (!user || user.clerkId !== userId) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      )
    }

    const generation = await prisma.generation.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        prompt: true,
        mode: true,
        createdAt: true,
        completedAt: true,
        errorMessage: true,
        userId: true,
      },
    })

    if (!generation) {
      return NextResponse.json(
        { error: 'Generation not found' },
        { status: 404 }
      )
    }

    // Ensure user owns this generation
    if (generation.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      id: generation.id,
      status: generation.status,
      progress: generation.status === 'pending' ? 50 : generation.status === 'completed' ? 100 : 0,
      createdAt: generation.createdAt,
      completedAt: generation.completedAt,
      errorMessage: generation.errorMessage,
    })
  } catch (error) {
    console.error('[API Error] /api/generations/[id]/status:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
