import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ClerkProvider } from '@clerk/nextjs'
import { shadcn } from '@clerk/ui/themes'
import { Toaster } from '@/components/ui/sonner'
import Navbar from './components/navbar'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://appforge.dev'

export const metadata: Metadata = {
  title: 'AppForge — Natural Language Application Compiler',
  description:
    'Turn product ideas into validated database schemas, API layers, and component trees. 6-stage compiler with cross-layer validation.',
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: 'AppForge — Natural Language Application Compiler',
    description:
      'Turn product ideas into validated database schemas, API layers, and component trees.',
    url: SITE_URL,
    siteName: 'AppForge',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AppForge — Natural Language Application Compiler',
    description:
      'Turn product ideas into validated database schemas, API layers, and component trees.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider appearance={{ theme: shadcn }}>
      <html
        lang="en"
        suppressHydrationWarning
        data-scroll-behavior="smooth"
        className={`${geist.variable} ${geistMono.variable}`}
      >
        <body className="antialiased">

          {/* Skip to content */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded-lg focus:text-sm"
          >
            Skip to content
          </a>

          <Navbar />

          <main id="main-content" className="pt-12 md:pt-14">
            {children}
          </main>

          <Analytics />
          <Toaster theme="dark" position="bottom-right" richColors closeButton />
        </body>
      </html>
    </ClerkProvider>
  )
}
