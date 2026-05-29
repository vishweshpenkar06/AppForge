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
  title: 'AppForge - AI Application Compiler',
  description: 'Describe it. Compile it. Ship it. — Transform natural language into production-ready application configs.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider appearance={{ theme: shadcn }}>
      <html lang="en" suppressHydrationWarning>
        <body className={`${geist.className} ${geistMono.className} font-sans antialiased bg-[#09090b] text-white`}>
          <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.2),transparent_30%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_24%),linear-gradient(180deg,#09090b_0%,#0b0d12_50%,#09090b_100%)]" />
          <div className="fixed inset-0 -z-10 opacity-40 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:56px_56px]" />
          <header className="sticky top-0 z-40 border-b border-white/8 bg-[#09090b]/80 backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
              <Link href="/" className="group flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 text-sky-200 shadow-[0_0_30px_rgba(14,165,233,0.15)] transition group-hover:scale-105">
                  AF
                </div>
                <div>
                  <div className="text-sm font-semibold tracking-[0.24em] text-zinc-500 uppercase">
                    AppForge
                  </div>
                  <div className="text-xs text-zinc-400">AI application compiler</div>
                </div>
              </Link>

              <nav className="flex items-center gap-2 sm:gap-3">
                <Link href="/" className="hidden rounded-full px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white md:inline-flex">
                  Home
                </Link>
                <Link href="/compiler" className="hidden rounded-full px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white md:inline-flex">
                  Compiler
                </Link>
                <AuthControls />
              </nav>
            </div>
          </header>

          <main className="relative mx-auto min-h-[70vh] w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="rounded-[2rem] border border-white/8 bg-white/[0.02] shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur-sm">
              {children}
            </div>
          </main>

          <footer className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-8 text-xs text-zinc-500 sm:px-6 lg:px-8">
            <p>Built for turning product ideas into structured application blueprints.</p>
            <p>AppForge</p>
          </footer>
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </body>
      </html>
    </ClerkProvider>
  )
}
