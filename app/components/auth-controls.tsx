'use client'

import Link from 'next/link'
import { useUser, UserButton } from '@clerk/nextjs'

export default function AuthControls() {
  const { isSignedIn } = useUser()

  return (
    <div className="flex items-center gap-2">
      {!isSignedIn && (
        <>
          <Link
            href="/sign-in"
            className="text-forge-300 text-sm no-underline hover:text-forge-50 transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:rounded-md px-2 py-1"
          >
            Sign in
          </Link>
          <Link
            href="/compiler"
            className="bg-accent text-white rounded-lg px-3 py-1.5 text-sm font-medium no-underline hover:bg-accent-hover transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-forge-950"
          >
            Start compiling
          </Link>
        </>
      )}
      {isSignedIn && (
        <>
          <Link
            href="/pricing"
            className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent-subtle text-accent-hover no-underline uppercase tracking-wider hover:bg-accent/20 transition-colors"
          >
            Free
          </Link>
          <UserButton appearance={{ elements: { userButtonAvatarBox: { width: 28, height: 28 } } }} />
        </>
      )}
    </div>
  )
}
