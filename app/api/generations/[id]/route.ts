import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { getOrCreateCurrentUserRecord } from '@/lib/clerk-user'
import { createLogger } from '@/lib/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const routeLogger = createLogger({ route: '/api/generations/[id]', generationId: id })

    // Dev mode: skip auth checks
    if (process.env.NODE_ENV !== 'production') {
      const generation = await prisma.generation.findUnique({
        where: { id },
        include: {
          appConfig: true,
          pipelineStages: true,
        },
      })

      if (!generation) {
        return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
      }

      const out = {
        ...generation,
        config: generation?.appConfig?.config ?? null,
        metadata: {
          stages: generation?.pipelineStages?.map((s) => ({
            stage: s.stageName,
            success: s.status === 'success',
            latencyMs: s.latencyMs,
          })) || [],
          totalLatencyMs: generation?.totalLatencyMs ?? null,
          totalTokens: null,
        },
      }

      return NextResponse.json(out)
    }

    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getOrCreateCurrentUserRecord()

    if (!user || user.clerkId !== userId) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      )
    }

    const generation = await prisma.generation.findUnique({
      where: { id },
      include: {
        appConfig: true,
        pipelineStages: true,
      },
    })

    if (!generation) {
      return NextResponse.json(
        { error: 'Generation not found' },
        { status: 404 }
      )
    }

    if (generation.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const out = {
      ...generation,
      config: generation?.appConfig?.config ?? null,
      metadata: {
        stages: generation?.pipelineStages?.map((s) => ({
          stage: s.stageName,
          success: s.status === 'success',
          latencyMs: s.latencyMs,
        })) || [],
        totalLatencyMs: generation?.totalLatencyMs ?? null,
        totalTokens: null,
      },
    }

    return NextResponse.json(out)
  } catch (error) {
    const routeLogger = createLogger({ route: '/api/generations/[id]' })
    routeLogger.error({ err: error, route: '/api/generations/[id]' }, 'Request failed')
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
