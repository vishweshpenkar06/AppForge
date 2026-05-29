'use client'

import { useState } from 'react'
import { WandSparkles, TimerReset, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

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
      setPrompt('')
      onGenerationCreated?.(data.jobId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <WandSparkles className="h-4 w-4 text-sky-300" />
          <label htmlFor="prompt" className="block text-sm font-semibold">
            Describe Your Application
          </label>
        </div>
        <p className="text-sm text-zinc-500">
          Give AppForge the idea, product goals, or constraints. It will turn that into a structured build plan.
        </p>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="E.g., Build a project management app with user authentication, team collaboration features, task tracking, and real-time notifications..."
          className="w-full h-36 px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20 resize-none transition"
          disabled={loading}
        />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <TimerReset className="h-4 w-4 text-sky-300" />
          <label htmlFor="mode" className="block text-sm font-semibold">
            Compilation Mode
          </label>
        </div>
        <select
          id="mode"
          value={mode}
          onChange={(e) => setMode(e.target.value as any)}
          disabled={loading}
          className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-white focus:outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20 transition"
        >
          <option value="fast">Fast (Lower quality, faster)</option>
          <option value="balanced">Balanced (Recommended)</option>
          <option value="precise">Precise (Higher quality, slower)</option>
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 text-sm text-zinc-400">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-300" />
          Validated output
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-300" />
          Auth-aware workflow
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-300" />
          Export-ready config
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-900/20 border border-red-700 rounded-2xl text-red-200 text-sm">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading || !prompt.trim()}
        className="w-full bg-sky-500 hover:bg-sky-400 text-black disabled:bg-white/10 disabled:text-white/40 disabled:cursor-not-allowed h-11 font-semibold rounded-2xl"
      >
        {loading ? (
          <>
            <Spinner className="w-4 h-4 mr-2" />
            Compiling...
          </>
        ) : (
          'Generate Application Config'
        )}
      </Button>
    </form>
  )
}
