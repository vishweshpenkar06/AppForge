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

          {/* ── Skip to content ──────────────────────────────────── */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded-lg focus:text-sm"
          >
            Skip to content
          </a>

          {/* ── Nav ─────────────────────────────────────────────── */}
          <nav className="fixed top-0 w-full h-12 z-50 flex items-center justify-between px-4 md:px-6 bg-forge-950/85 backdrop-blur-xl border-b border-white/[0.06]">
            <Link href="/" className="flex items-center gap-2 no-underline">
              <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center">
                <span className="text-white font-mono text-[11px] font-bold">AF</span>
              </div>
              <span className="text-forge-50 font-semibold text-sm hidden sm:inline">AppForge</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link href="/compiler" className="text-forge-300 text-sm no-underline hover:text-forge-50 transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:rounded-md">Compiler</Link>
              <Link href="/demo" className="text-forge-300 text-sm no-underline hover:text-forge-50 transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:rounded-md">Examples</Link>
              <Link href="/dashboard" className="text-forge-300 text-sm no-underline hover:text-forge-50 transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:rounded-md">Dashboard</Link>
              <Link href="/pricing" className="text-forge-300 text-sm no-underline hover:text-forge-50 transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:rounded-md">Pricing</Link>
            </div>

            <AuthControls />
          </nav>

          {/* ── Main ────────────────────────────────────────────── */}
          <main id="main-content" className="pt-12">
            {children}
          </main>

        </body>
      </html>
    </ClerkProvider>
  )
}
