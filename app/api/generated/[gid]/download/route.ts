import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const archiver = require('archiver')

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gid: string }> }
) {
  const { gid } = await params

  let userId: string | null = null
  if (process.env.ENABLE_DEV_AUTH === 'true') {
    userId = 'dev-user'
  } else {
    const authResult = await auth()
    userId = authResult.userId
  }

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const generation = await prisma.generation.findUnique({
    where: { id: gid },
    include: { appConfig: true, user: true },
  })

  if (!generation?.appConfig?.artifacts) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Verify ownership in production
  if (process.env.ENABLE_DEV_AUTH !== 'true' && generation.user.clerkId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const rawArtifacts = generation.appConfig.artifacts as Record<string, string>
  const overrides = (generation.appConfig.artifactsOverride as Record<string, { content: string }>) || {}

  // Merge: overrides take precedence
  const artifacts: Record<string, string> = {
    ...rawArtifacts,
    ...Object.fromEntries(
      Object.entries(overrides)
        .filter(([key]) => key in rawArtifacts)
        .map(([key, val]) => [key, val.content])
    ),
  }

  const chunks: Buffer[] = []
  const archive = archiver('zip', { zlib: { level: 9 } })

  await new Promise<void>((resolve, reject) => {
    archive.on('data', (chunk: Buffer) => chunks.push(chunk))
    archive.on('end', resolve)
    archive.on('error', reject)

    for (const [filePath, content] of Object.entries(artifacts)) {
      archive.append(content, { name: filePath })
    }
    archive.finalize()
  })

  const zipBuffer = Buffer.concat(chunks)

  return new Response(zipBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${gid}.zip"`,
    },
  })
}

export const runtime = 'nodejs'
