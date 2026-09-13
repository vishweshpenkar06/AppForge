import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { createLogger } from './logger'
import { getEnv } from './env'

const logger = createLogger({ module: 'db' })

// Validate env vars at module load time
getEnv()

// Avoid instantiating multiple Prisma Client instances in development
const globalForPrisma = global as unknown as { prisma: PrismaClient }

const databaseUrl = process.env.DATABASE_URL!

const adapter = new PrismaPg({ connectionString: databaseUrl })

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'warn', 'error']
        : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

/**
 * Initialize or sync a user from Clerk auth.
 * Uses upsert on clerkId to avoid P2002 conflicts on email.
 * If a different Clerk account has the same email, rejects the sync
 * to prevent account takeover.
 */
export async function syncUserFromClerk(clerkId: string, email: string, displayName?: string) {
  try {
    return await prisma.user.upsert({
      where: { clerkId },
      update: {
        email,
        displayName: displayName || undefined,
      },
      create: {
        clerkId,
        email,
        displayName: displayName || '',
      },
    })
  } catch (err: any) {
    if (err?.code === 'P2002' && err?.meta?.target?.includes('email')) {
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) {
        if (existing.clerkId && existing.clerkId !== clerkId) {
          // Another Clerk account already owns this email — reject to prevent takeover
          logger.error(
            { existingClerkId: existing.clerkId, newClerkId: clerkId, email },
            'Email collision detected — rejecting sync to prevent account takeover',
          )
          return existing
        }
        return await prisma.user.update({
          where: { id: existing.id },
          data: { clerkId, displayName: displayName || existing.displayName || '' },
        })
      }
    }

    throw err
  }
}
