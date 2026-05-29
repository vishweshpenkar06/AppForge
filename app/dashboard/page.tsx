'use client'

import { useEffect, useState } from 'react'
import { Sparkles, LayoutDashboard, History, WandSparkles } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { GenerationForm } from '@/components/generation-form'
import { GenerationHistory } from '@/components/generation-history'
import { GenerationDetail } from '@/components/generation-detail'
import { MetricsDashboard } from '@/components/metrics-dashboard'
import { LoadingSpinner } from '@/components/loading-spinner'

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [selectedGenerationId, setSelectedGenerationId] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(true)

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in')
    }
  }, [isLoaded, user, router])

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_38%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_30%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_24%)]" />
      <div className="max-w-7xl mx-auto px-4 py-8 relative">
        <div className="mb-10 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs text-sky-200">
                <Sparkles className="h-3.5 w-3.5" />
                AI Application Compiler
              </div>
              <div>
                <h1 className="text-4xl sm:text-5xl font-black tracking-tight">AppForge</h1>
                <p className="mt-3 text-base sm:text-lg text-zinc-400 max-w-2xl">
                  Describe it. Compile it. Ship it. Turn natural language into a structured app blueprint with live metrics, history, and exports.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <MiniStat label="Compiler" value="Live" icon={<WandSparkles className="h-4 w-4" />} />
              <MiniStat label="Dashboard" value="Realtime" icon={<LayoutDashboard className="h-4 w-4" />} />
              <MiniStat label="History" value="Tracked" icon={<History className="h-4 w-4" />} />
            </div>
          </div>
        </div>

        {/* Metrics Section */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-sm px-5 py-6 sm:px-8 sm:py-8 mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Your Statistics</h2>
            <p className="mt-2 max-w-2xl text-base leading-7 text-zinc-400">
              Live performance and usage signals from your recent generations.
            </p>
          </div>
          <MetricsDashboard />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Generation Form */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-6 sm:p-8">
              <GenerationForm onGenerationCreated={setSelectedGenerationId} />
            </div>

            {/* Results Section */}
            {selectedGenerationId && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-6 sm:p-8">
                <GenerationDetail generationId={selectedGenerationId} />
              </div>
            )}
          </div>

          {/* Sidebar - History */}
          <div className="lg:col-span-1">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-6 sm:p-8 sticky top-8">
              <GenerationHistory
                onSelect={setSelectedGenerationId}
                selectedId={selectedGenerationId}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MiniStat({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3 min-w-[96px]">
      <div className="flex items-center gap-2 text-[0.7rem] font-medium tracking-[0.18em] text-zinc-400">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-white">{value}</div>
    </div>
  )
}
