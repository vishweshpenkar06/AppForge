'use client'

import { useState } from 'react'
import { Share2, Check, X } from 'lucide-react'

interface PublishTemplateButtonProps {
  generationId: string
}

export function PublishTemplateButton({ generationId }: PublishTemplateButtonProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePublish = async () => {
    if (!title.trim()) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generationId, title: title.trim(), description: description.trim() || undefined }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Failed to publish' }))
        setError(data.error || 'Failed to publish')
        return
      }

      setDone(true)
      setTimeout(() => { setOpen(false); setDone(false); setTitle(''); setDescription('') }, 1500)
    } catch {
      setError('Network error — try again')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-2 rounded-2xl border border-success/30 bg-success-subtle px-4 py-2.5 text-sm font-semibold text-success">
        <Check className="h-4 w-4" />
        Published!
      </span>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-forge-50 transition hover:bg-white/[0.06] cursor-pointer"
      >
        <Share2 className="h-4 w-4" />
        Publish as Template
      </button>
    )
  }

  return (
    <div className="inline-flex flex-col gap-2 rounded-2xl border border-white/[0.12] bg-forge-800 p-4 shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-forge-50 m-0">Publish as Template</p>
        <button onClick={() => { setOpen(false); setError(null) }} className="text-forge-400 hover:text-forge-200 cursor-pointer bg-transparent border-none p-0">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. SaaS Starter, Marketplace Blueprint"
        className="w-full bg-forge-700 border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-forge-50 font-mono outline-none placeholder:text-forge-500 focus:border-accent transition-colors"
        autoFocus
      />
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Short description (optional)"
        className="w-full bg-forge-700 border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-forge-50 font-mono outline-none placeholder:text-forge-500 focus:border-accent transition-colors"
      />
      {error && <p className="text-[11px] text-danger m-0">{error}</p>}
      <button
        onClick={handlePublish}
        disabled={loading || !title.trim()}
        className="w-full bg-accent text-white border-none rounded-lg py-2 text-xs font-semibold cursor-pointer hover:bg-accent-hover transition-colors disabled:opacity-40"
      >
        {loading ? 'Publishing...' : 'Publish'}
      </button>
    </div>
  )
}
