import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="relative min-h-[calc(100vh-56px)] px-4 py-10 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute inset-0 bg-grid-fade opacity-40" aria-hidden />
      <div className="absolute inset-0 aurora opacity-50" aria-hidden />
      <div className="relative mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="space-y-6 rounded-2xl border border-white/[0.07] bg-forge-900/60 p-8 backdrop-blur-sm">
          <div className="inline-flex rounded-full border border-accent/25 bg-accent-subtle px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-accent-hover">
            AppForge access
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight m-0 text-balance">
            Welcome <span className="text-gradient-emerald">back.</span>
          </h1>
          <p className="text-forge-400 leading-7 m-0">
            Sign in to continue compiling products, reviewing your generation history, and exporting validated blueprints.
          </p>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <InfoItem title="Protected workspace" text="Your generations are tied to your account." />
            <InfoItem title="Fast re-entry" text="Resume where you left off in the dashboard." />
          </div>
        </div>

        <div className="flex justify-center rounded-2xl border border-white/[0.07] bg-forge-900 p-6 shadow-[0_30px_90px_-30px_rgba(0,0,0,0.9)]">
          <SignIn routing="path" path="/sign-in" />
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
