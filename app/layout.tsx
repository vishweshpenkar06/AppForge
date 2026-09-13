import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ClerkProvider } from '@clerk/nextjs'
import { shadcn } from '@clerk/ui/themes'
import Navbar from './components/navbar'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })
const geistMono = Geist_Mono({ subsets: ['latin'] })

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://appforge.dev'

export const metadata: Metadata = {
  title: 'AppForge — Natural Language Application Compiler',
  description:
    'Turn product ideas into validated database schemas, API layers, and component trees. 6-stage compiler with cross-layer validation.',
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: 'AppForge — Natural Language Application Compiler',
    description:
      'Turn product ideas into validated database schemas, API layers, and component trees.',
    url: SITE_URL,
    siteName: 'AppForge',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AppForge — Natural Language Application Compiler',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AppForge — Natural Language Application Compiler',
    description:
      'Turn product ideas into validated database schemas, API layers, and component trees.',
    images: ['/og-image.png'],
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
        <body className={`${geist.className} ${geistMono.className}`}>

          {/* Skip to content */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded-lg focus:text-sm"
          >
            Skip to content
          </a>

          <Navbar />

          <main id="main-content" className="pt-14 md:pt-14">
            {children}
          </main>

          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
