'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, LayoutGrid } from 'lucide-react'
import { TemplateCard } from '@/components/TemplateCard'
import { Reveal } from '@/components/ui/motion'

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
    <div className="relative max-w-[1100px] mx-auto px-4 md:px-6 py-8 md:py-12">
      <div
        className="absolute inset-x-0 top-0 h-52 pointer-events-none bg-[radial-gradient(70%_100%_at_50%_0%,rgba(16,185,129,0.10),transparent_70%)]"
        aria-hidden
      />

      <Reveal className="relative mb-8">
        <p className="font-mono text-[10px] text-accent/80 uppercase tracking-[0.2em] m-0 mb-2">Community</p>
        <h1 className="text-2xl md:text-3xl font-bold text-forge-50 m-0 tracking-tight">Template Gallery</h1>
        <p className="text-sm text-forge-400 m-0 mt-1">
          Reusable blueprints from the community. Pick one to jump-start your next build.
        </p>
      </Reveal>

      {/* Filters */}
      <Reveal delay={60} className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-forge-500 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            aria-label="Search templates"
            className="w-full h-10 pl-9 pr-4 bg-forge-900/60 border border-white/[0.07] rounded-xl text-sm text-forge-100 font-mono outline-none placeholder:text-forge-600 focus:border-accent/60 focus:ring-2 focus:ring-accent/10 transition-all"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {APP_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              aria-pressed={selectedType === type}
              onClick={() => setSelectedType(type)}
              className={`text-[11px] px-3 py-1.5 rounded-lg border font-mono whitespace-nowrap cursor-pointer transition-all shrink-0
                ${selectedType === type
                  ? 'border-accent/30 bg-accent-subtle text-accent-hover'
                  : 'border-white/[0.06] bg-white/[0.02] text-forge-400 hover:border-white/[0.12] hover:text-forge-200'}`}
            >
              {type === 'all' ? 'All types' : type}
            </button>
          ))}
        </div>
      </Reveal>

      {!loading && templates.length > 0 && (
        <p className="text-[11px] font-mono text-forge-500 m-0 mb-4">
          {templates.length} template{templates.length === 1 ? '' : 's'}
          {selectedType !== 'all' ? ` · ${selectedType}` : ''}
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-[240px] skeleton" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-xl bg-forge-900 border border-white/[0.06] flex items-center justify-center mb-4">
            <LayoutGrid className="w-5 h-5 text-forge-500" />
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
          {templates.map((t, i) => (
            <Reveal key={t.id} delay={Math.min(i, 6) * 50}>
              <TemplateCard
                id={t.id}
                title={t.title}
                description={t.description}
                appType={t.appType}
                useCount={t.useCount}
                authorName={t.authorName}
                prompt={t.prompt}
              />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  )
}
