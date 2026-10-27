import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="relative min-h-[calc(100vh-56px)] flex items-center justify-center px-4 overflow-hidden">
      <div className="absolute inset-0 bg-grid-fade opacity-50" aria-hidden />
      <div className="absolute inset-0 aurora opacity-60" aria-hidden />
      <div className="relative text-center max-w-md">
        <p className="text-[5.5rem] md:text-[7rem] leading-none font-bold text-gradient-emerald m-0 tracking-tighter">
          404
        </p>
        <h1 className="text-xl md:text-2xl font-bold text-forge-50 m-0 mt-2 tracking-tight">
          This route doesn&apos;t compile
        </h1>
        <p className="text-sm text-forge-400 m-0 mt-2 mb-8">
          The page you&apos;re looking for was moved, renamed, or never existed.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="h-10 px-5 bg-accent text-forge-950 border-none rounded-xl text-sm font-semibold no-underline hover:bg-accent-hover transition-all hover:shadow-[0_10px_30px_-10px_rgba(16,185,129,0.6)] active:scale-[0.98] inline-flex items-center"
          >
            Go home
          </Link>
          <Link
            href="/compiler"
            className="h-10 px-5 bg-transparent text-forge-300 border border-white/[0.08] rounded-xl text-sm font-medium no-underline hover:bg-white/[0.04] hover:text-white transition-all inline-flex items-center"
          >
            Open compiler
          </Link>
        </div>
      </div>
    </div>
  )
}
