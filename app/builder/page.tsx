import BuilderEditor from '@/components/builder/editor'

export const metadata = {
  title: 'Builder — AppForge',
}

export default function BuilderPage() {
  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">AppForge Builder</h1>
          <p className="text-sm text-forge-400">Describe your product and build a reproducible application blueprint.</p>
        </div>

        <BuilderEditor />
      </div>
    </main>
  )
}
