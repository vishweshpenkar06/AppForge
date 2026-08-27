import { auth } from '@clerk/nextjs/server'
import { prisma } from './db'
import type { User } from '@prisma/client'

// Hardcoded admin Clerk IDs for bootstrapping.
// Set ADMIN_USER_IDS env var as comma-separated values for production,
// or rely on the User.isAdmin database field.
function getHardcodedAdminIds(): string[] {
  const raw = process.env.ADMIN_USER_IDS
  if (!raw) return []
  return raw.split(',').map((id) => id.trim()).filter(Boolean)
}

export async function getAdminUser(): Promise<User | null> {
  let clerkId: string | null = null

  if (process.env.NODE_ENV !== 'production') {
    clerkId = 'dev-user'
  } else {
    const authResult = await auth()
    clerkId = authResult.userId
  }

  if (!clerkId) return null

  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return null

  // Check both: hardcoded list AND database flag
  const hardcoded = getHardcodedAdminIds()
  if (hardcoded.includes(clerkId) || user.isAdmin) {
    return user
  }

  return null
}

export async function requireAdmin(): Promise<{ user: User } | { error: Response }> {
  const user = await getAdminUser()
  if (!user) {
    return {
      error: new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }),
    }
  }
  return { user }
}
