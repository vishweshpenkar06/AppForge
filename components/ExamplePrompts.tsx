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
          className="px-3 py-1.5 text-xs font-mono rounded-lg border border-[var(--bg-border)]
                     bg-[var(--bg-elevated)] text-[var(--text-muted)]
                     hover:border-[var(--accent-primary)] hover:text-[var(--text-primary)]
                     transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          {text}
        </button>
      ))}
    </div>
  )
}
