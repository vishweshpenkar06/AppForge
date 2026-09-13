'use client'

import Link from 'next/link'
import { useUser, UserButton } from '@clerk/nextjs'

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  team: 'Team',
}

export default function AuthControls() {
  const { isSignedIn, user } = useUser()
  const plan = (user?.publicMetadata?.plan as string) || 'free'
  const planLabel = PLAN_LABELS[plan] || 'Free'

  return (
    <div className="flex items-center gap-2">
      {!isSignedIn && (
        <>
          <Link
            href="/sign-in"
            className="text-forge-400 text-sm no-underline hover:text-forge-200 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[0.03]"
          >
            Sign in
          </Link>
          <Link
            href="/compiler"
            className="bg-accent text-white rounded-lg px-4 py-1.5 text-sm font-medium no-underline hover:bg-accent-hover transition-all hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98]"
          >
            Start compiling
          </Link>
        </>
      )}
      {isSignedIn && (
        <>
          <Link
            href="/pricing"
            className="text-[10px] font-mono font-medium px-2.5 py-1 rounded-full bg-accent-subtle text-accent no-underline uppercase tracking-wider hover:bg-accent/20 transition-colors border border-accent/20"
          >
            {planLabel}
          </Link>
          <UserButton appearance={{ elements: { userButtonAvatarBox: { width: 30, height: 30 } } }} />
        </>
      )}
    </div>
  )
}
