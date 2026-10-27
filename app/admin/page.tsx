import { redirect } from 'next/navigation'
import Link from 'next/link'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'
import { getSystemMetrics } from '@/lib/metrics'
import { Users, Activity, Zap, AlertTriangle, BarChart3 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const auth = await requireAdmin()
  if ('error' in auth) redirect('/')

  const [metrics, userCounts, generationCounts] = await Promise.all([
    getSystemMetrics(),
    prisma.user.groupBy({ by: ['plan'], _count: true }),
    prisma.generation.groupBy({ by: ['status'], _count: true }),
  ])

  const totalUsers = userCounts.reduce((sum, p) => sum + p._count, 0)
  const planMap = Object.fromEntries(userCounts.map((p) => [p.plan, p._count]))
  const statusMap = Object.fromEntries(generationCounts.map((s) => [s.status, s._count]))

  return (
    <div className="min-h-screen bg-forge-950 text-white px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.28em] text-accent-hover uppercase">Admin</p>
            <h1 className="text-3xl font-bold mt-1">Dashboard</h1>
          </div>
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-forge-50 transition hover:bg-white/[0.06]"
          >
            <Users className="h-4 w-4" />
            Manage Users
          </Link>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Users"
            value={totalUsers}
            icon={<Users className="h-5 w-5 text-accent-hover" />}
          />
          <StatCard
            label="Total Generations"
            value={metrics?.totalGenerations ?? 0}
            icon={<Activity className="h-5 w-5 text-secondary" />}
          />
          <StatCard
            label="Success Rate"
            value={`${(metrics?.successRate ?? 0).toFixed(1)}%`}
            icon={<Zap className="h-5 w-5 text-success" />}
          />
          <StatCard
            label="Failed Generations"
            value={metrics?.failedGenerations ?? 0}
            icon={<AlertTriangle className="h-5 w-5 text-danger" />}
          />
        </div>

        {/* Plan breakdown + mode breakdown */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/[0.06] bg-forge-800/50 p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-accent-hover" />
              <h2 className="font-semibold text-sm">Users by Plan</h2>
            </div>
            <div className="space-y-3">
              {(['free', 'pro', 'team'] as const).map((tier) => (
                <PlanRow key={tier} plan={tier} count={planMap[tier] ?? 0} total={totalUsers} />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-forge-800/50 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-secondary" />
              <h2 className="font-semibold text-sm">Generations by Mode</h2>
            </div>
            <div className="space-y-3">
              {(['fast', 'balanced', 'precise'] as const).map((mode) => (
                <ModeRow key={mode} mode={mode} count={metrics?.modes?.[mode] ?? 0} total={metrics?.totalGenerations ?? 0} />
              ))}
            </div>
          </div>
        </div>

        {/* Generation status breakdown */}
        <div className="rounded-2xl border border-white/[0.06] bg-forge-800/50 p-5">
          <h2 className="font-semibold text-sm mb-4">Generation Status</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(statusMap).map(([status, count]) => (
              <span
                key={status}
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm"
              >
                <span className={`h-2 w-2 rounded-full ${statusColor(status)}`} />
                <span className="text-forge-300 capitalize">{status}</span>
                <span className="font-semibold text-forge-50">{count}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Estimated cost */}
        {metrics && 'estimatedCost' in metrics && (
          <div className="rounded-2xl border border-white/[0.06] bg-forge-800/50 p-5">
            <h2 className="font-semibold text-sm mb-2">Estimated LLM Cost</h2>
            <p className="text-3xl font-bold text-forge-50">
              ${(metrics as any).estimatedCost?.toFixed(2) ?? '0.00'}
            </p>
            <p className="text-xs text-forge-400 mt-1">Conservative estimate based on token usage</p>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-forge-800/50 p-5">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-xs font-medium text-forge-400">{label}</span>
      </div>
      <p className="text-3xl font-bold text-forge-50">{value}</p>
    </div>
  )
}

function PlanRow({ plan, count, total }: { plan: string; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="capitalize text-forge-200">{plan}</span>
        <span className="text-forge-400">{count} ({pct.toFixed(0)}%)</span>
      </div>
      <div className="h-1.5 rounded-full bg-forge-700 overflow-hidden">
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function ModeRow({ mode, count, total }: { mode: string; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="capitalize text-forge-200">{mode}</span>
        <span className="text-forge-400">{count} ({pct.toFixed(0)}%)</span>
      </div>
      <div className="h-1.5 rounded-full bg-forge-700 overflow-hidden">
        <div className="h-full rounded-full bg-secondary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function statusColor(status: string): string {
  switch (status) {
    case 'completed':
    case 'success':
      return 'bg-success'
    case 'failed':
      return 'bg-danger'
    case 'running':
    case 'pending':
      return 'bg-warning'
    default:
      return 'bg-forge-500'
  }
}
