/**
 * /api/webhooks/outbound — Outbound webhook endpoint management
 *
 * GET    /api/webhooks/outbound        → List all webhook endpoints for the current user
 * POST   /api/webhooks/outbound        → Create a new webhook endpoint (secret returned ONCE)
 * DELETE /api/webhooks/outbound?id=xxx  → Remove a webhook endpoint by id
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { generateWebhookSecret, AVAILABLE_EVENTS } from '@/lib/webhook-dispatch'

type ListResponse = {
  endpoints?: {
    id: string
    url: string
    events: string[]
    isActive: boolean
    createdAt: string
  }[]
  error?: string
}

export async function GET(): Promise<NextResponse<ListResponse>> {
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

  const endpoints = await prisma.webhookEndpoint.findMany({
    where: { userId: user.id },
    select: { id: true, url: true, events: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    endpoints: endpoints.map((ep) => ({
      id: ep.id,
      url: ep.url,
      events: ep.events,
      isActive: ep.isActive,
      createdAt: ep.createdAt.toISOString(),
    })),
  })
}

type CreateResponse = {
  id?: string
  url?: string
  secret?: string
  events?: string[]
  createdAt?: string
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<CreateResponse>> {
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

  const body = await request.json().catch(() => null)
  const url = body?.url?.trim()
  const events: string[] = body?.events ?? []

  // Validate URL
  if (!url) {
    return NextResponse.json({ error: 'URL is required.' }, { status: 400 })
  }
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return NextResponse.json({ error: 'URL must use http or https.' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid URL format.' }, { status: 400 })
  }

  // Validate events
  const validEventValues = AVAILABLE_EVENTS.map((e) => e.value) as string[]
  const validEvents = events.filter((e) => validEventValues.includes(e))
  if (validEvents.length === 0) {
    return NextResponse.json(
      { error: `At least one valid event is required. Valid events: ${validEventValues.join(', ')}` },
      { status: 400 },
    )
  }

  // Cap at 10 active webhook endpoints per user
  const existingCount = await prisma.webhookEndpoint.count({ where: { userId: user.id } })
  if (existingCount >= 10) {
    return NextResponse.json(
      { error: 'Maximum of 10 webhook endpoints per account.' },
      { status: 400 },
    )
  }

  const { raw, stored } = generateWebhookSecret()

  const endpoint = await prisma.webhookEndpoint.create({
    data: {
      userId: user.id,
      url,
      secret: stored,
      events: validEvents,
    },
    select: { id: true, createdAt: true },
  })

  // The secret is returned ONCE. The client must store it immediately.
  return NextResponse.json({
    id: endpoint.id,
    url,
    secret: raw,
    events: validEvents,
    createdAt: endpoint.createdAt.toISOString(),
  })
}

type DeleteResponse = { success?: boolean; error?: string }

export async function DELETE(request: NextRequest): Promise<NextResponse<DeleteResponse>> {
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

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Endpoint id is required.' }, { status: 400 })
  }

  // Verify ownership before deleting
  const endpoint = await prisma.webhookEndpoint.findUnique({
    where: { id },
    select: { userId: true },
  })

  if (!endpoint || endpoint.userId !== user.id) {
    return NextResponse.json({ error: 'Endpoint not found.' }, { status: 404 })
  }

  await prisma.webhookEndpoint.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
