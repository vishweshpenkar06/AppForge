import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="relative min-h-[calc(100vh-56px)] px-4 py-10 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute inset-0 bg-grid-fade opacity-40" aria-hidden />
      <div className="absolute inset-0 aurora opacity-50" aria-hidden />
      <div className="relative mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="rounded-2xl border border-white/[0.07] bg-forge-900/60 p-8 backdrop-blur-sm">
          <div className="inline-flex rounded-full border border-secondary/25 bg-secondary/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-secondary">
            Join AppForge
          </div>
          <h1 className="mt-5 text-3xl md:text-4xl font-bold tracking-tight m-0 text-balance">
            Create your <span className="text-gradient-emerald">workspace.</span>
          </h1>
          <p className="mt-4 text-forge-400 leading-7 m-0">
            Open a new account to generate app blueprints, track compile history, and inspect metrics in one place.
          </p>
          <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            <InfoItem title="One account" text="Use the same login for dashboard and compiler." />
            <InfoItem title="Ready to go" text="No setup loop. Start compiling immediately." />
          </div>
        </div>

        <div className="flex justify-center rounded-2xl border border-white/[0.07] bg-forge-900 p-6 shadow-[0_30px_90px_-30px_rgba(0,0,0,0.9)]">
          <SignUp routing="path" path="/sign-up" />
        </div>
      </div>
    </div>
  )
}

function InfoItem({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <p className="font-medium text-forge-100 m-0 text-[13px]">{title}</p>
      <p className="mt-1 text-[12px] text-forge-400 leading-6 m-0">{text}</p>
    </div>
  )
}
