'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GenerationDetail } from '@/components/generation-detail'
import { GitBranch, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type Phase = 'idle' | 'loading' | 'done' | 'error'

export default function ReverseCompilePage() {
  const [repoUrl, setRepoUrl] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [jobId, setJobId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!repoUrl.trim()) return

    setPhase('loading')
    setErrorMsg(null)
    setJobId(null)

    try {
      const res = await fetch('/api/reverse-compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: repoUrl.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || 'Reverse compilation failed.')
        setPhase('error')
        return
      }

      setJobId(data.jobId)
      setPhase('done')
    } catch {
      setErrorMsg('Network error — could not reach the server.')
      setPhase('error')
    }
  }

  return (
    <div className="relative min-h-screen px-4 py-10 md:px-8 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-64 aurora opacity-40 pointer-events-none" aria-hidden />
      <div className="relative mx-auto max-w-3xl">
        {/* ── Header ──────────────────────────────────────────── */}
        <div className="mb-8">
          <Link
            href="/compiler"
            className="inline-flex items-center gap-1.5 text-[11.5px] text-forge-500 hover:text-forge-200 transition-colors mb-5 no-underline font-mono"
          >
            <ArrowLeft className="size-3" />
            Back to compiler
          </Link>
          <p className="font-mono text-[10px] text-accent/80 uppercase tracking-[0.2em] m-0 mb-2">Reverse mode</p>
          <h1 className="text-2xl md:text-3xl font-bold text-forge-50 flex items-center gap-2.5 m-0 tracking-tight">
            <GitBranch className="size-6 text-accent" />
            Reverse Compile
          </h1>
          <p className="mt-2 text-sm text-forge-400 leading-relaxed max-w-xl">
            Point at a public GitHub repo and get an architectural summary — entities,
            endpoints, pages, and auth — rendered in the same generation detail view.
          </p>
        </div>

        {/* ── Input Card ──────────────────────────────────────── */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Repository</CardTitle>
            <CardDescription>
              Enter a public GitHub repository URL. The file tree and key source files
              will be analyzed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="https://github.com/owner/repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmit()
                }}
                disabled={phase === 'loading'}
                aria-label="GitHub repository URL"
                className="flex-1 font-mono text-sm h-10"
              />
              <Button
                onClick={handleSubmit}
                disabled={!repoUrl.trim() || phase === 'loading'}
                className="h-10"
              >
                {phase === 'loading' ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  'Reverse compile'
                )}
              </Button>
            </div>
            <p className="mt-3 text-[11px] text-forge-500 leading-relaxed">
              Public repos only for MVP. Unauthenticated GitHub API requests are
              rate-limited to 60/hr — set <code className="text-forge-400">GITHUB_TOKEN</code> for higher limits.
            </p>
          </CardContent>
        </Card>

        {/* ── Error ───────────────────────────────────────────── */}
        {phase === 'error' && (
          <Card className="mb-8 border-danger/25 bg-danger-subtle" role="alert">
            <CardContent>
              <p className="text-sm text-danger m-0">{errorMsg}</p>
            </CardContent>
          </Card>
        )}

        {/* ── Result ──────────────────────────────────────────── */}
        {phase === 'done' && jobId && (
          <Card>
            <CardContent className="pt-6">
              <GenerationDetail generationId={jobId} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
