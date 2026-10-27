'use client'

import Link from 'next/link'
import { ArrowUpRight, Users } from 'lucide-react'
import { SpotlightCard } from '@/components/ui/motion'

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
    <SpotlightCard className="group flex flex-col p-5 h-full">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-[13.5px] font-semibold text-forge-100 m-0 truncate transition-colors group-hover:text-white">
            {title}
          </h3>
          {appType && (
            <span className="mt-2 inline-block rounded-md border border-accent/20 bg-accent-subtle px-2 py-0.5 text-[9.5px] font-mono font-medium text-accent uppercase tracking-[0.1em]">
              {appType}
            </span>
          )}
        </div>
        <span className="flex items-center gap-1 text-[10px] text-forge-500 font-mono shrink-0">
          <Users className="w-3 h-3" />
          {useCount}
        </span>
      </div>

      {description && (
        <p className="text-[12px] text-forge-400 m-0 mb-3 line-clamp-2 leading-relaxed">{description}</p>
      )}

      <div className="mt-auto rounded-lg border border-white/[0.05] bg-forge-950/60 p-3 mb-4">
        <p className="text-[10.5px] text-forge-400 font-mono m-0 line-clamp-2 leading-relaxed">{prompt}</p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-forge-500 font-mono truncate">by {authorName}</span>
        <Link
          href={`/compiler?templateId=${id}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-accent/25 bg-accent-subtle px-3 py-1.5 text-[11px] font-semibold text-accent-hover transition-all hover:border-accent/40 hover:bg-accent/15 no-underline shrink-0"
        >
          Use template
          <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>
    </SpotlightCard>
  )
}
