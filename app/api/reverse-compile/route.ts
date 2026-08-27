/**
 * POST /api/reverse-compile
 *
 * Accepts a public GitHub repo URL, fetches its file tree + key files,
 * reverse-engineers an AppConfig summary via LLM, and persists it as
 * a synthetic Generation record so the existing detail viewer renders it.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { reverseCompile } from '@/lib/compiler/reverse'

const GITHUB_RAW = 'https://api.github.com'
const GITHUB_TOKEN = process.env.GITHUB_TOKEN // optional, raises rate limit from 60 → 5000/hr

const KEY_FILES = [
  'package.json',
  'tsconfig.json',
  'prisma/schema.prisma',
  'drizzle.config.ts',
  'drizzle.config.js',
  'src/server/db.ts',
  'src/lib/db.ts',
  'lib/db.ts',
  'src/middleware.ts',
  'middleware.ts',
  'next.config.js',
  'next.config.mjs',
  'next.config.ts',
  'app/layout.tsx',
  'src/app/layout.tsx',
  'pages/_app.tsx',
]

const IGNORE_DIRS = new Set([
  'node_modules', '.next', '.git', 'dist', 'build', '.turbo',
  '.cache', 'coverage', '.vercel', '.github',
])

const MAX_FILES_FOR_LLM = 40
const MAX_RAW_FILE_BYTES = 80_000
const TREE_SOFT_LIMIT = 500

function parseRepoUrl(url: string): { owner: string; repo: string; branch: string } | null {
  try {
    const u = new URL(url.replace(/\.git$/, ''))
    const parts = u.pathname.replace(/^\//, '').replace(/\/$/, '').split('/')
    if (parts.length < 2) return null
    const [owner, repo] = parts
    // Allow optional /tree/branch suffix
    let branch = 'HEAD'
    if (parts.length >= 4 && parts[2] === 'tree') {
      branch = parts[3]
    }
    return { owner, repo, branch }
  } catch {
    return null
  }
}

function ghHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'AppForge-ReverseCompiler/1.0',
  }
  if (GITHUB_TOKEN) h.Authorization = `Bearer ${GITHUB_TOKEN}`
  return h
}

interface TreeEntry {
  path: string
  type: string
  size?: number
}

function isKeyFile(path: string): boolean {
  return KEY_FILES.some((kf) => path === kf || path.endsWith('/' + kf))
}

function isSourceFile(path: string): boolean {
  if (!/\.(ts|tsx|js|jsx|prisma|sql|py|go|rb|rs)$/.test(path)) return false
  const segments = path.split('/')
  if (segments.some((s) => IGNORE_DIRS.has(s))) return false
  return true
}

function buildFileTree(entries: TreeEntry[]): string {
  const lines: string[] = []
  for (const e of entries) {
    if (e.type === 'blob') {
      const segments = e.path.split('/')
      const indent = '  '.repeat(Math.max(0, segments.length - 1))
      const name = segments[segments.length - 1]
      lines.push(`${indent}${name}`)
    }
  }
  return lines.join('\n')
}

async function fetchFile(owner: string, repo: string, path: string, ref: string): Promise<string | null> {
  try {
    const url = `${GITHUB_RAW}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${ref}`
    const res = await fetch(url, { headers: ghHeaders(), next: { revalidate: 0 } })
    if (!res.ok) return null
    const data = await res.json()
    if (data.encoding === 'base64' && data.content) {
      const decoded = Buffer.from(data.content, 'base64').toString('utf-8')
      return decoded.slice(0, MAX_RAW_FILE_BYTES)
    }
    return null
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  // ── Auth ───────────────────────────────────────────────────
  let userId: string | null = null
  if (process.env.NODE_ENV === 'production') {
    const authResult = await auth()
    userId = authResult.userId
  } else {
    userId = 'dev-user'
  }

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const repoUrl = body?.repoUrl?.trim()
  if (!repoUrl) {
    return NextResponse.json({ error: 'repoUrl is required.' }, { status: 400 })
  }

  const parsed = parseRepoUrl(repoUrl)
  if (!parsed) {
    return NextResponse.json(
      { error: 'Invalid GitHub URL. Expected format: https://github.com/{owner}/{repo}' },
      { status: 400 }
    )
  }

  const { owner, repo, branch } = parsed

  try {
    // ── 1. Fetch file tree ─────────────────────────────────
    const treeUrl = `${GITHUB_RAW}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
    const treeRes = await fetch(treeUrl, { headers: ghHeaders(), next: { revalidate: 0 } })

    if (!treeRes.ok) {
      const msg = treeRes.status === 404
        ? 'Repository not found. Make sure it is a public repo and the URL is correct.'
        : `GitHub API error (${treeRes.status}). You may be rate-limited — set GITHUB_TOKEN for higher limits.`
      return NextResponse.json({ error: msg }, { status: 422 })
    }

    const treeData = await treeRes.json()
    const entries: TreeEntry[] = (treeData.tree ?? []).filter(
      (e: TreeEntry) => e.type === 'blob' && !e.path.split('/').some((s) => IGNORE_DIRS.has(s))
    )

    if (entries.length === 0) {
      return NextResponse.json({ error: 'Repository appears empty or only contains ignored directories.' }, { status: 422 })
    }

    // ── 2. Fetch key files ─────────────────────────────────
    const toFetch = entries
      .filter((e) => isKeyFile(e.path))
      .slice(0, 15)

    const fileContents: string[] = []
    const fetchPromises = toFetch.map(async (e) => {
      const content = await fetchFile(owner, repo, e.path, branch)
      if (content) {
        fileContents.push(`### ${e.path}\n\`\`\`\n${content}\n\`\`\``)
      }
    })
    await Promise.all(fetchPromises)

    // ── 3. Build file tree string ──────────────────────────
    const treeStr = buildFileTree(entries.slice(0, TREE_SOFT_LIMIT))
    if (entries.length > TREE_SOFT_LIMIT) {
      fileContents.push(`\n... and ${entries.length - TREE_SOFT_LIMIT} more files`)
    }

    // ── 4. Reverse compile via LLM ────────────────────────
    const result = await reverseCompile(
      repoUrl,
      treeStr,
      fileContents.join('\n\n')
    )

    // ── 5. Create synthetic Generation + AppConfig ────────
    let user
    if (process.env.NODE_ENV === 'production') {
      user = await prisma.user.findUnique({ where: { clerkId: userId } })
    } else {
      user = await prisma.user.upsert({
        where: { clerkId: 'dev-user' },
        update: {},
        create: { clerkId: 'dev-user', email: 'dev@appforge.local', displayName: 'Dev User' },
      })
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const generation = await prisma.generation.create({
      data: {
        userId: user.id,
        prompt: `Reverse-compile: ${repoUrl}`,
        mode: 'reverse-compiled',
        status: 'completed',
        completedAt: new Date(),
        totalLatencyMs: result.latencyMs,
        metadata: {
          source: 'reverse-compile',
          repoUrl,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
        } as any,
      },
    })

    await prisma.appConfig.create({
      data: {
        generationId: generation.id,
        config: result.config as any,
        validationPassed: true,
      },
    })

    return NextResponse.json({
      jobId: generation.id,
      config: result.config,
      metrics: {
        latency: result.latencyMs,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
      },
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Reverse compilation failed'
    console.error('[reverse-compile]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
