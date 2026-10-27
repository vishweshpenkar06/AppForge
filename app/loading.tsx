export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-accent/25 blur-xl animate-pulse" aria-hidden />
          <div className="relative w-11 h-11 rounded-2xl bg-forge-900 border border-accent/25 flex items-center justify-center">
            <span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
        <p className="text-[12px] font-mono text-forge-500 m-0">compiling route…</p>
      </div>
    </div>
  )
}
