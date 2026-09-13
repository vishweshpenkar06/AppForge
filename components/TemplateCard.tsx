'use client'

import Link from 'next/link'

interface TemplateCardProps {
  id: string
  title: string
  description?: string | null
  appType?: string | null
  useCount: number
  authorName: string
  prompt: string
}

export function TemplateCard({ id, title, description, appType, useCount, authorName, prompt }: TemplateCardProps) {
  return (
    <div className="group relative flex flex-col rounded-xl border border-white/[0.06] bg-forge-900/50 p-5 transition-all hover:border-accent/20 hover:shadow-lg hover:shadow-accent/[0.03]">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-forge-100 m-0 truncate">{title}</h3>
          {appType && (
            <span className="mt-2 inline-block rounded-md border border-accent/20 bg-accent-subtle px-2 py-0.5 text-[10px] font-mono font-medium text-accent uppercase tracking-wider">
              {appType}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-forge-500 font-mono shrink-0">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
          {useCount}
        </div>
      </div>

      {description && (
        <p className="text-xs text-forge-400 m-0 mb-3 line-clamp-2 leading-relaxed">{description}</p>
      )}

      <div className="mt-auto rounded-lg border border-white/[0.04] bg-forge-800/50 p-3 mb-4">
        <p className="text-[11px] text-forge-400 font-mono m-0 line-clamp-2 leading-relaxed">
          {prompt.length > 120 ? prompt.slice(0, 120) + '...' : prompt}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-forge-500 font-mono">by {authorName}</span>
        <Link
          href={`/compiler?templateId=${id}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-accent/20 bg-accent-subtle px-3 py-1.5 text-[11px] font-semibold text-accent transition-all hover:border-accent/30 hover:bg-accent/15 no-underline"
        >
          Use template
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </Link>
      </div>
    </div>
  )
}
