'use client'

import Link from 'next/link'
import { FileText, Users, ArrowRight } from 'lucide-react'

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
    <div className="group relative flex flex-col rounded-2xl border border-white/[0.06] bg-forge-800/50 p-5 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset] transition-all hover:border-white/[0.12] hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-forge-50 m-0 truncate">{title}</h3>
          {appType && (
            <span className="mt-1.5 inline-block rounded-md border border-accent/20 bg-accent-subtle px-2 py-0.5 text-[10px] font-mono font-medium text-accent-hover uppercase tracking-wider">
              {appType}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-forge-400 font-mono shrink-0">
          <Users className="h-3 w-3" />
          {useCount}
        </div>
      </div>

      {description && (
        <p className="text-xs text-forge-400 m-0 mb-3 line-clamp-2 leading-relaxed">{description}</p>
      )}

      <div className="mt-auto rounded-xl border border-white/[0.04] bg-forge-900 p-3 mb-4">
        <p className="text-[11px] text-forge-300 font-mono m-0 line-clamp-2 leading-relaxed">
          {prompt.length > 120 ? prompt.slice(0, 120) + '...' : prompt}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-forge-500 font-mono">by {authorName}</span>
        <Link
          href={`/compiler?templateId=${id}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-accent/30 bg-accent-subtle px-3 py-1.5 text-[11px] font-semibold text-accent-hover transition-all hover:border-accent/40 hover:bg-accent/20 no-underline"
        >
          Use template
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}
