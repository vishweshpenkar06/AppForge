import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { getOrCreateCurrentUserRecord } from '@/lib/clerk-user'
import { createLogger } from '@/lib/logger'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params

    const template = await prisma.template.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, displayName: true } },
        sourceGeneration: {
          select: { id: true, prompt: true, config: true },
        },
      },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    if (!template.isPublic) {
      const { userId } = await auth().catch(() => ({ userId: null }))
      const user = userId ? await getOrCreateCurrentUserRecord().catch(() => null) : null
      if (!user || user.id !== template.authorId) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }
    }

    const config = template.sourceGeneration.config as any

    return NextResponse.json({
      id: template.id,
      title: template.title,
      description: template.description,
      useCount: template.useCount,
      createdAt: template.createdAt.toISOString(),
      author: {
        id: template.author.id,
        displayName: template.author.displayName || 'Anonymous',
      },
      sourceGeneration: {
        id: template.sourceGeneration.id,
        prompt: template.sourceGeneration.prompt,
        config,
      },
      appType: config?.intent?.appType || null,
    })
  } catch (error) {
    const routeLogger = createLogger({ route: '/api/templates/[id]' })
    routeLogger.error({ err: error }, 'GET /api/templates/[id] failed')
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getOrCreateCurrentUserRecord()
    if (!user || user.clerkId !== userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const template = await prisma.template.findUnique({
      where: { id },
      select: { id: true, authorId: true },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    if (template.authorId !== user.id) {
      return NextResponse.json({ error: 'You can only delete your own templates' }, { status: 403 })
    }

    await prisma.template.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    const routeLogger = createLogger({ route: '/api/templates/[id]' })
    routeLogger.error({ err: error }, 'DELETE /api/templates/[id] failed')
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
