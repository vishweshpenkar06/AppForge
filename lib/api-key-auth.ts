import { createHash, randomBytes } from 'crypto'
import { prisma } from './db'

const KEY_PREFIX = 'af_'
const KEY_BYTE_LENGTH = 32

/**
 * Generate a new API key. Returns the plaintext key (shown once)
 * and its SHA-256 hash (stored in DB).
 */
export function generateApiKey(): { plaintext: string; hash: string } {
  const raw = randomBytes(KEY_BYTE_LENGTH).toString('hex')
  const plaintext = `${KEY_PREFIX}${raw}`
  const hash = sha256(plaintext)
  return { plaintext, hash }
}

/**
 * Hash a plaintext API key using SHA-256 for storage comparison.
 */
export function sha256(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

/**
 * Verify an incoming plaintext key against stored hashes.
 * Returns the associated user ID if valid, null otherwise.
 */
export async function verifyApiKey(plaintext: string): Promise<{ userId: string; keyId: string } | null> {
  const hash = sha256(plaintext)

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash: hash },
    select: { id: true, userId: true },
  })

  if (!apiKey) return null

  // Update lastUsedAt asynchronously (fire-and-forget)
  prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {})

  return { userId: apiKey.userId, keyId: apiKey.id }
}

/**
 * Extract the API key from the Authorization header.
 * Accepts: "Bearer af_..." or "af_..." directly.
 */
export function extractApiKeyFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null

  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim()
  }

  if (authHeader.startsWith(KEY_PREFIX)) {
    return authHeader.trim()
  }

  return null
}

/**
 * Check if a plan tier allows API key access (pro or team only).
 */
export function canUseApiKeys(plan: string): boolean {
  return plan === 'pro' || plan === 'team'
}
