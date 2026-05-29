'use client'

import Link from 'next/link'
import { useUser, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'

export default function AuthControls() {
  const { isSignedIn } = useUser()

  return (
    <div className="flex items-center gap-2">
      {!isSignedIn && (
        <>
          <SignInButton>
            <Button variant="ghost" size="sm" className="rounded-full border border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/8">
              Sign in
            </Button>
          </SignInButton>
          <SignUpButton>
            <Button size="sm" className="rounded-full bg-sky-400 text-black hover:bg-sky-300">
              Sign up
            </Button>
          </SignUpButton>
        </>
      )}

      {isSignedIn && (
        <>
          <Link href="/dashboard" className="hidden rounded-full px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white sm:inline-flex">
            Dashboard
          </Link>
          <UserButton appearance={{ elements: { userButtonAvatarBox: 'h-9 w-9' } }} />
        </>
      )}
    </div>
  )
}
