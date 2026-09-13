import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-[calc(100vh-56px)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="rounded-xl border border-white/[0.06] bg-forge-900/50 p-8">
          <div className="inline-flex rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 text-xs font-mono uppercase tracking-[0.15em] text-secondary">
            Join AppForge
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight m-0">Create your workspace.</h1>
          <p className="mt-4 text-forge-400 leading-7 m-0">
            Open a new account to generate app blueprints, track compile history, and inspect metrics in one place.
          </p>
          <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            <InfoItem title="One account" text="Use the same login for dashboard and compiler." />
            <InfoItem title="Ready to go" text="No setup loop. Start compiling immediately." />
          </div>
        </div>

        <div className="flex justify-center rounded-xl border border-white/[0.06] bg-forge-900 p-6 shadow-2xl shadow-black/40">
          <SignUp routing="path" path="/sign-up" />
        </div>
      </div>
    </div>
  )
}

function InfoItem({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-forge-800/50 p-4">
      <p className="font-medium text-forge-100 m-0">{title}</p>
      <p className="mt-1 text-sm text-forge-400 leading-6 m-0">{text}</p>
    </div>
  )
}
