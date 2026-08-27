'use client'

import Link from 'next/link'

export function UpgradeBanner({ message, currentPlan }: { message: string; currentPlan: string }) {
  return (
    <div className="mx-5 my-3 p-3 rounded-xl bg-warning-subtle border border-warning/30 flex items-center gap-3">
      <div className="w-4 h-4 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
        <span className="text-warning text-[10px]">!</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-warning m-0">{message}</p>
        <p className="text-[11px] text-forge-300 m-0 mt-0.5">You&apos;re on the {currentPlan} plan.</p>
      </div>
      <Link href="/pricing" className="text-xs font-medium px-3 py-1.5 bg-accent text-white rounded-lg no-underline whitespace-nowrap hover:bg-accent-hover transition-colors focus-visible:ring-2 focus-visible:ring-accent/40">
        Upgrade →
      </Link>
    </div>
  )
}
