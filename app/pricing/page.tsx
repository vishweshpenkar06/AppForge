'use client'

import { useState } from 'react'
import { track } from '@/lib/analytics'

const PLANS = [
  {
    name: 'Free',
    monthlyPrice: '$0',
    yearlyPrice: '$0',
    period: 'forever',
    description: 'For trying out the compiler',
    features: ['10 compiles / month', 'Fast mode only', 'JSON + YAML export', '7-day history', '1 seat', 'Community support'],
    cta: 'Current plan',
    highlighted: false,
  },
  {
    name: 'Pro',
    monthlyPrice: '$19',
    yearlyPrice: '$15',
    period: '/mo',
    description: 'For shipping real products',
    features: ['100 compiles / month', 'Fast + Balanced modes', 'JSON + SQL + Express + React', 'ZIP bundle export', '90-day history', '1 seat', 'Email support'],
    cta: 'Upgrade to Pro',
    highlighted: true,
  },
  {
    name: 'Team',
    monthlyPrice: '$49',
    yearlyPrice: '$39',
    period: '/mo',
    description: 'For teams building together',
    features: ['Unlimited compiles', 'All modes incl. Precise', 'Full ZIP bundle export', 'Unlimited history', '5 seats', 'Priority support', 'Team sharing'],
    cta: 'Upgrade to Team',
    highlighted: false,
  },
]

const COMPARISON = [
  { feature: 'Compiles / month', free: '10', pro: '100', team: 'Unlimited' },
  { feature: 'Modes', free: 'Fast', pro: 'Fast + Balanced', team: 'All' },
  { feature: 'JSON + YAML export', free: true, pro: true, team: true },
  { feature: 'SQL / Express / React export', free: false, pro: true, team: true },
  { feature: 'ZIP bundle export', free: false, pro: true, team: true },
  { feature: 'History retention', free: '7 days', pro: '90 days', team: 'Unlimited' },
  { feature: 'Seats', free: '1', pro: '1', team: '5' },
  { feature: 'Support', free: 'Community', pro: 'Email', team: 'Priority' },
  { feature: 'Output detail level', free: 'Minimal', pro: 'Maximum', team: 'Maximum' },
]

