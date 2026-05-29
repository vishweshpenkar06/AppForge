'use client'

import { useState } from 'react'
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
      <div>
        <label htmlFor="prompt" className="block text-sm font-semibold mb-3">
          Describe Your Application
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="E.g., Build a project management app with user authentication, team collaboration features, task tracking, and real-time notifications..."
          className="w-full h-32 px-4 py-3 bg-[#0f0f13] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="mode" className="block text-sm font-semibold mb-3">
          Compilation Mode
        </label>
        <select
          id="mode"
          value={mode}
          onChange={(e) => setMode(e.target.value as any)}
          disabled={loading}
          className="w-full px-4 py-3 bg-[#0f0f13] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          <option value="fast">Fast (Lower quality, faster)</option>
          <option value="balanced">Balanced (Recommended)</option>
          <option value="precise">Precise (Higher quality, slower)</option>
        </select>
      </div>

      {error && (
        <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading || !prompt.trim()}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed h-10 font-semibold"
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
