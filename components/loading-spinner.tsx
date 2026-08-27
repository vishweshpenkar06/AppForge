import { Spinner } from '@/components/ui/spinner'

export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <Spinner className="w-8 h-8" />
      <p className="text-forge-400">Loading...</p>
    </div>
  )
}
