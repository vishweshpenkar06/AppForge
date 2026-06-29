'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles, ShieldCheck, Boxes, WandSparkles, LayoutDashboard } from 'lucide-react'

export default function Page() {
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/dashboard')
    }
  }, [isLoaded, isSignedIn, router])

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 sm:p-10 lg:p-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_26%)]" />

        <div className="relative grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.28em] text-sky-200">
              <Sparkles className="h-3.5 w-3.5" />
              Product-to-platform compiler
            </div>

            <div className="space-y-5 max-w-3xl">
              <h1 className="text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
                Ship structured apps from a single prompt.
              </h1>
              <p className="text-base leading-7 text-zinc-400 sm:text-lg">
                AppForge turns product ideas into validated application blueprints, complete with schemas, APIs, components, metrics, and exports. No scaffolding roulette. No dead-end prototypes.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={() => router.push('/sign-in')} className="rounded-full px-6 h-11">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => router.push('/compiler')} className="rounded-full px-6 h-11">
                Open Compiler
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <FeaturePill icon={<WandSparkles className="h-4 w-4" />} title="AI guided" text="Intent, schema, and validation in one flow." />
              <FeaturePill icon={<ShieldCheck className="h-4 w-4" />} title="Validated" text="Cross-layer checks catch structural issues early." />
              <FeaturePill icon={<LayoutDashboard className="h-4 w-4" />} title="Observable" text="Metrics and generation history stay visible." />
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[1.75rem] border border-white/10 bg-[#0b0d12]/90 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Preview</p>
                  <h2 className="mt-1 text-lg font-semibold">What AppForge generates</h2>
                </div>
                <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                  Live
                </div>
              </div>

              <div className="space-y-4">
                <PreviewCard title="Product shape" value="Feature map, roles, and system boundaries" />
                <PreviewCard title="Output layers" value="Database, APIs, components, validation" />
                <PreviewCard title="Workflow" value="Prompt → compile → inspect → export" />
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Example prompt</p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  Build a client portal with authentication, analytics, role-based access, and a polished admin dashboard.
                </p>
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <Boxes className="h-5 w-5 text-sky-300" />
                <div>
                  <p className="text-sm font-medium">Blueprint first</p>
                  <p className="text-xs text-zinc-500">No code until the structure is right.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

function FeaturePill({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode
  title: string
  text: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-white">
        <span className="text-sky-300">{icon}</span>
        {title}
      </div>
      <p className="mt-2 text-sm leading-6 text-zinc-500">{text}</p>
    </div>
  )
}

function PreviewCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">{title}</p>
      <p className="mt-2 text-sm text-white/90">{value}</p>
    </div>
  )
}
