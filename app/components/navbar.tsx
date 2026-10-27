'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import {
  Command as CommandIcon,
  Compass,
  CreditCard,
  LayoutDashboard,
  Library,
  Plus,
  Settings2,
  Sparkles,
  Webhook,
} from 'lucide-react'
import AuthControls from './auth-controls'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'

const NAV_LINKS = [
  { href: '/compiler', label: 'Compiler' },
  { href: '/templates', label: 'Templates' },
  { href: '/demo', label: 'Examples' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/pricing', label: 'Pricing' },
]

const COMMANDS = [
  { href: '/compiler', label: 'New compilation', icon: Plus, group: 'Create', shortcut: 'C' },
  { href: '/templates', label: 'Browse templates', icon: Library, group: 'Create', shortcut: 'T' },
  { href: '/demo', label: 'See examples', icon: Compass, group: 'Create', shortcut: 'E' },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Account', shortcut: 'D' },
  { href: '/pricing', label: 'Plans & pricing', icon: CreditCard, group: 'Account', shortcut: 'P' },
  { href: '/settings/api-keys', label: 'API keys', icon: Settings2, group: 'Account', shortcut: '' },
  { href: '/settings/webhooks', label: 'Webhooks', icon: Webhook, group: 'Account', shortcut: '' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { isSignedIn } = useUser()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const go = (href: string) => {
    setPaletteOpen(false)
    router.push(isSignedIn ? href : '/sign-in')
  }

  return (
    <>
      <nav
        className={`fixed top-0 w-full z-50 border-b transition-all duration-300 ${
          scrolled
            ? 'border-white/[0.08] bg-forge-950/85 backdrop-blur-xl shadow-[0_8px_30px_-12px_rgba(0,0,0,0.8)]'
            : 'border-white/[0.05] bg-forge-950/60 backdrop-blur-md'
        }`}
        aria-label="Main"
      >
        {/* Desktop */}
        <div className="hidden md:flex items-center justify-between h-14 px-6 max-w-[1400px] mx-auto">
          <Link href="/" className="flex items-center gap-2.5 no-underline group shrink-0">
            <span className="relative w-8 h-8 rounded-[10px] bg-gradient-to-br from-accent to-secondary flex items-center justify-center shadow-lg shadow-accent/25 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3">
              <span className="text-forge-950 font-mono text-[11px] font-bold">AF</span>
            </span>
            <span className="text-forge-50 font-semibold text-[13.5px] tracking-tight">AppForge</span>
            <span className="ml-0.5 text-[9px] font-mono px-1.5 py-0.5 rounded border border-white/[0.08] text-forge-500">
              v3
            </span>
          </Link>

          <div className="flex items-center gap-0.5">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`)
              return (
                <Link
                  key={link.href}
                  href={isSignedIn ? link.href : '/sign-in'}
                  className={`relative text-[13px] no-underline px-3 py-1.5 rounded-lg transition-all duration-200 focus-visible:ring-2 focus-visible:ring-accent/40 ${
                    active
                      ? 'text-forge-50 bg-white/[0.06] font-medium'
                      : 'text-forge-400 hover:text-forge-100 hover:bg-white/[0.035]'
                  }`}
                >
                  {link.label}
                  {active && (
                    <span className="absolute left-3 right-3 -bottom-[7px] h-[2px] rounded-full bg-accent/80" aria-hidden />
                  )}
                </Link>
              )
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="group flex items-center gap-2 h-8 pl-2.5 pr-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] text-forge-500 hover:text-forge-200 hover:border-white/[0.16] hover:bg-white/[0.05] transition-all cursor-pointer"
              aria-label="Open command palette"
            >
              <CommandIcon className="w-3.5 h-3.5" />
              <span className="text-[11.5px]">Search</span>
              <kbd className="ml-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-forge-800 border border-white/[0.06] text-forge-400">
                ⌘K
              </kbd>
            </button>
            <AuthControls />
          </div>
        </div>

        {/* Mobile */}
        <div className="md:hidden flex items-center justify-between h-12 px-4">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-secondary flex items-center justify-center">
              <span className="text-forge-950 font-mono text-[10px] font-bold">AF</span>
            </span>
            <span className="text-forge-50 font-semibold text-[13px]">AppForge</span>
          </Link>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="p-2 rounded-lg text-forge-400 hover:text-forge-200 hover:bg-white/[0.06] transition-colors cursor-pointer"
              aria-label="Open command palette"
            >
              <CommandIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-forge-400 hover:text-forge-200 hover:bg-white/[0.06] transition-colors cursor-pointer"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile sheet */}
        <div
          className={`md:hidden overflow-hidden border-t border-white/[0.06] bg-forge-950/95 backdrop-blur-xl transition-[max-height,opacity] duration-300 ease-out ${
            mobileOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 py-3 space-y-1">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={isSignedIn ? link.href : '/sign-in'}
                  onClick={() => setMobileOpen(false)}
                  className={`block text-[13.5px] no-underline px-3 py-2.5 rounded-lg transition-colors ${
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
        </div>
      </nav>

      <CommandDialog
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        title="Command palette"
        description="Jump to a page or start a new compilation."
        className="border-white/[0.08] bg-forge-900/95 backdrop-blur-xl"
      >
        <CommandInput placeholder="Search pages and actions..." />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          {['Create', 'Account'].map((group) => (
            <CommandGroup key={group} heading={group}>
              {COMMANDS.filter((c) => c.group === group).map((c) => {
                const Icon = c.icon
                return (
                  <CommandItem key={c.href} value={`${c.label} ${c.href}`} onSelect={() => go(c.href)}>
                    <Icon className="w-4 h-4" />
                    <span>{c.label}</span>
                    {c.shortcut && <CommandShortcut>{c.shortcut}</CommandShortcut>}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          ))}
          <CommandSeparator />
          <CommandGroup heading="Powered by">
            <CommandItem disabled value="appforge compiler">
              <Sparkles className="w-4 h-4 text-accent" />
              <span>AppForge 6-stage compiler</span>
              <CommandShortcut>v3</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
