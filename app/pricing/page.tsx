'use client'

import { useState } from 'react'

const PLANS = [
  {
    name: 'Free',
    monthlyPrice: '$0',
    yearlyPrice: '$0',
    period: 'forever',
    description: 'For trying out the compiler',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
      </svg>
    ),
    features: ['10 compiles / month', 'Fast mode only', 'JSON export', '7-day history', '1 seat', 'Community support'],
    cta: 'Current plan',
    highlighted: false,
  },
  {
    name: 'Pro',
    monthlyPrice: '$19',
    yearlyPrice: '$15',
    period: '/mo',
    description: 'For shipping real products',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--text-accent)" stroke="var(--text-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
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
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    features: ['Unlimited compiles', 'All modes incl. Precise', 'Full ZIP bundle export', 'Unlimited history', '5 seats', 'Priority support', 'Team sharing'],
    cta: 'Upgrade to Team',
    highlighted: false,
  },
]

const COMPARISON = [
  { feature: 'Compiles / month', free: '10', pro: '100', team: 'Unlimited' },
  { feature: 'Modes', free: 'Fast', pro: 'Fast + Balanced', team: 'All' },
  { feature: 'JSON export', free: true, pro: true, team: true },
  { feature: 'SQL / Express / React export', free: false, pro: true, team: true },
  { feature: 'ZIP bundle export', free: false, pro: true, team: true },
  { feature: 'History retention', free: '7 days', pro: '90 days', team: 'Unlimited' },
  { feature: 'Seats', free: '1', pro: '1', team: '5' },
  { feature: 'Support', free: 'Community', pro: 'Email', team: 'Priority' },
  { feature: 'Output detail level', free: 'Minimal', pro: 'Maximum', team: 'Standard' },
]

