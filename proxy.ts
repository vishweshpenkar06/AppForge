import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  // Metadata routes have no file extension, so the matcher's static-file
  // exclusion does not skip them and auth would return HTML to crawlers.
  '/opengraph-image(.*)',
  '/robots.txt',
  '/sitemap.xml',
  // Clerk signs these requests; the route verifies svix headers itself.
  '/api/webhooks/clerk',
])

export default clerkMiddleware(async (auth, request) => {
  // Allow unauthenticated access to API routes only when ENABLE_DEV_AUTH is explicitly set
  if (process.env.ENABLE_DEV_AUTH === 'true' && request.nextUrl.pathname.startsWith('/api/')) {
    return
  }

  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|avif|webp|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|xml|txt)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
}
