import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  // Allow unauthenticated access to the compile API in development
  // so local tooling and tests can hit the endpoint without a browser
  // signing in. This is safe because it only runs when NODE_ENV !== 'production'.
  try {
    const pathname = (request as any).nextUrl?.pathname || new URL(request.url).pathname
    if (pathname.startsWith('/api/compile') && process.env.NODE_ENV !== 'production') {
      return
    }
  } catch (e) {
    // ignore and fall through to normal protection
  }

  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
}
