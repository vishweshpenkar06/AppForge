import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getActiveProviderInfo } from '@/lib/ai'

export async function GET() {
  const provider = getActiveProviderInfo()

  const checks: Record<string, any> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    pipeline: {
      stages: 6,
      llm: {
        active_provider: provider.active,
        fallback_provider: provider.fallback,
        model: provider.model,
        base_url: provider.baseUrl,
        deterministic_mode: provider.deterministic,
      },
    },
    database: 'unknown',
    uptime_seconds: Math.floor(process.uptime()),
  }

  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = 'connected'
  } catch {
    checks.database = 'error'
    checks.status = 'degraded'
  }

  return NextResponse.json(checks, {
    status: checks.status === 'ok' ? 200 : 503,
  })
}
