import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

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
    const format = request.nextUrl.searchParams.get('format') || 'json'

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      )
    }

    const generation = await prisma.generation.findUnique({
      where: { id },
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

    if (generation.status !== 'completed') {
      return NextResponse.json(
        { error: 'Generation is not completed yet' },
        { status: 400 }
      )
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
