import { createHmac, randomBytes } from 'crypto'
import { prisma } from '@/lib/db'
import { createLogger } from '@/lib/logger'

const logger = createLogger({ module: 'webhook-dispatch' })

export type WebhookEvent = 'generation.completed' | 'generation.failed'

interface WebhookPayload {
  event: WebhookEvent
  timestamp: string
  data: Record<string, unknown>
}

/**
 * Generate a new webhook signing secret.
 * Returns the raw secret (to show once) and the hex-encoded version (for storage).
 */
export function generateWebhookSecret(): { raw: string; stored: string } {
  const raw = randomBytes(32).toString('base64url')
  const stored = createHmac('sha256', 'appforge-webhook-secret').update(raw).digest('hex')
  return { raw, stored }
}

/**
 * Sign a JSON payload using HMAC-SHA256 with the endpoint's stored secret.
 * The signature is computed over `rawSecret + body` to match typical webhook patterns.
 */
export function signPayload(rawSecret: string, body: string): string {
  return createHmac('sha256', rawSecret).update(body).digest('hex')
}

/**
 * Dispatch a single webhook to an endpoint.
 * Note: `endpoint.secret` is the HMAC secret (stored as base64url).
 */
async function dispatchSingle(
  endpoint: { id: string; url: string; secret: string },
  payload: WebhookPayload,
): Promise<{ ok: boolean; status?: number; error?: string }> {
  const body = JSON.stringify(payload)
  const signature = signPayload(endpoint.secret, body)

  try {
    const res = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AppForge-Signature': `sha256=${signature}`,
        'X-AppForge-Event': payload.event,
        'X-AppForge-Delivery': payload.timestamp,
        'User-Agent': 'AppForge-Webhook/1.0',
      },
      body,
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      logger.warn(
        { endpointId: endpoint.id, status: res.status, event: payload.event },
        'Webhook returned non-2xx',
      )
      return { ok: false, status: res.status }
    }

    logger.info(
      { endpointId: endpoint.id, event: payload.event },
      'Webhook dispatched successfully',
    )
    return { ok: true, status: res.status }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    logger.error(
      { endpointId: endpoint.id, event: payload.event, err: msg },
      'Webhook dispatch failed',
    )
    return { ok: false, error: msg }
  }
}

/**
 * Find all active webhook endpoints for a user that subscribe to the given event,
 * then dispatch to each one. Fire-and-forget — does not block the caller.
 */
export async function dispatchWebhooks(
  userId: string,
  event: WebhookEvent,
  data: Record<string, unknown>,
): Promise<void> {
  const endpoints = await prisma.webhookEndpoint.findMany({
    where: {
      userId,
      isActive: true,
      events: { has: event },
    },
    select: { id: true, url: true, secret: true },
  })

  if (endpoints.length === 0) return

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  }

  // Dispatch in parallel, fire-and-forget
  const results = await Promise.allSettled(
    endpoints.map((ep) => dispatchSingle(ep, payload)),
  )

  const failed = results.filter(
    (r) => r.status === 'fulfilled' && !r.value.ok,
  )
  if (failed.length > 0) {
    logger.warn(
      { event, userId, failedCount: failed.length, total: endpoints.length },
      'Some webhook deliveries failed',
    )
  }
}
