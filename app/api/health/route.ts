import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const checks: Record<string, any> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    pipeline: {
      stages: 6,
      llm_provider: process.env.LLM_PROVIDER || 'groq',
      deterministic_mode: process.env.DETERMINISTIC_LLM === '1',
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
