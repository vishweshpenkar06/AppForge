'use client'

import Link from 'next/link'
import { useUser, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'

export default function AuthControls() {
  const { isSignedIn } = useUser()

  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      {!isSignedIn && (
        <>
          <Link href="/sign-in" style={{ color:'var(--text-secondary)', fontSize:13, textDecoration:'none' }}>Sign in</Link>
          <Link href="/compiler" style={{ background:'var(--fill-accent)', color:'#fff', borderRadius:'var(--radius)', padding:'6px 14px', fontSize:13, fontWeight:500, textDecoration:'none' }}>Get started</Link>
        </>
      )}
      {isSignedIn && (
        <>
          <Link href="/pricing" style={{ fontSize:10, fontWeight:500, padding:'2px 8px', borderRadius:20, background:'var(--fill-accent-subtle)', color:'var(--text-accent)', textTransform:'uppercase', letterSpacing:'0.04em', textDecoration:'none' }}>Free</Link>
          <UserButton appearance={{ elements: { userButtonAvatarBox: { width:28, height:28 } } }} />
        </>
      )}
    </div>
  )
}
