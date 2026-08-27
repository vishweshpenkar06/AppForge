import { EvalDashboard } from '@/components/eval-dashboard'

export const metadata = {
  title: 'Evaluation — AppForge',
  description: 'System reliability evaluation dashboard',
}

export default function EvalPage() {
  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-8 md:py-12">
      <EvalDashboard />
    </div>
  )
}
