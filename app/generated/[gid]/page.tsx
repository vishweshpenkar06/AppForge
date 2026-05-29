import fs from 'fs'
import path from 'path'
import { notFound } from 'next/navigation'
import { ArrowLeft, Download, ExternalLink, FileText, LayoutGrid } from 'lucide-react'

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
    return <p className="text-sm text-zinc-500">File not found.</p>
  }

  return (
    <div className="space-y-4 text-[15px] leading-7 text-zinc-200">
      {markdown.split('\n').map((line, index) => {
        const trimmed = line.trim()

        if (!trimmed) {
          return <div key={index} className="h-2" />
        }

        if (trimmed.startsWith('### ')) {
          return <h4 key={index} className="mt-4 text-base font-semibold text-white">{trimmed.slice(4)}</h4>
        }

        if (trimmed.startsWith('## ')) {
          return <h3 key={index} className="mt-5 text-lg font-semibold text-sky-200">{trimmed.slice(3)}</h3>
        }

        if (trimmed.startsWith('# ')) {
          return <h2 key={index} className="mt-6 text-xl font-black text-white">{trimmed.slice(2)}</h2>
        }

        if (/^[-*]\s+/.test(trimmed)) {
          return (
            <div key={index} className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-sky-400" />
              <p>{trimmed.replace(/^[-*]\s+/, '')}</p>
            </div>
          )
        }

        if (/^\d+\.\s+/.test(trimmed)) {
          return (
            <p key={index}>
              <span className="font-semibold text-white">{trimmed.match(/^\d+/)?.[0]}.</span>{' '}
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
    <main className="min-h-screen bg-[#09090b] text-white px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-10 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:p-8">
        <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
          <div className="flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs font-medium tracking-[0.28em] text-sky-300">Generated output</p>
              <h1 className="text-3xl font-black sm:text-4xl">Generation {formatGenerationLabel(gid)}</h1>
              <p className="max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
                This page renders the generated artifact folder directly, so the output stays visible instead of falling through to a 404.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={`/api/generated/${gid}/download`}
                className="inline-flex items-center gap-2 rounded-2xl border border-sky-500/30 bg-sky-500/15 px-4 py-2.5 text-sm font-semibold text-sky-200 transition hover:border-sky-400/40 hover:bg-sky-500/25"
              >
                <Download className="h-4 w-4" />
                Download ZIP
              </a>
              <a
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.09]"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </a>
            </div>
          </div>
        </div>

        <section className="grid gap-5 pt-2 md:grid-cols-2 xl:grid-cols-3">
          {artifacts.map((artifact) => (
            <article key={artifact.name} className="rounded-2xl border border-white/10 bg-black/20 p-5 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-sky-300" />
                  <h2 className="font-semibold text-white">{artifact.name}</h2>
                </div>
                <a
                  href={`/generated/${gid}/${artifact.name}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-zinc-200 transition hover:bg-white/[0.08]"
                >
                  Open
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#0b0b10] p-4">
                {renderMarkdownPreview(artifact.file)}
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-sky-300" />
              <h2 className="font-semibold">Available files</h2>
            </div>
            <span className="text-sm text-zinc-500">{artifacts.length} docs</span>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {artifacts.map((artifact) => (
              <a
                key={artifact.name}
                href={`/generated/${gid}/${artifact.name}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-zinc-200 transition hover:bg-white/[0.06]"
              >
                <span>{artifact.name}</span>
                <ExternalLink className="h-3.5 w-3.5 text-zinc-500" />
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
