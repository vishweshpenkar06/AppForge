/**
 * /api/keys — API key management
 *
 * GET  /api/keys          → List all keys for the current user (hashes only, no plaintext)
 * POST /api/keys          → Generate a new key (plaintext returned ONCE, only hash stored)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { generateApiKey, canUseApiKeys } from '@/lib/api-key-auth'

type KeysResponse = {
  keys?: { id: string; label: string; lastUsedAt: string | null; createdAt: string }[]
  error?: string
}

export async function GET(request: NextRequest): Promise<NextResponse<KeysResponse>> {
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

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const keys = await prisma.apiKey.findMany({
    where: { userId: user.id },
    select: { id: true, label: true, lastUsedAt: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    keys: keys.map((k) => ({
      id: k.id,
      label: k.label,
      lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
      createdAt: k.createdAt.toISOString(),
    })),
  })
}

type CreateKeyResponse = {
  id?: string
  plaintext?: string
  label?: string
  createdAt?: string
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<CreateKeyResponse>> {
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

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (!canUseApiKeys(user.plan)) {
    return NextResponse.json(
      { error: 'API keys require a Pro or Team plan.' },
      { status: 403 }
    )
  }

  const body = await request.json().catch(() => null)
  const label = body?.label?.trim()
  if (!label || label.length > 100) {
    return NextResponse.json(
      { error: 'Label is required and must be under 100 characters.' },
      { status: 400 }
    )
  }

  // Cap at 10 active keys per user
  const existingCount = await prisma.apiKey.count({ where: { userId: user.id } })
  if (existingCount >= 10) {
    return NextResponse.json(
      { error: 'Maximum of 10 API keys per account.' },
      { status: 400 }
    )
  }

  const { plaintext, hash } = generateApiKey()

  const key = await prisma.apiKey.create({
    data: {
      userId: user.id,
      keyHash: hash,
      label,
    },
    select: { id: true, createdAt: true },
  })

  // The plaintext is returned ONCE. The client must store it immediately.
  return NextResponse.json({
    id: key.id,
    plaintext,
    label,
    createdAt: key.createdAt.toISOString(),
  })
}
