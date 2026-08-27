'use client'

import fs from 'fs'
import path from 'path'
import { notFound } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Download, ExternalLink, FileText, LayoutGrid, Rocket, Share2 } from 'lucide-react'
import { DeployButton } from '@/components/deploy-button'

type GeneratedPageProps = {
  params: Promise<{ gid: string }>
}

function readTextFile(filePath: string) {
  try {
    return fs.readFileSync(filePath, 'utf8')
  } catch {
    return null
  }
}

function formatGenerationLabel(gid: string) {
  const stamp = gid.replace(/^gen-/, '')
  const numericStamp = Number(stamp)

  if (Number.isFinite(numericStamp)) {
    return new Date(numericStamp).toLocaleString([], {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  return gid
}

function renderMarkdownPreview(markdown: string | null) {
  if (!markdown) {
    return <p className="text-sm text-forge-400">File not found.</p>
  }

  return (
    <div className="space-y-4 text-[15px] leading-7 text-forge-200">
      {markdown.split('\n').map((line, index) => {
        const trimmed = line.trim()

        if (!trimmed) {
          return <div key={index} className="h-2" />
        }

        if (trimmed.startsWith('### ')) {
          return <h4 key={index} className="mt-4 text-base font-semibold text-forge-50">{trimmed.slice(4)}</h4>
        }

        if (trimmed.startsWith('## ')) {
          return <h3 key={index} className="mt-5 text-lg font-semibold text-accent-hover">{trimmed.slice(3)}</h3>
        }

        if (trimmed.startsWith('# ')) {
          return <h2 key={index} className="mt-6 text-xl font-bold text-forge-50">{trimmed.slice(2)}</h2>
        }

        if (/^[-*]\s+/.test(trimmed)) {
          return (
            <div key={index} className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-accent" />
              <p>{trimmed.replace(/^[-*]\s+/, '')}</p>
            </div>
          )
        }

        if (/^\d+\.\s+/.test(trimmed)) {
          return (
            <p key={index}>
              <span className="font-semibold text-forge-50">{trimmed.match(/^\d+/)?.[0]}.</span>{' '}
              {trimmed.replace(/^\d+\.\s+/, '')}
            </p>
          )
        }

        return <p key={index}>{trimmed}</p>
      })}
    </div>
  )
}

export default async function GeneratedPage({ params }: GeneratedPageProps) {
  const { gid } = await params
  const baseDir = path.join(process.cwd(), 'public', 'generated', gid)

  if (!fs.existsSync(baseDir) || !fs.statSync(baseDir).isDirectory()) {
    notFound()
  }

  const prd = readTextFile(path.join(baseDir, 'PRD.md'))
  const trd = readTextFile(path.join(baseDir, 'TRD.md'))
  const appFlow = readTextFile(path.join(baseDir, 'AppFlow.md'))
  const uiUx = readTextFile(path.join(baseDir, 'UI-UX-BRIEF.md'))
  const backend = readTextFile(path.join(baseDir, 'BACKEND-SCHEMA.md'))
  const plan = readTextFile(path.join(baseDir, 'IMPLEMENTATION-PLAN.md'))

  const artifacts = [
    { name: 'PRD.md', file: prd },
    { name: 'TRD.md', file: trd },
    { name: 'AppFlow.md', file: appFlow },
    { name: 'UI-UX-BRIEF.md', file: uiUx },
    { name: 'BACKEND-SCHEMA.md', file: backend },
    { name: 'IMPLEMENTATION-PLAN.md', file: plan },
  ]

  return (
    <main className="min-h-screen bg-forge-950 text-white px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-10 rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:p-8">
        <div className="rounded-3xl border border-white/[0.06] bg-forge-800/50 p-6">
          <div className="flex flex-col gap-5 border-b border-white/[0.06] pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs font-medium tracking-[0.28em] text-accent-hover">Generated output</p>
              <h1 className="text-3xl font-bold sm:text-4xl">Generation {formatGenerationLabel(gid)}</h1>
              <p className="max-w-2xl text-sm leading-6 text-forge-300 sm:text-base">
                This page renders the generated artifact folder directly, so the output stays visible instead of falling through to a 404.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={`/api/generated/${gid}/download`}
                className="inline-flex items-center gap-2 rounded-2xl border border-accent/30 bg-accent-subtle px-4 py-2.5 text-sm font-semibold text-accent-hover transition hover:border-accent/40 hover:bg-accent/20"
              >
                <Download className="h-4 w-4" />
                Download ZIP
              </a>
              <a
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-forge-50 transition hover:bg-white/[0.06]"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </a>
            </div>
          </div>
        </div>

        <section className="rounded-2xl border border-white/[0.06] bg-forge-800/50 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Rocket className="h-4 w-4 text-success" />
            <h2 className="font-semibold">Deploy</h2>
          </div>
          <p className="text-sm text-forge-400 mb-4">
            Push the generated code to a new GitHub repository, then deploy it to Vercel in one click.
          </p>
          <DeployButton generationId={gid} />
        </section>

        <section className="grid gap-5 pt-3 md:grid-cols-2 xl:grid-cols-3">
          {artifacts.map((artifact) => (
            <article key={artifact.name} className="rounded-2xl border border-white/[0.06] bg-forge-800/50 p-5 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-accent-hover" />
                  <h2 className="font-semibold text-forge-50">{artifact.name}</h2>
                </div>
                <a
                  href={`/generated/${gid}/${artifact.name}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-xs font-medium text-forge-200 transition hover:bg-white/[0.06]"
                >
                  Open
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-forge-900 p-4">
                {renderMarkdownPreview(artifact.file)}
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-white/[0.06] bg-forge-800/50 p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-accent-hover" />
              <h2 className="font-semibold">Available files</h2>
            </div>
            <span className="text-sm text-forge-400">{artifacts.length} docs</span>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {artifacts.map((artifact) => (
              <a
                key={artifact.name}
                href={`/generated/${gid}/${artifact.name}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-sm text-forge-200 transition hover:bg-white/[0.06]"
              >
                <span>{artifact.name}</span>
                <ExternalLink className="h-3.5 w-3.5 text-forge-400" />
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
