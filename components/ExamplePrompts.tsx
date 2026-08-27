'use client'

const EXAMPLES = [
  'Build a task tracker with auth, projects, and drag-and-drop boards',
  'Build a recipe sharing app with user profiles, ratings, and search',
  'Build a simple CRM with contacts, deals pipeline, and activity log',
]

interface ExamplePromptsProps {
  onSelect: (prompt: string) => void
  disabled?: boolean
}

export function ExamplePrompts({ onSelect, disabled }: ExamplePromptsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {EXAMPLES.map((text) => (
        <button
          key={text}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(text)}
          className="px-3 py-1.5 text-xs font-mono rounded-lg border border-white/[0.06]
                     bg-forge-700 text-forge-400
                     hover:border-accent/40 hover:text-forge-200
                     transition-colors disabled:opacity-40 disabled:pointer-events-none
                     focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
        >
          {text}
        </button>
      ))}
    </div>
  )
}
