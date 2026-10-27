'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Search, ChevronDown, Shield, ShieldOff } from 'lucide-react'
import Link from 'next/link'

type AdminUser = {
  id: string
  clerkId: string
  email: string
  displayName: string | null
  plan: 'free' | 'pro' | 'team'
  isAdmin: boolean
  compilesThisMonth: number
  compilesLimit: number | 'Infinity'
  generationsCount: number
  createdAt: string
}

const PLAN_OPTIONS = ['free', 'pro', 'team'] as const

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState<string>('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (planFilter) params.set('plan', planFilter)

    const res = await fetch(`/api/admin/users?${params}`)
    if (res.ok) {
      const data = await res.json()
      setUsers(data.users)
    }
    setLoading(false)
  }, [search, planFilter])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  async function handlePlanChange(userId: string, newPlan: string) {
    setUpdatingId(userId)
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, plan: newPlan }),
    })
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, plan: newPlan as AdminUser['plan'], compilesThisMonth: 0 }
            : u
        )
      )
    }
    setUpdatingId(null)
  }

  async function handleToggleAdmin(userId: string, current: boolean) {
    setUpdatingId(userId)
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isAdmin: !current }),
    })
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isAdmin: !current } : u))
      )
    }
    setUpdatingId(null)
  }

  return (
    <div className="min-h-screen bg-forge-950 text-white px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm font-semibold text-forge-50 transition hover:bg-white/[0.06]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-xs font-medium tracking-[0.28em] text-accent-hover uppercase">Admin</p>
            <h1 className="text-3xl font-bold mt-1">Users</h1>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-forge-400" />
            <input
              type="text"
              placeholder="Search by email or name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/[0.06] bg-forge-800/50 py-2.5 pl-10 pr-4 text-sm text-forge-50 placeholder:text-forge-500 focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>
          <div className="relative">
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="appearance-none rounded-xl border border-white/[0.06] bg-forge-800/50 py-2.5 pl-4 pr-9 text-sm text-forge-50 focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              <option value="">All plans</option>
              {PLAN_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-forge-400 pointer-events-none" />
          </div>
        </div>

        {/* User table */}
        <div className="rounded-2xl border border-white/[0.06] bg-forge-800/50 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-forge-400 text-sm">Loading…</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-forge-400 text-sm">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="px-4 py-3 text-left font-medium text-forge-400">User</th>
                    <th className="px-4 py-3 text-left font-medium text-forge-400">Plan</th>
                    <th className="px-4 py-3 text-left font-medium text-forge-400">Compiles</th>
                    <th className="px-4 py-3 text-left font-medium text-forge-400">Generations</th>
                    <th className="px-4 py-3 text-left font-medium text-forge-400">Joined</th>
                    <th className="px-4 py-3 text-right font-medium text-forge-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-forge-50">{user.displayName || '—'}</div>
                          <div className="text-xs text-forge-400">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <select
                            value={user.plan}
                            onChange={(e) => handlePlanChange(user.id, e.target.value)}
                            disabled={updatingId === user.id}
                            className="appearance-none rounded-lg border border-white/[0.06] bg-forge-900 py-1.5 pl-3 pr-7 text-xs font-medium text-forge-50 focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-50"
                          >
                            {PLAN_OPTIONS.map((p) => (
                              <option key={p} value={p}>
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-forge-400 pointer-events-none" />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-forge-200">
                          {user.compilesThisMonth}
                          <span className="text-forge-500"> / {user.compilesLimit === 'Infinity' ? '∞' : user.compilesLimit}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-forge-200">{user.generationsCount}</td>
                      <td className="px-4 py-3 text-forge-400 text-xs">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleToggleAdmin(user.id, user.isAdmin)}
                          disabled={updatingId === user.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5 text-xs font-medium text-forge-300 transition hover:bg-white/[0.06] disabled:opacity-50"
                          title={user.isAdmin ? 'Remove admin' : 'Make admin'}
                        >
                          {user.isAdmin ? (
                            <>
                              <ShieldOff className="h-3.5 w-3.5 text-warning" />
                              <span className="text-warning">Admin</span>
                            </>
                          ) : (
                            <>
                              <Shield className="h-3.5 w-3.5" />
                              <span>Grant</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-xs text-forge-500 text-center">
          Showing {users.length} of {users.length} users
        </p>
      </div>
    </div>
  )
}
