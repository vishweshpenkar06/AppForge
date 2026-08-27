/**
 * /api/keys/[id] — Manage a specific API key
 *
 * DELETE /api/keys/[id]  → Revoke (permanently delete) an API key
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

type DeleteKeyResponse = {
  success?: boolean
  error?: string
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<DeleteKeyResponse>> {
  const { id } = await params

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

  // Verify the key belongs to this user before deleting
  const key = await prisma.apiKey.findFirst({
    where: { id, userId: user.id },
  })

  if (!key) {
    return NextResponse.json({ error: 'API key not found' }, { status: 404 })
  }

  await prisma.apiKey.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
