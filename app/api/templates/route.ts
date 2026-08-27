import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { getOrCreateCurrentUserRecord } from '@/lib/clerk-user'
import { createLogger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const appType = searchParams.get('appType') || ''

    const where: any = { isPublic: true }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ]
    }

    if (appType) {
      where.sourceGeneration = {
        config: {
          path: ['intent', 'appType'],
          equals: appType,
        },
      }
    }

    const templates = await prisma.template.findMany({
      where,
      orderBy: [{ useCount: 'desc' }, { createdAt: 'desc' }],
      take: 50,
      include: {
        author: { select: { displayName: true } },
        sourceGeneration: {
          select: { prompt: true, config: true },
        },
      },
    })

    const shaped = templates.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      useCount: t.useCount,
      createdAt: t.createdAt.toISOString(),
      authorName: t.author.displayName || 'Anonymous',
      prompt: t.sourceGeneration.prompt,
      appType: (t.sourceGeneration.config as any)?.intent?.appType || null,
    }))

    return NextResponse.json(shaped)
  } catch (error) {
    const routeLogger = createLogger({ route: '/api/templates' })
    routeLogger.error({ err: error }, 'GET /api/templates failed')
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getOrCreateCurrentUserRecord()
    if (!user || user.clerkId !== userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { generationId, title, description } = await request.json()

    if (!generationId || typeof generationId !== 'string') {
      return NextResponse.json({ error: 'generationId is required' }, { status: 400 })
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    const generation = await prisma.generation.findUnique({
      where: { id: generationId },
      select: { id: true, userId: true, status: true, prompt: true },
    })

    if (!generation) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
    }

    if (generation.userId !== user.id) {
      return NextResponse.json({ error: 'You can only publish your own generations' }, { status: 403 })
    }

    if (generation.status !== 'success' && generation.status !== 'completed') {
      return NextResponse.json({ error: 'Only successful generations can be published as templates' }, { status: 400 })
    }

    const existing = await prisma.template.findFirst({
      where: { sourceGenerationId: generationId },
    })

    if (existing) {
      return NextResponse.json({ error: 'This generation is already published as a template', status: 409 } as any, { status: 409 })
    }

    const template = await prisma.template.create({
      data: {
        authorId: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        sourceGenerationId: generationId,
        isPublic: true,
      },
      include: {
        author: { select: { displayName: true } },
      },
    })

    return NextResponse.json({
      id: template.id,
      title: template.title,
      description: template.description,
      createdAt: template.createdAt.toISOString(),
    }, { status: 201 })
  } catch (error) {
    const routeLogger = createLogger({ route: '/api/templates' })
    routeLogger.error({ err: error }, 'POST /api/templates failed')
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
