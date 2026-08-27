import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Next.js middleware — runs on the Edge runtime before route handlers.
 *
 * Currently this middleware applies security headers only.
 * Rate limiting is enforced inside individual generation route handlers
 * (see app/api/generate/route.ts, app/api/compile/route.ts) where the
 * Clerk userId is available via `auth()`.
 *
 * If you later want to gate requests at the edge (before they reach
 * Node.js handlers), move the rate-limit check here and use the
 * `x-forwarded-for` header for anonymous keys.
 */

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return response
}

export const config = {
  matcher: ['/api/:path*'],
}
