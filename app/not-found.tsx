import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-48px)] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="font-mono text-[11px] text-forge-400 uppercase tracking-[0.1em] mb-3">
          404
        </p>
        <h1 className="text-2xl font-bold text-forge-50 m-0 mb-2">
          Page not found
        </h1>
        <p className="text-sm text-forge-400 m-0 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="h-10 px-5 bg-accent text-white border-none rounded-xl text-sm font-semibold no-underline hover:bg-accent-hover transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-forge-950 inline-flex items-center"
          >
            Go home
          </Link>
          <Link
            href="/compiler"
            className="h-10 px-5 bg-transparent text-forge-300 border border-white/[0.06] rounded-xl text-sm font-medium no-underline hover:bg-forge-700 transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 inline-flex items-center"
          >
            Open compiler
          </Link>
        </div>
      </div>
    </div>
  )
}
