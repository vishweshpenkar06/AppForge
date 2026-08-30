import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createLogger } from '@/lib/logger'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'CLERK_WEBHOOK_SECRET is not set' }, { status: 500 })
  }

  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const routeLogger = createLogger({ route: '/api/webhooks/clerk' })

  const body = await req.text()

  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: any

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    })
  } catch (err) {
    routeLogger.error({ err, route: '/api/webhooks/clerk' }, 'Webhook verification failed')
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const eventType = evt.type

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data

    const email = email_addresses?.[0]?.email_address || ''

    try {
      await prisma.user.create({
        data: {
          clerkId: id,
          email,
          displayName: `${first_name || ''} ${last_name || ''}`.trim() || email,
        },
      })
      console.log(`[Webhook] User created: ${id}`)
    } catch (error) {
      routeLogger.error({ err: error, route: '/api/webhooks/clerk', clerkEvent: 'user.created' }, 'Error creating user')
      // If user already exists, that's fine
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data

    try {
      // Delete generations first due to foreign key
      await prisma.generation.deleteMany({
        where: { user: { clerkId: id } },
      })

      await prisma.user.delete({
        where: { clerkId: id },
      })

      console.log(`[Webhook] User deleted: ${id}`)
    } catch (error) {
      routeLogger.error({ err: error, route: '/api/webhooks/clerk', clerkEvent: 'user.deleted' }, 'Error deleting user')
    }
  }

  return NextResponse.json({ received: true })
}
