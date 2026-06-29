import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { getOrCreateCurrentUserRecord } from '@/lib/clerk-user'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let userId: string | null = null

    // Dev mode: skip auth for local testing
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
    const format = request.nextUrl.searchParams.get('format') || 'json'

    let user = null
    if (process.env.NODE_ENV === 'production') {
      user = await getOrCreateCurrentUserRecord()
      if (!user || user.clerkId !== userId) {
        return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
      }
    } else {
      // Dev mode: find or create dev user
      user = await prisma.user.upsert({
        where: { clerkId: 'dev-user' },
        update: {},
        create: { clerkId: 'dev-user', email: 'dev@appforge.local', displayName: 'Dev User' },
      })
    }

    const generation = await prisma.generation.findUnique({
      where: { id },
    })

    if (!generation) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
    }

    // Ensure user owns this generation (skip in dev mode)
    if (process.env.NODE_ENV === 'production' && generation.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (generation.status !== 'completed') {
      return NextResponse.json({ error: 'Generation is not completed yet' }, { status: 400 })
    }

    const config = generation.config as any

    if (format === 'yaml') {
      // Convert JSON to YAML format
      const yaml = convertToYAML(config)
      return new NextResponse(yaml, {
        headers: {
          'Content-Type': 'text/yaml',
          'Content-Disposition': `attachment; filename="appforge-config-${id}.yaml"`,
        },
      })
    }

    // Default: JSON format
    const json = JSON.stringify(config, null, 2)
    return new NextResponse(json, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="appforge-config-${id}.json"`,
      },
    })
  } catch (error) {
    console.error('[API Error] /api/generations/[id]/export:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

function convertToYAML(obj: any, indent = 0): string {
  const spaces = ' '.repeat(indent)
  let result = ''

  if (typeof obj !== 'object' || obj === null) {
    return JSON.stringify(obj)
  }

  if (Array.isArray(obj)) {
    return obj
      .map((item) => {
        if (typeof item === 'object' && item !== null) {
          return `${spaces}- ${convertToYAML(item, indent + 2)}`
        }
        return `${spaces}- ${JSON.stringify(item)}`
      })
      .join('\n')
  }

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result += `${spaces}${key}:\n${convertToYAML(value, indent + 2)}\n`
    } else if (Array.isArray(value)) {
      result += `${spaces}${key}:\n${convertToYAML(value, indent + 2)}\n`
    } else {
      result += `${spaces}${key}: ${JSON.stringify(value)}\n`
    }
  }

  return result
}
