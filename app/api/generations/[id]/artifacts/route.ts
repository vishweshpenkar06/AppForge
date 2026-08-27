import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { getOrCreateCurrentUserRecord } from '@/lib/clerk-user'
import { createLogger } from '@/lib/logger'

interface ArtifactOverride {
  content: string
  editedAt: string
}

interface PatchBody {
  path: string
  content: string
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let userId: string | null = null

    if (process.env.NODE_ENV !== 'production') {
      userId = 'dev-user'
    } else {
      const authResult = await auth()
      userId = authResult.userId
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body: PatchBody = await request.json()

    if (!body.path || typeof body.content !== 'string') {
      return NextResponse.json(
        { error: 'Missing required fields: path, content' },
        { status: 400 }
      )
    }

    let user = null
    if (process.env.NODE_ENV === 'production') {
      user = await getOrCreateCurrentUserRecord()
      if (!user || user.clerkId !== userId) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
    } else {
      user = await prisma.user.upsert({
        where: { clerkId: 'dev-user' },
        update: {},
        create: { clerkId: 'dev-user', email: 'dev@appforge.local', displayName: 'Dev User' },
      })
    }

    const generation = await prisma.generation.findUnique({
      where: { id },
      include: { appConfig: true },
    })

    if (!generation) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
    }

    if (process.env.NODE_ENV === 'production' && generation.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (!generation.appConfig) {
      return NextResponse.json(
        { error: 'No artifacts found for this generation' },
        { status: 404 }
      )
    }

    // Verify the file path exists in original artifacts
    const artifacts = (generation.appConfig.artifacts as Record<string, string>) || {}
    if (!(body.path in artifacts)) {
      return NextResponse.json(
        { error: `File "${body.path}" not found in artifacts` },
        { status: 404 }
      )
    }

    // Get existing overrides or initialize empty
    const existingOverrides =
      (generation.appConfig.artifactsOverride as unknown as Record<string, ArtifactOverride>) || {}

    // Merge the edit into overrides
    const updatedOverrides: Record<string, ArtifactOverride> = {
      ...existingOverrides,
      [body.path]: {
        content: body.content,
        editedAt: new Date().toISOString(),
      },
    }

    await prisma.appConfig.update({
      where: { generationId: id },
      data: {
        artifactsOverride: updatedOverrides as any,
      },
    })

    const routeLogger = createLogger({ route: '/api/generations/[id]/artifacts' })
    routeLogger.info(
      { generationId: id, filePath: body.path },
      'Artifact override saved'
    )

    return NextResponse.json({
      success: true,
      path: body.path,
      editedAt: updatedOverrides[body.path].editedAt,
    })
  } catch (error) {
    const routeLogger = createLogger({ route: '/api/generations/[id]/artifacts' })
    routeLogger.error({ err: error }, 'Failed to save artifact override')
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let userId: string | null = null

    if (process.env.NODE_ENV !== 'production') {
      userId = 'dev-user'
    } else {
      const authResult = await auth()
      userId = authResult.userId
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const generation = await prisma.generation.findUnique({
      where: { id },
      include: { appConfig: true },
    })

    if (!generation) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
    }

    if (process.env.NODE_ENV === 'production' && generation.userId !== (await getOrCreateCurrentUserRecord())?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (!generation.appConfig) {
      return NextResponse.json(
        { error: 'No artifacts found' },
        { status: 404 }
      )
    }

    const artifacts = (generation.appConfig.artifacts as Record<string, string>) || {}
    const overrides =
      (generation.appConfig.artifactsOverride as unknown as Record<string, ArtifactOverride>) || {}

    // Merge: overrides take precedence
    const merged: Record<string, string> = { ...artifacts }
    const overrideInfo: Record<string, { editedAt: string }> = {}

    for (const [path, override] of Object.entries(overrides)) {
      if (path in artifacts) {
        merged[path] = override.content
        overrideInfo[path] = { editedAt: override.editedAt }
      }
    }

    return NextResponse.json({
      artifacts: merged,
      overrides: overrideInfo,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
