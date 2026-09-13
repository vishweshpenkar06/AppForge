'use client'

import { useState, useEffect, useRef } from 'react'
import { TemplateCard } from '@/components/TemplateCard'

const APP_TYPES = ['all', 'crm', 'marketplace', 'saas', 'content', 'ecommerce', 'analytics', 'social', 'crud', 'other']
const DEBOUNCE_MS = 300

interface Template {
  id: string
  title: string
  description: string | null
  appType: string | null
  useCount: number
  authorName: string
  prompt: string
  createdAt: string
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search)
    }, DEBOUNCE_MS)
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [search])

  useEffect(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.set('q', debouncedSearch)
    if (selectedType !== 'all') params.set('appType', selectedType)

    setLoading(true)
    fetch(`/api/templates?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setTemplates(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [debouncedSearch, selectedType])

  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-forge-50 m-0 tracking-tight">Template Gallery</h1>
        <p className="text-sm text-forge-400 m-0 mt-1">
          Reusable blueprints from the community. Pick one to jump-start your next build.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-forge-500 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="w-full h-10 pl-9 pr-4 bg-forge-800 border border-white/[0.06] rounded-lg text-sm text-forge-100 font-mono outline-none placeholder:text-forge-600 focus:border-accent transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {APP_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`text-[11px] px-3 py-1.5 rounded-lg border font-mono whitespace-nowrap cursor-pointer transition-all shrink-0
                ${selectedType === type
                  ? 'border-accent/30 bg-accent-subtle text-accent'
                  : 'border-white/[0.06] bg-forge-800/50 text-forge-400 hover:border-white/[0.1] hover:text-forge-300'}`}
            >
              {type === 'all' ? 'All types' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-forge-400">Loading templates...</p>
          </div>
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-xl bg-forge-800 border border-white/[0.06] flex items-center justify-center mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-forge-500"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          </div>
          <p className="text-sm text-forge-300 m-0 mb-1">No templates found</p>
          <p className="text-xs text-forge-500 m-0">
            {search || selectedType !== 'all'
              ? 'Try adjusting your search or filter.'
              : 'Publish a generation as a template to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <TemplateCard
              key={t.id}
              id={t.id}
              title={t.title}
              description={t.description}
              appType={t.appType}
              useCount={t.useCount}
              authorName={t.authorName}
              prompt={t.prompt}
            />
          ))}
        </div>
      )}
    </div>
  )
}
