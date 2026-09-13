import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-[calc(100vh-56px)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="space-y-6 rounded-xl border border-white/[0.06] bg-forge-900/50 p-8">
          <div className="inline-flex rounded-full border border-accent/20 bg-accent-subtle px-3 py-1 text-xs font-mono uppercase tracking-[0.15em] text-accent">
            AppForge access
          </div>
          <h1 className="text-3xl font-bold tracking-tight m-0">Welcome back.</h1>
          <p className="text-forge-400 leading-7 m-0">
            Sign in to continue compiling products, reviewing your generation history, and exporting validated blueprints.
          </p>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <InfoItem title="Protected workspace" text="Your generations are tied to your account." />
            <InfoItem title="Fast re-entry" text="Resume where you left off in the dashboard." />
          </div>
        </div>

        <div className="flex justify-center rounded-xl border border-white/[0.06] bg-forge-900 p-6 shadow-2xl shadow-black/40">
          <SignIn routing="path" path="/sign-in" />
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
