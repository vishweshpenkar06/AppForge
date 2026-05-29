import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

// Avoid instantiating multiple Prisma Client instances in development
const globalForPrisma = global as unknown as { prisma: PrismaClient }

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set')
}

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
 * Initialize or sync a user from Clerk auth
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
    // Handle unique constraint on email: if a user with the same email exists
    // but with a different clerkId, attach the clerkId to that record and return it.
    if (err?.code === 'P2002' && err?.meta?.target?.includes('email')) {
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) {
        // If there's already a user with this email but no clerkId, set it.
        // If it has a different clerkId, we prefer keeping the existing mapping
        // and updating clerkId if empty.
        if (!existing.clerkId || existing.clerkId !== clerkId) {
          return await prisma.user.update({
            where: { id: existing.id },
            data: { clerkId, displayName: displayName || existing.displayName || '' },
          })
        }
        return existing
      }
    }

    throw err
  }
}
