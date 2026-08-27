import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { getOrCreateCurrentUserRecord } from '@/lib/clerk-user'
import { canExportFormat, type PlanTier } from '@/lib/plan-limits'
import JSZip from 'jszip'
import { createLogger } from '@/lib/logger'

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
    const format = request.nextUrl.searchParams.get('format') || 'json'

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

    // ── Plan gating for export formats ──────────────────────────
    const plan = (user?.plan as PlanTier) || 'free'
    if (!canExportFormat(plan, format)) {
      return NextResponse.json(
        {
          error: `Exporting as "${format}" requires a Pro or Team plan.`,
          upgradeRequired: true,
          currentPlan: plan,
        },
        { status: 403 }
      )
    }

    // ── YAML export ────────────────────────────────────────────
    if (format === 'yaml') {
      const yaml = convertToYAML(config)
      return new NextResponse(yaml, {
        headers: {
          'Content-Type': 'text/yaml',
          'Content-Disposition': `attachment; filename="appforge-config-${id}.yaml"`,
        },
      })
    }

    // ── ZIP export ─────────────────────────────────────────────
    if (format === 'zip') {
      const zip = new JSZip()

      // Folder 1: config
      zip.file('config/appforge-config.json', JSON.stringify(config, null, 2))

      // Folder 2: database — from artifacts or config
      const sqlContent = artifacts?.['prisma.schema']
        || config?.implementationPlan?.prismaSchema
        || config?.runtime?.sql
        || ''
      if (sqlContent) {
        zip.file('database/schema.sql', sqlContent)
        // Also include prisma schema if it looks like prisma format
        if (sqlContent.includes('model ') || sqlContent.includes('generator ')) {
          zip.file('database/schema.prisma', sqlContent)
        }
      }

      // Folder 3: backend — Express server from artifacts or runtime
      const expressContent = artifacts?.['app/api/route.ts']
        || config?.runtime?.express
        || ''
      if (expressContent) {
        zip.file('backend/server.js', expressContent)
      }
      // Add individual API handler stubs from artifacts
      if (artifacts) {
        for (const [key, content] of Object.entries(artifacts)) {
          if (key.startsWith('app/api/') && key.endsWith('/route.ts') && typeof content === 'string') {
            zip.file(`backend/${key}`, content)
          }
        }
      }

      // Folder 4: frontend — React files from artifacts or runtime
      if (config?.runtime?.react && typeof config.runtime.react === 'object') {
        for (const [filename, content] of Object.entries(config.runtime.react as Record<string, string>)) {
          if (typeof content === 'string') {
            zip.file(`frontend/${filename}`, content)
          }
        }
      }
      // Add UI page stubs from artifacts
      if (artifacts) {
        for (const [key, content] of Object.entries(artifacts)) {
          if (key.startsWith('app/') && key.endsWith('/page.tsx') && typeof content === 'string') {
            zip.file(`frontend/${key}`, content)
          }
        }
      }

      // Folder 5: docs — 6 planning documents from artifacts
      const DOC_FILE_NAMES: Record<string, string> = {
        'PRD.md': 'PRD - Product Requirements.md',
        'TRD.md': 'TRD - Technical Requirements.md',
        'AppFlow.md': 'App Flow.md',
        'UI-UX-BRIEF.md': 'UI-UX Brief.md',
        'BACKEND-SCHEMA.md': 'Backend Schema.md',
        'IMPLEMENTATION-PLAN.md': 'Implementation Plan.md',
        'prd': 'PRD - Product Requirements.md',
        'trd': 'TRD - Technical Requirements.md',
        'appFlow': 'App Flow.md',
        'appflow': 'App Flow.md',
        'uiUxBrief': 'UI-UX Brief.md',
        'uiux': 'UI-UX Brief.md',
        'backendSchema': 'Backend Schema.md',
        'implementationPlan': 'Implementation Plan.md',
      }

      // Check all possible doc locations
      const docSources = [
        artifacts,
        config?.planningDocs,
        config?.docs,
      ].find(Boolean) as Record<string, string> | undefined

      console.log('[Export] Doc keys found:', docSources ? Object.keys(docSources) : 'none')
      console.log('[Export] Runtime keys:', config?.runtime ? Object.keys(config.runtime) : 'none')
      console.log('[Export] Artifacts keys:', artifacts ? Object.keys(artifacts) : 'none')

      if (docSources && typeof docSources === 'object') {
        for (const [key, content] of Object.entries(docSources)) {
          if (typeof content === 'string' && content.length > 0) {
            const fileName = DOC_FILE_NAMES[key] || DOC_FILE_NAMES[key.toLowerCase()] || `${key}.md`
            zip.file(`docs/${fileName}`, content)
          }
        }
      }

      // README
      const appName = config?.metadata?.name || 'AppForge Export'
      zip.file('README.md', `# ${appName}
Generated by AppForge — Natural Language Application Compiler

## Folder Structure

\`\`\`
config/
  appforge-config.json   ← Full validated app configuration
database/
  schema.sql             ← SQLite/PostgreSQL CREATE TABLE statements
  schema.prisma          ← Prisma schema (if available)
backend/
  server.js              ← Express server with JWT auth + all endpoints
  app/api/...            ← Individual API route handlers
frontend/
  App.jsx                ← React app with routing
  pages/                 ← One component per page
docs/
  PRD - Product Requirements.md
  TRD - Technical Requirements.md
  App Flow.md
  UI-UX Brief.md
  Backend Schema.md
  Implementation Plan.md
\`\`\`

## How to use
1. Import \`database/schema.sql\` into SQLite or PostgreSQL
2. Run \`node backend/server.js\` (requires: express, jsonwebtoken)
3. Open \`frontend/App.jsx\` in your React project
`)

      const zipBuffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      })

      const appSlug = (config?.metadata?.name || 'appforge')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

      return new NextResponse(zipBuffer, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${appSlug}-export.zip"`,
          'Content-Length': zipBuffer.length.toString(),
        },
      })
    }

    // ── Default: JSON ──────────────────────────────────────────
    const json = JSON.stringify(config, null, 2)
    return new NextResponse(json, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="appforge-config-${id}.json"`,
      },
    })
  } catch (error) {
    const routeLogger = createLogger({ route: '/api/generations/[id]/export' })
    routeLogger.error({ err: error, route: '/api/generations/[id]/export' }, 'Request failed')
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
