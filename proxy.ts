import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  // Allow unauthenticated access to API routes only when ENABLE_DEV_AUTH is explicitly set
  if (process.env.ENABLE_DEV_AUTH === 'true') {
    try {
      const pathname = (request as any).nextUrl?.pathname || new URL(request.url).pathname
      if (pathname.startsWith('/api/')) {
        return
      }
    } catch (e) {
      // ignore and fall through to normal protection
    }
  }

  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
}
