import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-[calc(100vh-180px)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="space-y-6 rounded-[2rem] border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-sm">
          <div className="inline-flex rounded-full border border-accent/20 bg-accent-subtle px-3 py-1 text-xs uppercase tracking-[0.28em] text-accent-hover">
            AppForge access
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Welcome back.</h1>
          <p className="max-w-xl text-forge-300 leading-7">
            Sign in to continue compiling products, reviewing your generation history, and exporting validated blueprints.
          </p>
          <div className="grid gap-3 text-sm text-forge-200 sm:grid-cols-2">
            <InfoItem title="Protected workspace" text="Your generations are tied to your account." />
            <InfoItem title="Fast re-entry" text="Resume where you left off in the dashboard." />
          </div>
        </div>

        <div className="flex justify-center rounded-[2rem] border border-white/[0.06] bg-forge-800/95 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-sm">
          <SignIn routing="path" path="/sign-in" />
        </div>
      </div>
    </div>
  )
}

function InfoItem({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-forge-800/50 p-4">
      <p className="font-medium text-forge-50">{title}</p>
      <p className="mt-1 text-sm text-forge-400 leading-6">{text}</p>
    </div>
  )
}
