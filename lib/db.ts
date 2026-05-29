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
}
