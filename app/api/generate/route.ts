import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { getOrCreateCurrentUserRecord } from '@/lib/clerk-user'
import { generateApplication } from '@/lib/pipeline'
import { checkRateLimit, buildRateLimitKey } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rlKey = buildRateLimitKey(userId)
    const rl = checkRateLimit(rlKey)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'rate_limited', resetAt: rl.resetAt.toISOString() },
        { status: 429 }
      )
    }

    const { prompt, mode = 'balanced' } = await request.json()

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    if (!['fast', 'balanced', 'precise'].includes(mode)) {
      return NextResponse.json(
        { error: 'Mode must be one of: fast, balanced, precise' },
        { status: 400 }
      )
    }

    // Create or sync the database user on demand so webhooks are not a hard dependency.
    const user = await getOrCreateCurrentUserRecord()

    if (!user || user.clerkId !== userId) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      )
    }

    // Create generation job record
    const generation = await prisma.generation.create({
      data: {
        userId: user.id,
        prompt,
        mode,
        status: 'pending',
      },
    })

    // Start async pipeline execution
    // In production, this would be a background job (BullMQ/Redis)
    // For now, we'll start it and let it run asynchronously
    generateApplication(generation.id, prompt, mode).catch((error) => {
      console.error(`[Pipeline Error] Generation ${generation.id}:`, error)
      // Update generation record with error
      prisma.generation.update({
        where: { id: generation.id },
        data: {
          status: 'failed',
          errorMessage: error.message || 'Unknown error during generation',
        },
      }).catch(console.error)
    })

    return NextResponse.json({
      jobId: generation.id,
      status: 'pending',
      message: 'Generation started',
    })
  } catch (error) {
    console.error('[API Error] /api/generate:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
