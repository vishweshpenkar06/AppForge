import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const llmProvider = process.env.NVIDIA_API_KEY ? 'nvidia (meta/llama-3.3-70b-instruct)'
    : process.env.GROQ_API_KEY ? 'groq (llama-3.3-70b-versatile)'
    : process.env.FEATHERLESS_API_KEY ? 'featherless'
    : 'none configured'

  const checks: Record<string, any> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    pipeline: {
      stages: 6,
      llm_provider: llmProvider,
      model: process.env.LLM_MODEL || 'meta/llama-3.3-70b-instruct',
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
