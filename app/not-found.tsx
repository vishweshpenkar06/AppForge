import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="font-mono text-[11px] text-forge-500 uppercase tracking-[0.15em] mb-3 m-0">
          404
        </p>
        <h1 className="text-2xl font-bold text-forge-50 m-0 mb-2 tracking-tight">
          Page not found
        </h1>
        <p className="text-sm text-forge-400 m-0 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="h-10 px-5 bg-accent text-white border-none rounded-lg text-sm font-semibold no-underline hover:bg-accent-hover transition-all hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98] inline-flex items-center"
          >
            Go home
          </Link>
          <Link
            href="/compiler"
            className="h-10 px-5 bg-transparent text-forge-300 border border-white/[0.06] rounded-lg text-sm font-medium no-underline hover:bg-forge-800 hover:border-white/[0.1] transition-all inline-flex items-center"
          >
            Open compiler
          </Link>
        </div>
      </div>
    </div>
  )
}
