import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { getOrCreateCurrentUserRecord } from '@/lib/clerk-user'
import {
  createGithubRepo,
  pushFilesToRepo,
  buildVercelDeployUrl,
  assembleDeployFiles,
} from '@/lib/github-export'

export async function POST(
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

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN
    if (!GITHUB_TOKEN) {
      return NextResponse.json(
        { error: 'GitHub integration not configured. Set GITHUB_TOKEN env var.' },
        { status: 503 }
      )
    }

    const { id } = await params

    // Dev mode user setup
    let user = null
    if (process.env.NODE_ENV === 'production') {
      user = await getOrCreateCurrentUserRecord()
      if (!user || user.clerkId !== userId) {
        return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
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

    if (generation.status !== 'completed') {
      return NextResponse.json({ error: 'Generation is not completed yet' }, { status: 400 })
    }

    const config = (generation as any).appConfig?.config ?? generation.config ?? null
    const artifacts = (generation as any).appConfig?.artifacts ?? null

    if (!config) {
      return NextResponse.json({ error: 'No config found for this generation' }, { status: 404 })
    }

    // Assemble files from existing config + artifacts (no regeneration)
    const files = assembleDeployFiles(config, artifacts)

    if (Object.keys(files).length === 0) {
      return NextResponse.json(
        { error: 'No files to deploy. Generation output appears empty.' },
        { status: 422 }
      )
    }

    const appName = (config?.metadata?.name || 'appforge-app')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50)

    // 1. Create GitHub repo
    const repo = await createGithubRepo(
      GITHUB_TOKEN,
      appName,
      config?.metadata?.description || `AppForge-generated: ${config?.metadata?.name || appName}`
    )

    // 2. Push files
    await pushFilesToRepo(GITHUB_TOKEN, repo.owner, repo.repo, files)

    // 3. Build Vercel deploy URL
    const deployUrl = buildVercelDeployUrl(repo.url)

    return NextResponse.json({
      repoUrl: repo.url,
      repoName: `${repo.owner}/${repo.repo}`,
      deployUrl,
      fileCount: Object.keys(files).length,
    })
  } catch (error) {
    console.error('[API Error] /api/generations/[id]/deploy:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
