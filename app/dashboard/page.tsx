'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { GenerationForm } from '@/components/generation-form'
import { GenerationHistory } from '@/components/generation-history'
import { GenerationDetail } from '@/components/generation-detail'
import { MetricsDashboard } from '@/components/metrics-dashboard'

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [selectedGenerationId, setSelectedGenerationId] = useState<string | null>(null)

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in')
    }
  }, [isLoaded, user, router])

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* ── Metrics Row ────────────────────────────────────────── */}
      <div className="px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Dashboard</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">Your compilation stats and history</p>
          </div>
          <MetricsDashboard />
        </div>
      </div>

      {/* ── Main Content + Sidebar ─────────────────────────────── */}
      <div className="px-6 pb-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface)] p-6">
              <GenerationForm onGenerationCreated={setSelectedGenerationId} />
            </div>

            {selectedGenerationId && (
              <div className="rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface)] p-6">
                <GenerationDetail generationId={selectedGenerationId} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface)] p-6 sticky top-20">
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
