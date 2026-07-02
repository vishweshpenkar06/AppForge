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
        <body className={`${geist.className} ${geistMono.className}`} style={{ margin:0 }}>

          {/* ── Nav ─────────────────────────────────────────────── */}
          <nav style={{
            position:'fixed', top:0, width:'100%', height:48, zIndex:50,
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'0 24px',
            background:'rgba(9,9,11,0.85)', backdropFilter:'blur(12px)',
            borderBottom:'1px solid var(--border)',
          }}>
            <Link href="/" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none' }}>
              <div style={{ width:28, height:28, borderRadius:6, background:'var(--fill-accent)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ color:'#fff', fontFamily:'var(--font-mono)', fontSize:11, fontWeight:700 }}>AF</span>
              </div>
              <span style={{ color:'var(--text-primary)', fontWeight:600, fontSize:14 }}>AppForge</span>
            </Link>

            <div style={{ display:'flex', gap:24, alignItems:'center' }}>
              <Link href="/compiler" style={{ color:'var(--text-secondary)', fontSize:13, textDecoration:'none' }}>Compiler</Link>
              <Link href="/demo" style={{ color:'var(--text-secondary)', fontSize:13, textDecoration:'none' }}>Examples</Link>
              <Link href="/dashboard" style={{ color:'var(--text-secondary)', fontSize:13, textDecoration:'none' }}>Dashboard</Link>
              <Link href="/pricing" style={{ color:'var(--text-secondary)', fontSize:13, textDecoration:'none' }}>Pricing</Link>
            </div>

            <AuthControls />
          </nav>

          {/* ── Main ────────────────────────────────────────────── */}
          <main style={{ paddingTop:48 }}>
            {children}
          </main>

        </body>
      </html>
    </ClerkProvider>
  )
}