export default function PricingPage() {
  const [yearly, setYearly] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)
  const [teamCodeInput, setTeamCodeInput] = useState('')

  async function handleUpgrade(planName: string) {
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
    <div style={{ minHeight:'100vh' }}>
      <div style={{ maxWidth:900, margin:'0 auto', padding:'32px 24px 60px', textAlign:'center' }}>
        <p style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>Pricing</p>
        <h1 style={{ fontSize:32, fontWeight:700, color:'var(--text-primary)', marginBottom:8 }}>Simple, transparent pricing</h1>
        <p style={{ fontSize:14, color:'var(--text-secondary)', marginBottom:24 }}>The compiler is always free to try. Upgrade when you need more.</p>

        {/* Toggle */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:4, borderRadius:999, background:'var(--surface-1)', border:'1px solid var(--border)', marginBottom:40 }}>
          <button onClick={() => setYearly(false)} style={{ padding:'6px 16px', borderRadius:999, fontSize:12, fontWeight:500, border:'none', cursor:'pointer', transition:'all 0.15s',
            background: !yearly ? 'var(--fill-accent)' : 'transparent', color: !yearly ? '#fff' : 'var(--text-muted)' }}>Monthly</button>
          <button onClick={() => setYearly(true)} style={{ padding:'6px 16px', borderRadius:999, fontSize:12, fontWeight:500, border:'none', cursor:'pointer', transition:'all 0.15',
            background: yearly ? 'var(--fill-accent)' : 'transparent', color: yearly ? '#fff' : 'var(--text-muted)' }}>Yearly <span style={{ fontSize:10, opacity:0.7 }}>-20%</span></button>
        </div>

        {/* Cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16, textAlign:'left' }}>
          {PLANS.map((plan) => (
            <div key={plan.name} style={{
              background:'var(--surface-1)', borderRadius:12, padding:'24px 20px', position:'relative',
              border: plan.highlighted ? '2px solid var(--fill-accent)' : '1px solid var(--border)',
              transition:'transform 0.2s, border-color 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = plan.highlighted ? 'var(--fill-accent)' : 'var(--border-strong)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = plan.highlighted ? 'var(--fill-accent)' : 'var(--border)' }}
            >
              {plan.highlighted && (
                <div style={{ position:'absolute', top:-10, left:20, background:'var(--fill-accent)', color:'#fff', fontSize:11, fontWeight:500, padding:'2px 10px', borderRadius:20 }}>Most popular</div>
              )}
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                {plan.icon}
                <p style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)', margin:0 }}>{plan.name}</p>
              </div>
              <p style={{ fontSize:12, color:'var(--text-muted)', margin:'0 0 16px' }}>{plan.description}</p>
              <div style={{ display:'flex', alignItems:'baseline', gap:2, marginBottom:20 }}>
                <span style={{ fontSize:32, fontWeight:700, color:'var(--text-primary)' }}>{yearly ? plan.yearlyPrice : plan.monthlyPrice}</span>
                <span style={{ fontSize:13, color:'var(--text-muted)' }}>{plan.period}</span>
              </div>
              {yearly && plan.monthlyPrice !== '$0' && (
                <p style={{ fontSize:11, color:'var(--text-accent)', margin:'-12px 0 16px', fontFamily:'var(--font-mono)' }}>
                  Billed yearly · Save {plan.name === 'Pro' ? '$48' : '$120'}
                </p>
              )}
              <button onClick={() => handleUpgrade(plan.name)} style={{
                width:'100%', padding:'9px', borderRadius:'var(--radius)', fontSize:13, fontWeight:500, marginBottom:20, cursor:'pointer',
                background: plan.highlighted ? 'var(--fill-accent)' : 'transparent',
                color: plan.highlighted ? '#fff' : 'var(--text-secondary)',
                border: plan.highlighted ? 'none' : '1px solid var(--border)',
              }}>{plan.cta}</button>
              <div style={{ borderTop:'1px solid var(--border)', paddingTop:16, display:'flex', flexDirection:'column', gap:10 }}>
                {plan.features.map((f) => (
                  <div key={f} style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                    <span style={{ color:'var(--text-accent)', fontSize:12, marginTop:1 }}>✓</span>
                    <span style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.5 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Comparison toggle */}
        <button onClick={() => setShowComparison(!showComparison)} style={{ marginTop:32, fontSize:12, color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font-mono)' }}>
          {showComparison ? 'Hide comparison ↑' : 'See full feature comparison ↓'}
        </button>

        {showComparison && (
          <div style={{ marginTop:24, borderRadius:'var(--radius)', border:'1px solid var(--border)', overflow:'hidden', textAlign:'left' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ background:'var(--surface-1)' }}>
                  <th style={{ padding:'12px 16px', textAlign:'left', color:'var(--text-muted)', fontWeight:500, borderBottom:'1px solid var(--border)' }}>Feature</th>
                  <th style={{ padding:'12px 16px', textAlign:'center', color:'var(--text-muted)', fontWeight:500, borderBottom:'1px solid var(--border)' }}>Free</th>
                  <th style={{ padding:'12px 16px', textAlign:'center', color:'var(--text-accent)', fontWeight:500, borderBottom:'1px solid var(--border)' }}>Pro</th>
                  <th style={{ padding:'12px 16px', textAlign:'center', color:'var(--text-muted)', fontWeight:500, borderBottom:'1px solid var(--border)' }}>Team</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={row.feature} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--surface-1)' }}>
                    <td style={{ padding:'10px 16px', color:'var(--text-secondary)', borderBottom:'1px solid var(--border)' }}>{row.feature}</td>
                    {(['free', 'pro', 'team'] as const).map((plan) => (
                      <td key={plan} style={{ padding:'10px 16px', textAlign:'center', borderBottom:'1px solid var(--border)',
                        color: plan === 'pro' ? 'var(--text-accent)' : 'var(--text-secondary)' }}>
                        {typeof row[plan] === 'boolean' ? (row[plan] ? '✓' : '—') : String(row[plan])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Team code input */}
        <div style={{ maxWidth:400, margin:'40px auto 0', padding:20, background:'var(--surface-1)', border:'1px solid var(--border)', borderRadius:'var(--radius)', textAlign:'left' }}>
          <p style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', margin:'0 0 4px' }}>Have a team code?</p>
          <p style={{ fontSize:12, color:'var(--text-muted)', margin:'0 0 12px' }}>Join a Team plan someone shared with you.</p>
          <div style={{ display:'flex', gap:8 }}>
            <input
              value={teamCodeInput}
              onChange={(e) => setTeamCodeInput(e.target.value.toUpperCase())}
              placeholder="TEAM-XXXXXXXX"
              style={{ flex:1, fontSize:13, padding:'8px 10px', border:'1px solid var(--border)', borderRadius:'var(--radius)', background:'var(--surface-2)', color:'var(--text-primary)', fontFamily:'var(--font-mono)', outline:'none' }}
            />
            <button onClick={handleJoinTeam} style={{ fontSize:13, padding:'8px 16px', borderRadius:'var(--radius)', background:'var(--fill-accent)', color:'#fff', border:'none', cursor:'pointer', fontWeight:500 }}>Join</button>
          </div>
        </div>
      </div>

      {/* Toast notification */}
      {notification && (
        <div style={{
          position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)',
          background:'var(--surface-2)', border:'1px solid var(--text-success)',
          borderRadius:'var(--radius)', padding:'12px 20px', display:'flex', alignItems:'center', gap:8,
          boxShadow:'0 4px 16px rgba(0,0,0,0.2)', zIndex:100,
        }}>
          <span style={{ color:'var(--text-success)' }}>✓</span>
          <span style={{ fontSize:13, color:'var(--text-primary)' }}>{notification}</span>
        </div>
      )}
    </div>
  )
}
