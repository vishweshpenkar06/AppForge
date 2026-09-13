'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[AppForge] Unhandled error:', error)
  }, [error])

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-12 h-12 rounded-xl bg-danger-subtle border border-danger/20 flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p className="font-mono text-[11px] text-forge-500 uppercase tracking-[0.15em] mb-3 m-0">
          Something went wrong
        </p>
        <h1 className="text-xl font-bold text-forge-50 m-0 mb-2 tracking-tight">
          Unexpected error
        </h1>
        <p className="text-sm text-forge-400 m-0 mb-6">
          An error occurred while rendering this page. You can try again or go back.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="h-10 px-5 bg-accent text-white border-none rounded-lg text-sm font-semibold cursor-pointer hover:bg-accent-hover transition-all hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98]"
          >
            Try again
          </button>
          <a
            href="/"
            className="h-10 px-5 bg-transparent text-forge-300 border border-white/[0.06] rounded-lg text-sm font-medium no-underline hover:bg-forge-800 hover:border-white/[0.1] transition-all inline-flex items-center"
          >
            Go home
          </a>
        </div>
        {error.digest && (
          <p className="font-mono text-[10px] text-forge-600 mt-6 m-0">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
