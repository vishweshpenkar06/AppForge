'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import AuthControls from './auth-controls'

const NAV_LINKS = [
  { href: '/compiler', label: 'Compiler' },
  { href: '/templates', label: 'Templates' },
  { href: '/demo', label: 'Examples' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/pricing', label: 'Pricing' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const { isSignedIn } = useUser()

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/[0.06]">
      {/* ── Desktop nav ──────────────────────────────────────────── */}
      <div className="hidden md:flex items-center justify-between h-14 px-6 bg-forge-950/80 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2.5 no-underline group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-pressed flex items-center justify-center shadow-lg shadow-accent/20 group-hover:shadow-accent/30 transition-shadow">
            <span className="text-white font-mono text-xs font-bold">AF</span>
          </div>
          <span className="text-forge-50 font-semibold text-sm tracking-tight">AppForge</span>
        </Link>

        <div className="flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={isSignedIn ? link.href : '/sign-in'}
                className={`text-sm no-underline px-3 py-1.5 rounded-lg transition-all ${
                  active
                    ? 'text-forge-50 bg-white/[0.06] font-medium'
                    : 'text-forge-400 hover:text-forge-200 hover:bg-white/[0.03]'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </div>

        <AuthControls />
      </div>

      {/* ── Mobile nav ───────────────────────────────────────────── */}
      <div className="md:hidden flex items-center justify-between h-12 px-4 bg-forge-950/90 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-accent to-accent-pressed flex items-center justify-center">
            <span className="text-white font-mono text-[10px] font-bold">AF</span>
          </div>
          <span className="text-forge-50 font-semibold text-sm">AppForge</span>
        </Link>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 rounded-lg text-forge-400 hover:text-forge-200 hover:bg-white/[0.06] transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
          )}
        </button>
      </div>

      {/* ── Mobile dropdown ──────────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden border-b border-white/[0.06] bg-forge-950/95 backdrop-blur-xl px-4 py-3 space-y-1">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={isSignedIn ? link.href : '/sign-in'}
                onClick={() => setMobileOpen(false)}
                className={`block text-sm no-underline px-3 py-2.5 rounded-lg transition-all ${
                  active
                    ? 'text-forge-50 bg-white/[0.06] font-medium'
                    : 'text-forge-400 hover:text-forge-200 hover:bg-white/[0.03]'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
          <div className="pt-2 border-t border-white/[0.06]">
            <AuthControls />
          </div>
        </div>
      )}
    </nav>
  )
}
