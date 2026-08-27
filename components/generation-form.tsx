'use client'

import { useState } from 'react'
import { ExamplePrompts } from './ExamplePrompts'

interface GenerationFormProps {
  onGenerationCreated?: (jobId: string) => void
}

export function GenerationForm({ onGenerationCreated }: GenerationFormProps) {
  const [prompt, setPrompt] = useState('')
  const [mode, setMode] = useState<'fast' | 'balanced' | 'precise'>('balanced')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!prompt.trim()) {
      setError('Please describe your application')
      return
    }

    setLoading(true)

    let artifactWindow: Window | null = null
    try {
      artifactWindow = window.open('', '_blank')
    } catch { artifactWindow = null }

    try {
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, mode }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Generation failed')
      }

      const data = await response.json()

      if (data.downloadUrl && artifactWindow) {
        try { artifactWindow.location.href = data.downloadUrl } catch {}
      } else if (artifactWindow) {
        try { artifactWindow.close() } catch {}
      }

      const jobId = data.jobId || data.id || null
      if (jobId) {
        onGenerationCreated?.(jobId)
      } else {
        setError('Generation completed but no job id returned')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      if (artifactWindow) { try { artifactWindow.close() } catch {} }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider mb-2">
          Quick Start
        </label>
        <ExamplePrompts onSelect={setPrompt} disabled={loading} />
      </div>

      <div>
        <label htmlFor="prompt" className="block text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider mb-2">
          App Description
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Build a project management app with auth, teams, tasks, and real-time notifications..."
          className="w-full h-32 px-4 py-3 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-lg
                     text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)]
                     font-mono resize-none focus:outline-none focus:border-[var(--accent-primary)]
                     transition-colors leading-relaxed"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="mode" className="block text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider mb-2">
          Mode
        </label>
        <select
          id="mode"
          value={mode}
          onChange={(e) => setMode(e.target.value as typeof mode)}
          disabled={loading}
          className="w-full h-10 px-3 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-lg
                     text-sm text-[var(--text-primary)] font-mono
                     focus:outline-none focus:border-[var(--accent-primary)] transition-colors
                     appearance-none cursor-pointer"
        >
          <option value="fast">Fast — lower quality, faster</option>
          <option value="balanced">Balanced — recommended</option>
          <option value="precise">Precise — higher quality, slower</option>
        </select>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 text-sm text-[var(--error)]">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !prompt.trim()}
        className="w-full btn-primary py-3 text-sm font-semibold disabled:opacity-40"
      >
        {loading ? (
          <span className="flex items-center gap-2 justify-center">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Compiling...
          </span>
        ) : 'Generate Application Config'}
      </button>
    </form>
  )
}
