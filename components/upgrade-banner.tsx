'use client'

import Link from 'next/link'

export function UpgradeBanner({ message, currentPlan }: { message: string; currentPlan: string }) {
  return (
    <div style={{
      margin:'12px 20px', padding:'12px 14px',
      background:'var(--bg-warning)', border:'1px solid var(--text-warning)',
      borderRadius:'var(--radius)', display:'flex', alignItems:'center', gap:10,
    }}>
      <span style={{ fontSize:16 }}>⚡</span>
      <div style={{ flex:1 }}>
        <p style={{ fontSize:12, color:'var(--text-warning)', fontWeight:600, margin:0 }}>{message}</p>
        <p style={{ fontSize:11, color:'var(--text-secondary)', margin:'2px 0 0' }}>You&apos;re on the {currentPlan} plan.</p>
      </div>
      <Link href="/pricing" style={{
        fontSize:12, fontWeight:500, padding:'6px 12px',
        background:'var(--fill-accent)', color:'#fff',
        borderRadius:'var(--radius)', textDecoration:'none', whiteSpace:'nowrap',
      }}>Upgrade →</Link>
    </div>
  )
}
