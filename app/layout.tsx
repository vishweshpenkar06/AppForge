import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ClerkProvider } from '@clerk/nextjs'
import Link from 'next/link'
import AuthControls from './components/auth-controls'
import { shadcn } from '@clerk/ui/themes'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })
const geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AppForge — Natural Language Application Compiler',
  description: 'Turn product ideas into validated database schemas, API layers, and component trees. 6-stage compiler with cross-layer validation.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider appearance={{ theme: shadcn }}>
      <html lang="en" suppressHydrationWarning>
        <body className={`${geist.className} ${geistMono.className}`}>

          {/* ── Frosted Glass Nav ─────────────────────────────── */}
          <nav className="nav-frosted">
            <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-[var(--accent-primary)] flex items-center justify-center">
                  <span className="text-white font-mono text-xs font-bold">AF</span>
                </div>
                <span className="font-semibold text-[var(--text-primary)] tracking-tight text-sm">AppForge</span>
              </Link>

              {/* Center links */}
              <div className="hidden md:flex items-center gap-6">
                <Link href="/compiler" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Compiler</Link>
                <Link href="/demo" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Examples</Link>
                <Link href="/dashboard" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Dashboard</Link>
              </div>

              {/* CTAs */}
              <div className="flex items-center gap-3">
                <AuthControls />
              </div>
            </div>
          </nav>

          {/* ── Main Content ──────────────────────────────────── */}
          <main className="pt-14">
            {children}
          </main>

          {/* ── Footer ────────────────────────────────────────── */}
          <footer className="border-t border-[var(--bg-border)] py-10 px-6">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-[var(--accent-primary)] flex items-center justify-center">
                  <span className="text-white font-mono text-[9px] font-bold">AF</span>
                </div>
                <span className="text-xs text-[var(--text-muted)]">AppForge</span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">Natural language to application compiler</p>
              <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                <Link href="/compiler" className="hover:text-[var(--text-secondary)] transition-colors">Compiler</Link>
                <Link href="/demo" className="hover:text-[var(--text-secondary)] transition-colors">Examples</Link>
                <Link href="/dashboard" className="hover:text-[var(--text-secondary)] transition-colors">Dashboard</Link>
              </div>
            </div>
          </footer>

          {process.env.NODE_ENV === 'production' && <Analytics />}
        </body>
      </html>
    </ClerkProvider>
  )
}
