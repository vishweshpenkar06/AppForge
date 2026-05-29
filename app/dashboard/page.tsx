'use client'

import { useEffect, useState } from 'react'
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
    <div className="min-h-screen bg-[#09090b] text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">AppForge</h1>
          <p className="text-gray-400">Describe it. Compile it. Ship it.</p>
        </div>

        {/* Metrics Section */}
        <div className="bg-[#1a1a1f] border border-gray-800 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Your Statistics</h2>
          <MetricsDashboard />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Generation Form */}
            <div className="bg-[#1a1a1f] border border-gray-800 rounded-lg p-8">
              <GenerationForm onGenerationCreated={setSelectedGenerationId} />
            </div>

            {/* Results Section */}
            {selectedGenerationId && (
              <div className="bg-[#1a1a1f] border border-gray-800 rounded-lg p-8">
                <GenerationDetail generationId={selectedGenerationId} />
              </div>
            )}
          </div>

          {/* Sidebar - History */}
          <div className="lg:col-span-1">
            <div className="bg-[#1a1a1f] border border-gray-800 rounded-lg p-8 sticky top-8">
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
