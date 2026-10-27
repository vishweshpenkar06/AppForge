'use client'

import { useState } from 'react'
import { Rocket, CheckCircle2, ExternalLink, Loader2, AlertCircle, GitBranch } from 'lucide-react'

type DeployState =
  | { status: 'idle' }
  | { status: 'creating_repo' }
  | { status: 'pushing_files'; current: number; total: number }
  | { status: 'ready'; repoUrl: string; repoName: string; deployUrl: string }
  | { status: 'error'; message: string }

export function DeployButton({ generationId }: { generationId: string }) {
  const [state, setState] = useState<DeployState>({ status: 'idle' })

  async function handleDeploy() {
    setState({ status: 'creating_repo' })

    try {
      const res = await fetch(`/api/generations/${generationId}/deploy`, {
        method: 'POST',
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Deploy failed' }))
        setState({ status: 'error', message: body.error || `HTTP ${res.status}` })
        return
      }

      const data = await res.json()
      setState({
        status: 'ready',
        repoUrl: data.repoUrl,
        repoName: data.repoName,
        deployUrl: data.deployUrl,
      })
    } catch (err) {
      setState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Network error',
      })
    }
  }

  const isIdle = state.status === 'idle'
  const isError = state.status === 'error'
  const isReady = state.status === 'ready'
  const isWorking = state.status === 'creating_repo' || state.status === 'pushing_files'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleDeploy}
          disabled={!isIdle && !isError}
          className="inline-flex items-center gap-2 rounded-2xl border border-success/30 bg-success-subtle px-4 py-2.5 text-sm font-semibold text-success transition hover:border-success/40 hover:bg-success/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isWorking ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Rocket className="h-4 w-4" />
          )}
          {isReady ? 'Redeploy' : 'Push to GitHub + Deploy'}
        </button>

        {isError && (
          <button
            onClick={handleDeploy}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-forge-200 transition hover:bg-white/[0.06]"
          >
            Retry
          </button>
        )}
      </div>

      {/* Progress */}
      {state.status === 'creating_repo' && (
        <div className="flex items-center gap-3 text-sm text-forge-300">
          <Loader2 className="h-4 w-4 animate-spin text-accent-hover" />
          Creating GitHub repository…
        </div>
      )}

      {state.status === 'pushing_files' && (
        <div className="flex items-center gap-3 text-sm text-forge-300">
          <Loader2 className="h-4 w-4 animate-spin text-accent-hover" />
          Pushing files… {state.current}/{state.total}
        </div>
      )}

      {/* Success */}
      {isReady && (
        <div className="space-y-3 rounded-xl border border-success/20 bg-success-subtle p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-success">
            <CheckCircle2 className="h-4 w-4" />
            Repository ready!
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={state.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2 text-sm font-medium text-forge-200 transition hover:bg-white/[0.06]"
            >
              <GitBranch className="h-4 w-4" />
              {state.repoName}
              <ExternalLink className="h-3.5 w-3.5 text-forge-400" />
            </a>
            <a
              href={state.deployUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-accent/30 bg-accent-subtle px-4 py-2 text-sm font-medium text-accent-hover transition hover:border-accent/40 hover:bg-accent/20"
            >
              <Rocket className="h-4 w-4" />
              Deploy with Vercel
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="flex items-center gap-3 rounded-xl border border-danger/20 bg-danger-subtle p-4 text-sm text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.message}
        </div>
      )}
    </div>
  )
}
