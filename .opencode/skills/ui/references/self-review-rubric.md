# Self-Review Rubric

The skill runs this checklist silently before delivering any component from `build` mode.

## Scoring

| Result | Action |
|---|---|
| 9 / 9 | Deliver as-is |
| 7–8 / 9 | Fix failing items silently, then deliver |
| < 7 / 9 | Tell the user what is being fixed and why, deliver corrected version |

## The 9-Point Checklist

**[ ] 1. Tokens only**
No hardcoded hex values. No arbitrary Tailwind values (e.g. `w-[347px]`) unless a pixel-perfect spec requires it and that requirement is stated. All colours, spacing, radius, and shadow reference CSS custom properties or named Tailwind tokens.

**[ ] 2. All four interactive states**
Every element the user can click, focus, or interact with defines:
- `hover` — colour shift or transform
- `active` / `pressed` — scale-down or deeper shadow
- `focus-visible` — visible ring using `ring-2 ring-offset-2 ring-brand`
- `disabled` — `opacity-50 cursor-not-allowed pointer-events-none`

No exceptions. Pure display elements (headings, paragraphs, decorative icons) are exempt.

**[ ] 3. Skeleton loader included**
Component includes a skeleton variant using `animate-pulse` with geometry that matches the real layout. Mark `N/A` only for pure primitives (Badge, Divider, Avatar) — state the reason inline.

**[ ] 4. Empty state included**
Component handles the empty/zero-data condition. Minimum: icon + heading. Optional: description + CTA. Mark `N/A` only for components that cannot be empty by nature — state the reason inline.

**[ ] 5. WCAG AA contrast verified**
All text colours meet WCAG AA:
- Body text: 4.5:1 minimum contrast ratio
- Large text (18px+ or 14px+ bold): 3:1 minimum
- Interactive element labels: 4.5:1
Flag any token combination that fails and substitute a passing value.

**[ ] 6. Responsive — at least two breakpoints**
Component defines explicit behaviour at `sm` (mobile) and `lg` (desktop) minimum. No fixed pixel widths on containers. Flex/grid collapse strategy is stated, not implied.

**[ ] 7. Reduced motion guard**
Any animation, transition beyond `duration-150`, or `animate-*` class is wrapped in a `prefers-reduced-motion` check — either via the `useReducedMotion` hook or a CSS `@media (prefers-reduced-motion: reduce)` block.

**[ ] 8. Written to disk at correct path**
Component file exists on disk at the path defined by the active preset. The `Write` or `Edit` tool was called — the component is not only shown in chat.

**[ ] 9. DESIGN.md updated**
The component has been added to the `## Components` inventory in `DESIGN.md` with its file path. A `## Decisions` entry has been appended with the date, component name, tokens used, and any notable choices.

## Exemptions

The following do not require skeleton or empty states (items 3 and 4):
- Pure primitives: Button, Badge, Avatar, Divider, Spinner, Icon
- Layout wrappers: Container, Section, Grid
- Typography: Heading, Paragraph, Label, Caption

All other exemptions must be stated explicitly in a comment inside the component file.