export default function PricingPage() {
  const [yearly, setYearly] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)
  const [teamCodeInput, setTeamCodeInput] = useState('')

  async function handleUpgrade(planName: string) {
    track('plan_upgrade_clicked', { plan: planName, billing: yearly ? 'yearly' : 'monthly' })
    try {
      const res = await fetch('/api/plan/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planName.toLowerCase() }),
      })
      const data = await res.json()
      if (data.success) {
        if (data.teamCode) {
          setNotification(`You're on the Team plan. Share this code: ${data.teamCode}`)
        } else {
          setNotification(`You're now on the ${planName} plan.`)
        }
        setTimeout(() => setNotification(null), 6000)
        setTimeout(() => window.location.reload(), 2000)
      }
    } catch {}
  }

  async function handleJoinTeam() {
    if (!teamCodeInput.trim()) return
    try {
      const res = await fetch('/api/plan/join-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: teamCodeInput.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setNotification("You've joined the team! You're now on the Team plan.")
        setTimeout(() => setNotification(null), 4000)
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setNotification(data.error || 'Failed to join team')
        setTimeout(() => setNotification(null), 4000)
      }
    } catch {}
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-[900px] mx-auto px-4 md:px-6 py-8 md:py-12 text-center">
        <p className="font-mono text-[11px] text-forge-500 uppercase tracking-[0.15em] mb-3 m-0">Pricing</p>
        <h1 className="text-3xl font-bold text-forge-50 mb-2 m-0 tracking-tight">Simple, transparent pricing</h1>
        <p className="text-sm text-forge-400 mb-8 m-0">The compiler is always free to try. Upgrade when you need more.</p>

        {/* Toggle */}
        <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-forge-800 border border-white/[0.06] mb-10">
          <button onClick={() => setYearly(false)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium border-none cursor-pointer transition-all
              ${!yearly ? 'bg-accent text-white' : 'bg-transparent text-forge-400 hover:text-forge-300'}`}>Monthly</button>
          <button onClick={() => setYearly(true)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium border-none cursor-pointer transition-all
              ${yearly ? 'bg-accent text-white' : 'bg-transparent text-forge-400 hover:text-forge-300'}`}>Yearly <span className="text-[10px] opacity-70">-20%</span></button>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          {PLANS.map((plan) => (
            <div key={plan.name} className={`rounded-xl p-5 relative transition-all
              ${plan.highlighted
                ? 'bg-forge-900 border-2 border-accent shadow-lg shadow-accent/10'
                : 'bg-forge-900/50 border border-white/[0.06] hover:border-white/[0.1]'}`}>
              {plan.highlighted && (
                <div className="absolute -top-2.5 left-5 bg-accent text-white text-[11px] font-medium px-2.5 py-0.5 rounded-full">Most popular</div>
              )}
              <p className="text-sm font-semibold text-forge-100 m-0 mb-1">{plan.name}</p>
              <p className="text-xs text-forge-500 m-0 mb-4">{plan.description}</p>
              <div className="flex items-baseline gap-0.5 mb-5">
                <span className="text-3xl font-bold text-forge-50">{yearly ? plan.yearlyPrice : plan.monthlyPrice}</span>
                <span className="text-sm text-forge-500">{plan.period}</span>
              </div>
              {yearly && plan.monthlyPrice !== '$0' && (
                <p className="text-[11px] text-accent m-0 -mt-3 mb-4 font-mono">
                  Billed yearly · Save {plan.name === 'Pro' ? '$48' : '$120'}
                </p>
              )}
              <button onClick={() => handleUpgrade(plan.name)}
                className={`w-full py-2.5 rounded-lg text-sm font-medium mb-5 cursor-pointer transition-all
                  ${plan.highlighted
                    ? 'bg-accent text-white border-none hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98]'
                    : 'bg-transparent text-forge-300 border border-white/[0.06] hover:bg-forge-800 hover:border-white/[0.1]'}`}>{plan.cta}</button>
              <div className="border-t border-white/[0.06] pt-4 flex flex-col gap-2.5">
                {plan.features.map((f) => (
                  <div key={f} className="flex gap-2 items-start">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-accent mt-0.5 shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                    <span className="text-xs text-forge-300 leading-relaxed">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Comparison toggle */}
        <button onClick={() => setShowComparison(!showComparison)}
          className="mt-8 text-xs text-forge-500 bg-transparent border-none cursor-pointer font-mono hover:text-forge-300 transition-colors">
          {showComparison ? 'Hide comparison ↑' : 'See full feature comparison ↓'}
        </button>

        {showComparison && (
          <div className="mt-6 rounded-xl border border-white/[0.06] overflow-hidden text-left bg-forge-900/50">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-forge-800/50">
                  <th className="px-4 py-3 text-left text-forge-400 font-medium border-b border-white/[0.06]">Feature</th>
                  <th className="px-4 py-3 text-center text-forge-400 font-medium border-b border-white/[0.06]">Free</th>
                  <th className="px-4 py-3 text-center text-accent font-medium border-b border-white/[0.06]">Pro</th>
                  <th className="px-4 py-3 text-center text-forge-400 font-medium border-b border-white/[0.06]">Team</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={row.feature} className={i % 2 === 0 ? '' : 'bg-forge-800/30'}>
                    <td className="px-4 py-2.5 text-forge-300 border-b border-white/[0.04]">{row.feature}</td>
                    {(['free', 'pro', 'team'] as const).map((plan) => (
                      <td key={plan} className={`px-4 py-2.5 text-center border-b border-white/[0.04] ${plan === 'pro' ? 'text-accent' : 'text-forge-300'}`}>
                        {typeof row[plan] === 'boolean' ? (row[plan] ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="inline"><polyline points="20 6 9 17 4 12"/></svg> : '—') : String(row[plan])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Team code input */}
        <div className="max-w-[400px] mx-auto mt-10 p-5 bg-forge-900/50 border border-white/[0.06] rounded-xl text-left">
          <p className="text-sm font-semibold text-forge-100 m-0 mb-1">Have a team code?</p>
          <p className="text-xs text-forge-500 m-0 mb-3">Join a Team plan someone shared with you.</p>
          <div className="flex gap-2">
            <input
              value={teamCodeInput}
              onChange={(e) => setTeamCodeInput(e.target.value.toUpperCase())}
              placeholder="TEAM-XXXXXXXX"
              className="flex-1 text-sm px-3 py-2 border border-white/[0.06] rounded-lg bg-forge-800 text-forge-100 font-mono outline-none placeholder:text-forge-600 focus:border-accent transition-colors"
            />
            <button onClick={handleJoinTeam}
              className="text-sm px-4 py-2 rounded-lg bg-accent text-white border-none cursor-pointer font-medium hover:bg-accent-hover transition-all active:scale-[0.98]">Join</button>
          </div>
        </div>
      </div>

      {/* Toast notification */}
      {notification && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-forge-800 border border-success/30 rounded-xl px-5 py-3 flex items-center gap-2 shadow-lg z-50">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-success"><polyline points="20 6 9 17 4 12"/></svg>
          <span className="text-sm text-forge-100">{notification}</span>
        </div>
      )}
    </div>
  )
}
