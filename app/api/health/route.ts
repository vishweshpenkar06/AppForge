import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getActiveProviderInfo } from '@/lib/ai'

export async function GET(request: NextRequest) {
  const deep = request.nextUrl.searchParams.get('deep') === 'true'
  const provider = getActiveProviderInfo()

  const checks: Record<string, unknown> = {
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
    services: {
      database: 'unknown',
    },
    uptime_seconds: Math.floor(process.uptime()),
  }

  // Database check (always run)
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.services = { ...checks.services as Record<string, string>, database: 'connected' }
  } catch {
    checks.services = { ...checks.services as Record<string, string>, database: 'error' }
    checks.status = 'degraded'
  }

  // Deep checks (optional, runs additional probes)
  if (deep) {
    // Redis check
    try {
      const { getCacheStats } = await import('@/lib/cache')
      const stats = await getCacheStats()
      checks.services = { ...checks.services as Record<string, string>, cache: stats.redisAvailable ? 'connected' : 'unavailable' }
    } catch {
      checks.services = { ...checks.services as Record<string, string>, cache: 'error' }
    }
  }

  const statusCode = checks.status === 'ok' ? 200 : 503

  return NextResponse.json(checks, { status: statusCode })
}
