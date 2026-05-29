import { currentUser } from '@clerk/nextjs/server'
import type { User } from '@prisma/client'

import { syncUserFromClerk } from './db'

function getDisplayName(clerkUser: NonNullable<Awaited<ReturnType<typeof currentUser>>>) {
  const parts = [clerkUser.firstName, clerkUser.lastName].filter(Boolean)
  if (parts.length > 0) {
    return parts.join(' ')
  }

  return clerkUser.emailAddresses[0]?.emailAddress.split('@')[0] || clerkUser.id
}

export async function getOrCreateCurrentUserRecord(): Promise<User | null> {
  const clerkUser = await currentUser()

  if (!clerkUser) {
    return null
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress || `${clerkUser.id}@clerk.local`
  const displayName = getDisplayName(clerkUser)

  return syncUserFromClerk(clerkUser.id, email, displayName)
}