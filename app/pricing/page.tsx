'use client'

import { useState } from 'react'
import { Check, Minus } from 'lucide-react'
import { toast } from 'sonner'
import { track } from '@/lib/analytics'
import { Reveal, SpotlightCard } from '@/components/ui/motion'

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
        toast.success(
          data.teamCode
            ? `You're on the Team plan. Share code ${data.teamCode}`
            : `You're now on the ${planName} plan.`,
        )
        setTimeout(() => window.location.reload(), 2000)
      } else {
        toast.error(data.error || 'Upgrade failed')
      }
    } catch {
      toast.error('Upgrade failed — check your connection')
    }
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
        toast.success("You've joined the team — Team plan active.")
        setTimeout(() => window.location.reload(), 1500)
      } else {
        toast.error(data.error || 'Failed to join team')
      }
    } catch {
      toast.error('Failed to join team')
    }
  }

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-x-0 top-0 h-72 aurora opacity-50 pointer-events-none" aria-hidden />

      <div className="relative max-w-[980px] mx-auto px-4 md:px-6 py-10 md:py-16">
        <Reveal className="text-center">
          <p className="font-mono text-[10px] text-accent/80 uppercase tracking-[0.2em] m-0 mb-3">Pricing</p>
          <h1 className="text-3xl md:text-4xl font-bold text-forge-50 m-0 tracking-tight text-balance">
            Simple, transparent pricing
          </h1>
          <p className="text-sm text-forge-400 mt-3 mb-8 m-0">
            The compiler is always free to try. Upgrade when you need more headroom.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center p-1 rounded-xl bg-forge-900/70 border border-white/[0.07] mb-10" role="group" aria-label="Billing period">
            {[
              { id: false, label: 'Monthly' },
              { id: true, label: 'Yearly', hint: '−20%' },
            ].map((opt) => (
              <button
                key={String(opt.id)}
                type="button"
                aria-pressed={yearly === opt.id}
                onClick={() => setYearly(opt.id)}
                className={`px-4 py-1.5 rounded-[10px] text-xs font-medium border-none cursor-pointer transition-all ${
                  yearly === opt.id
                    ? 'bg-accent text-forge-950 shadow-sm'
                    : 'bg-transparent text-forge-400 hover:text-forge-200'
                }`}
              >
                {opt.label}
                {opt.hint && <span className="text-[10px] opacity-70 ml-1">{opt.hint}</span>}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {PLANS.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 80}>
              <SpotlightCard
                className={`relative flex flex-col p-6 h-full ${
                  plan.highlighted ? 'border-accent/40 bg-forge-900/80 md:-mt-2 md:pb-8' : ''
                }`}
              >
                {plan.highlighted && (
                  <>
                    <div className="absolute inset-x-6 -top-px h-px bg-gradient-to-r from-transparent via-accent to-transparent" aria-hidden />
                    <span className="absolute -top-2.5 left-6 bg-accent text-forge-950 text-[10px] font-bold px-2.5 py-0.5 rounded-full tracking-wide">
                      MOST POPULAR
                    </span>
                  </>
                )}
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-semibold text-forge-100 m-0">{plan.name}</p>
                  {plan.highlighted && <span className="text-[10px] font-mono text-accent">best value</span>}
                </div>
                <p className="text-[11.5px] text-forge-500 m-0 mt-0.5 mb-5">{plan.description}</p>

                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-[34px] leading-none font-bold text-forge-50 tracking-tight">
                    {yearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-sm text-forge-500">{plan.period}</span>
                </div>
                <p className={`text-[10.5px] font-mono m-0 mb-5 h-4 ${yearly && plan.monthlyPrice !== '$0' ? 'text-accent' : 'text-transparent'}`}>
                  billed yearly · save {plan.name === 'Pro' ? '$48' : '$120'}
                </p>

                <button
                  type="button"
                  disabled={plan.name === 'Free'}
                  onClick={() => handleUpgrade(plan.name)}
                  className={`w-full py-2.5 rounded-xl text-[13px] font-semibold mb-6 cursor-pointer transition-all disabled:cursor-default disabled:opacity-60 ${
                    plan.highlighted
                      ? 'bg-accent text-forge-950 border-none hover:bg-accent-hover hover:shadow-[0_10px_30px_-10px_rgba(16,185,129,0.6)] active:scale-[0.99]'
                      : 'bg-white/[0.03] text-forge-200 border border-white/[0.08] hover:bg-white/[0.07] hover:border-white/[0.16]'
                  }`}
                >
                  {plan.cta}
                </button>

                <div className="border-t border-white/[0.06] pt-5 flex flex-col gap-2.5">
                  {plan.features.map((f) => (
                    <div key={f} className="flex gap-2 items-start">
                      <Check className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />
                      <span className="text-[12px] text-forge-300 leading-relaxed">{f}</span>
                    </div>
                  ))}
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>

        {/* Comparison */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowComparison(!showComparison)}
            aria-expanded={showComparison}
            className="mt-8 text-xs text-forge-500 bg-transparent border-none cursor-pointer font-mono hover:text-forge-300 transition-colors"
          >
            {showComparison ? 'Hide comparison ↑' : 'See full feature comparison ↓'}
          </button>
        </div>

        {showComparison && (
          <div className="mt-6 rounded-2xl border border-white/[0.07] overflow-hidden bg-forge-900/50" style={{ animation: 'reveal-up .3s ease-out' }}>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-forge-950/50">
                    <th className="px-4 py-3 text-left text-forge-400 font-medium border-b border-white/[0.06]">Feature</th>
                    <th className="px-4 py-3 text-center text-forge-400 font-medium border-b border-white/[0.06]">Free</th>
                    <th className="px-4 py-3 text-center text-accent font-medium border-b border-white/[0.06]">Pro</th>
                    <th className="px-4 py-3 text-center text-forge-400 font-medium border-b border-white/[0.06]">Team</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row, i) => (
                    <tr key={row.feature} className={i % 2 === 0 ? '' : 'bg-white/[0.015]'}>
                      <td className="px-4 py-2.5 text-forge-300 border-b border-white/[0.04]">{row.feature}</td>
                      {(['free', 'pro', 'team'] as const).map((plan) => (
                        <td
                          key={plan}
                          className={`px-4 py-2.5 text-center border-b border-white/[0.04] ${plan === 'pro' ? 'text-accent' : 'text-forge-300'}`}
                        >
                          {typeof row[plan] === 'boolean' ? (
                            row[plan] ? (
                              <Check className="w-3.5 h-3.5 inline" />
                            ) : (
                              <Minus className="w-3.5 h-3.5 inline text-forge-600" />
                            )
                          ) : (
                            String(row[plan])
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Team code */}
        <Reveal delay={100} className="max-w-[420px] mx-auto mt-12">
          <div className="p-5 bg-forge-900/50 border border-white/[0.07] rounded-2xl text-left">
            <p className="text-[13px] font-semibold text-forge-100 m-0 mb-1">Have a team code?</p>
            <p className="text-[11.5px] text-forge-500 m-0 mb-3">Join a Team plan someone shared with you.</p>
            <div className="flex gap-2">
              <label htmlFor="team-code" className="sr-only">
                Team code
              </label>
              <input
                id="team-code"
                value={teamCodeInput}
                onChange={(e) => setTeamCodeInput(e.target.value.toUpperCase())}
                placeholder="TEAM-XXXXXXXX"
                className="flex-1 text-sm px-3 py-2 border border-white/[0.07] rounded-xl bg-forge-950/60 text-forge-100 font-mono outline-none placeholder:text-forge-600 focus:border-accent/60 focus:ring-2 focus:ring-accent/10 transition-all"
              />
              <button
                type="button"
                onClick={handleJoinTeam}
                className="text-[13px] px-4 py-2 rounded-xl bg-accent text-forge-950 border-none cursor-pointer font-semibold hover:bg-accent-hover transition-all active:scale-[0.98]"
              >
                Join
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  )
}
