export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-48px)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-forge-400">Loading...</p>
      </div>
    </div>
  )
}
