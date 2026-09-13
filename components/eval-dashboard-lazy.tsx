'use client'

import dynamic from 'next/dynamic'

const EvalDashboard = dynamic(
  () => import('@/components/eval-dashboard').then((m) => m.EvalDashboard),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col gap-6">
        <div className="h-8 w-48 bg-forge-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-forge-800 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-[240px] bg-forge-800 rounded-xl animate-pulse" />
      </div>
    ),
  }
)

export function EvalDashboardLazy() {
  return <EvalDashboard />
}
