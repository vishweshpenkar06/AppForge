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
    <div className="min-h-[calc(100vh-48px)] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-12 h-12 rounded-xl bg-danger-subtle flex items-center justify-center mx-auto mb-4">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-danger)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p className="font-mono text-[11px] text-forge-400 uppercase tracking-[0.1em] mb-3">
          Something went wrong
        </p>
        <h1 className="text-xl font-bold text-forge-50 m-0 mb-2">
          Unexpected error
        </h1>
        <p className="text-sm text-forge-400 m-0 mb-6">
          An error occurred while rendering this page. You can try again or go
          back.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="h-10 px-5 bg-accent text-white border-none rounded-xl text-sm font-semibold cursor-pointer hover:bg-accent-hover transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-forge-950"
          >
            Try again
          </button>
          <a
            href="/"
            className="h-10 px-5 bg-transparent text-forge-300 border border-white/[0.06] rounded-xl text-sm font-medium no-underline hover:bg-forge-700 transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 inline-flex items-center"
          >
            Go home
          </a>
        </div>
        {error.digest && (
          <p className="font-mono text-[10px] text-forge-500 mt-6">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
