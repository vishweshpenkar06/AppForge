import { NextRequest, NextResponse } from 'next/server'
import { verifyApiKey, extractApiKeyFromHeader } from '@/lib/api-key-auth'
import { prisma } from '@/lib/db'

export interface ApiKeyAuthResult {
  userId: string
  clerkId: string
  keyId: string
}

/**
 * Attempt to authenticate a request via API key.
 *
 * Returns the authenticated user's DB record + key ID on success,
 * or null if no valid API key was provided (caller should fall back to Clerk).
 */
export async function authenticateViaApiKey(request: NextRequest): Promise<ApiKeyAuthResult | null> {
  const authHeader = request.headers.get('authorization')
  const apiKey = extractApiKeyFromHeader(authHeader)

  if (!apiKey) return null

  const result = await verifyApiKey(apiKey)
  if (!result) return null

  const user = await prisma.user.findUnique({
    where: { id: result.userId },
    select: { id: true, clerkId: true },
  })

  if (!user) return null

  return { userId: user.clerkId, clerkId: user.clerkId, keyId: result.keyId }
}

/**
 * Check rate limit for an API key, using the SAME rate-limit logic
 * from lib/rate-limit.ts but keyed by the API key ID instead of Clerk userId.
 */
export function buildApiKeyRateLimitKey(keyId: string): string {
  return `gen:apikey:${keyId}`
}
