'use client'

import { Loader2Icon, AlertTriangleIcon, RefreshCwIcon, ClockIcon } from 'lucide-react'

export interface GenerationStatusProps {
  status: string
  errorMessage?: string
  onRetry?: () => void
}

function classifyError(errorMessage: string): {
  kind: 'rate-limit' | 'provider-fallback' | 'all-providers-failed' | 'generic'
  detail?: string
  resetsAt?: string
} {
  const lower = errorMessage.toLowerCase()

  if (
    lower.includes('429') ||
    lower.includes('rate limit') ||
    lower.includes('daily limit') ||
    (lower.includes('limit') && lower.includes('month'))
  ) {
    let resetsAt = 'midnight UTC'
    const timeMatch = errorMessage.match(/resets?\s+(?:at|on|in)\s+([^.,)]+)/i)
    if (timeMatch) {
      resetsAt = timeMatch[1].trim()
    } else if (lower.includes('month')) {
      resetsAt = 'next month'
    }
    return { kind: 'rate-limit', resetsAt }
  }

  if (lower.includes('fallback') && lower.includes('also failed')) {
    const providerMatch = errorMessage.match(/primary:\s*(\w+),\s*fallback:\s*(\w+)/i)
    if (providerMatch) {
      return {
        kind: 'all-providers-failed',
        detail: `${providerMatch[1]} and ${providerMatch[2]} both failed`,
      }
    }
    return { kind: 'all-providers-failed' }
  }

  if (lower.includes('fallback') || lower.includes('trying fallback')) {
    const providerMatch = errorMessage.match(/primary[:\s]+(\w+)/i)
    return {
      kind: 'provider-fallback',
      detail: providerMatch ? `${providerMatch[1]} unavailable, trying fallback` : undefined,
    }
  }

  return { kind: 'generic' }
}

function RateLimitState({ resetsAt, onRetry }: { resetsAt: string; onRetry?: () => void }) {
  return (
    <div className="p-4 rounded-lg border border-warning/30 bg-warning-subtle">
      <div className="flex items-start gap-3">
        <ClockIcon className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-warning">Daily limit reached</p>
          <p className="text-xs text-forge-300 mt-1">
            Resets at {resetsAt}. Upgrade your plan for more compiles.
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md
                         border border-warning/30 text-warning
                         hover:bg-warning/10 transition-colors focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <RefreshCwIcon className="w-3 h-3" />
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ProviderFallbackState({ detail }: { detail?: string }) {
  return (
    <div className="flex items-center gap-3 py-8">
      <div className="relative">
        <Loader2Icon className="w-5 h-5 text-accent-hover animate-spin" />
      </div>
      <div>
        <p className="text-sm text-forge-300">
          {detail || 'Provider unavailable, retrying with fallback...'}
        </p>
        <p className="text-[10px] text-forge-400 mt-0.5 font-mono">
          Switching to backup provider
        </p>
      </div>
    </div>
  )
}

function AllProvidersFailedState({ detail, onRetry }: { detail?: string; onRetry?: () => void }) {
  return (
    <div className="p-4 rounded-lg border border-danger/30 bg-danger-subtle">
      <div className="flex items-start gap-3">
        <AlertTriangleIcon className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-danger">All providers failed</p>
          <p className="text-xs text-forge-300 mt-1">
            {detail
              ? `${detail}. Please try again in a moment.`
              : 'All available AI providers are temporarily unavailable. Please try again in a moment.'}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md
                         border border-danger/30 text-danger
                         hover:bg-danger/10 transition-colors focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <RefreshCwIcon className="w-3 h-3" />
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function GenericErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="p-4 rounded-lg border border-danger/30 bg-danger-subtle">
      <div className="flex items-start gap-3">
        <AlertTriangleIcon className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-danger">Compilation failed</p>
          <p className="text-xs text-forge-300 mt-1">
            Something went wrong during generation. Please try again.
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md
                         border border-danger/30 text-danger
                         hover:bg-danger/10 transition-colors focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <RefreshCwIcon className="w-3 h-3" />
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function PendingState() {
  return (
    <div className="flex items-center gap-3 py-8">
      <Loader2Icon className="w-5 h-5 text-accent-hover animate-spin" />
      <p className="text-sm text-forge-300">Compiling...</p>
    </div>
  )
}

export function GenerationStatus({ status, errorMessage, onRetry }: GenerationStatusProps) {
  if (status === 'pending') {
    return <PendingState />
  }

  if (status === 'failed' && errorMessage) {
    const error = classifyError(errorMessage)

    switch (error.kind) {
      case 'rate-limit':
        return <RateLimitState resetsAt={error.resetsAt || 'midnight UTC'} onRetry={onRetry} />
      case 'all-providers-failed':
        return <AllProvidersFailedState detail={error.detail} onRetry={onRetry} />
      case 'provider-fallback':
        return <ProviderFallbackState detail={error.detail} />
      default:
        return <GenericErrorState message={errorMessage} onRetry={onRetry} />
    }
  }

  if (status === 'failed') {
    return <GenericErrorState message="Generation failed" onRetry={onRetry} />
  }

  return null
}
