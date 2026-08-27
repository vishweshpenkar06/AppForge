# AppForge UI/UX Audit & Design System

## Part 1: Before-State Findings

### 1.1 Dual Conflicting Color Systems
The codebase has **two parallel CSS variable systems** that never converge:
- `app/globals.css` defines custom vars: `--surface-0: #09090b`, `--fill-accent: #6366f1` (indigo), `--text-accent: #818cf8`
- `styles/globals.css` defines shadcn oklch vars: `--primary: oklch(0.985 0 0)` (white), `--accent: oklch(0.269 0 0)` (dark gray)
- `components/ui/button.tsx` default variant uses `bg-sky-400` — a third, unrelated color
- `components/builder/editor.tsx` uses hardcoded `text-zinc-400`, `border-white/8`
- `generated/[gid]/page.tsx` uses `text-sky-300`, `bg-sky-500/15`, `text-zinc-500`

**Result**: The app has 3+ accent colors (indigo, sky, zinc-gray) depending on which component you're looking at. No consistent brand color.

### 1.2 No Responsive Breakpoints
Every page uses fixed pixel values via inline `style={}`:
- `layout.tsx` nav: `padding:'0 24px'`, `height:48` — no mobile adaptation
- `app/page.tsx` metrics: `gridTemplateColumns:'repeat(3, 1fr)'` — collapses badly on mobile
- `app/compiler/page.tsx`: sidebar `width:260` — no drawer/sheet on mobile
- `app/dashboard/page.tsx`: `gridTemplateColumns:'repeat(4, 1fr)'` for stat cards, `gridTemplateColumns:'1fr 320px'` for main layout — no mobile adaptation
- `app/pricing/page.tsx`: `gridTemplateColumns:'repeat(3, 1fr)'` — no mobile
- `app/demo/page.tsx`: `gridTemplateColumns:'1fr 1fr'` — no mobile
- The `use-mobile.ts` hook exists but is never used in any page

### 1.3 No Loading / Empty / Error States (Most Pages)
- `app/page.tsx`: No loading state, returns `null` while auth loads — blank screen
- `app/compiler/page.tsx`: Loading state is just plain text "Compiling through 6 pipeline stages..." — no skeleton or animation
- `app/dashboard/page.tsx`: Loading state is "Loading..." text in a centered div — no skeleton
- `app/demo/page.tsx`: No loading or error states at all
- `components/ExamplePrompts.tsx`: No empty state, no loading indication
- `components/metrics-dashboard.tsx`: Shows "—" dashes while loading — not terrible but not designed

### 1.4 No Keyboard Focus States
- Inline-styled buttons/links have no `:focus-visible` styles
- `textarea` in `compiler/page.tsx` has manual `onFocus/onBlur` for border color — should be CSS
- No skip-to-content link
- No focus ring on any interactive element using inline styles

### 1.5 Weak Visual Hierarchy
- **Compiler page**: The "Compile →" button and the example prompt buttons have similar visual weight. The primary action doesn't dominate.
- **Dashboard page**: "New Compilation" form competes with the history sidebar for attention. No clear primary action.
- **Pricing page**: The Pro plan is highlighted but the "Most popular" badge is small and positioned awkwardly at `top:-10`.
- **Hero section**: The badge, headline, video, CTAs, and tagline are all stacked without clear visual grouping.

### 1.6 Inconsistent Spacing Scale
Ad-hoc values across files:
- `12px`, `14px`, `16px`, `20px`, `24px`, `32px`, `40px`, `48px`, `64px`, `80px` — none on a deliberate 4px/8px grid
- `padding:'16px 20px'` (compiler sidebar header), `padding:24` (compiler content), `padding:'12px 20px'` (upgrade banner)
- Some components use `gap:6`, `gap:8`, `gap:10`, `gap:12` inconsistently

### 1.7 Weak Typography Scale
Font sizes used: `10, 11, 12, 13, 14, 16, 20, 24, 28, 32, 44, 52` — 12 different sizes with no deliberate scale.
- `10px` used for labels, `11px` for descriptions, `12px` for body — these are too small and too close together
- Headline sizes jump from 28 to 32 to 44 to 52 with no clear progression
- `font-mono` used everywhere (labels, body, buttons) — dilutes its purpose as a code/technical font

### 1.8 Copy Issues
- `auth-controls.tsx`: "Get started" — vague, should say "Start compiling"
- `generation-form.tsx`: "Generate Application Config" — too formal, should be "Generate app"
- `compiler/page.tsx`: "Compile →" — inconsistent with "Generate" used elsewhere
- `loading-spinner.tsx`: "Loading..." — generic
- `hero.tsx`: "Natural language compiler" badge — accurate but could be sharper
- `hero.tsx` tagline: "No credit card · Free tier · NVIDIA NIM powered" — filler

### 1.9 Pipeline Visualization Undersold
The 6-stage pipeline IS the product's distinguishing feature, but:
- On the landing page it's a thin strip with small 40px circles
- On the compiler page it's a tiny sidebar section with 20px circles
- No stage names, descriptions, or timing shown during active compilation
- The animated beam is barely visible

### 1.10 Mixed Styling Approaches
- 5 different styling methods: inline `style={}`, Tailwind utilities, `cn()` utility, CSS custom properties, hardcoded hex
- No consistency in which approach is used where
- Makes the codebase hard to maintain and the visual output inconsistent

---

## Part 2: Design System Plan

### 2.1 Color Palette

| Token | Hex | Purpose |
|-------|-----|---------|
| `forge-950` | `#08080c` | Deepest background |
| `forge-900` | `#0e0e14` | Primary surface |
| `forge-800` | `#16161e` | Elevated surface |
| `forge-700` | `#1e1e28` | Cards, panels |
| `forge-600` | `#2a2a36` | Borders |
| `forge-500` | `#3a3a48` | Strong borders |
| `forge-400` | `#6e6e80` | Muted text |
| `forge-300` | `#9e9eb0` | Secondary text |
| `forge-200` | `#ccccdd` | Primary text |
| `forge-50` | `#eeeef4` | Bright text |
| `indigo-500` | `#6366f1` | Primary accent |
| `indigo-400` | `#818cf8` | Accent hover / text on dark |
| `indigo-300` | `#a5b4fc` | Light accent |
| `indigo-600` | `#4f46e5` | Accent pressed |
| `teal-500` | `#14b8a6` | Secondary accent (pipeline stages) |
| `teal-400` | `#2dd4bf` | Secondary accent hover |
| `emerald-500` | `#10b981` | Success |
| `rose-500` | `#f43f5e` | Error / destructive |
| `amber-500` | `#f59e0b` | Warning |

**Palette rationale**: Indigo reads as technical/confident (used by Linear, Vercel, etc.). Teal as secondary differentiates from generic blue-saas. The neutral scale is deliberately cool-toned to feel precise, not warm/inviting.

### 2.2 Type Scale

| Class | Size | Weight | Usage |
|-------|------|--------|-------|
| `text-xs` | 12px | 400 | Labels, meta |
| `text-sm` | 14px | 400 | Body, descriptions |
| `text-base` | 16px | 400 | Body emphasis |
| `text-lg` | 18px | 500 | Subheadings |
| `text-xl` | 20px | 600 | Section titles |
| `text-2xl` | 24px | 700 | Page titles |
| `text-3xl` | 30px | 700 | Hero subheading |
| `text-4xl` | 36px | 700 | Hero headline |

**Font usage**:
- `font-sans` (Geist): All UI text
- `font-mono` (Geist Mono): Code blocks, pipeline stage numbers, technical labels, status badges

### 2.3 Spacing Scale (4px grid)

`1=4px, 2=8px, 3=12px, 4=16px, 5=20px, 6=24px, 8=32px, 10=40px, 12=48px, 16=64px, 20=80px`

All padding, margin, gap values will be multiples of 4px. No more `14px`, `13px`, etc.

### 2.4 Signature Element: Live Pipeline Visualization

The pipeline is AppForge's differentiator. It becomes the centerpiece:

- **Landing page**: Full-width pipeline strip with larger stage circles (56px), connecting lines, stage labels, and the beam animation. On mobile, it stacks vertically with a connecting line.
- **Compiler page**: When compiling, the sidebar pipeline expands to show each stage name, status icon, and elapsed time. Active stage pulses. Completed stages show checkmarks with green background.
- The pipeline uses teal (`#14b8a6`) for stage indicators to differentiate from the indigo accent used elsewhere.

### 2.5 Button Hierarchy

- **Primary**: Indigo-500 background, white text, subtle shadow. Used once per screen.
- **Secondary**: Transparent with forge-600 border, forge-300 text.
- **Ghost**: No border, forge-400 text, subtle hover background.
- **Danger**: Rose-500 background for destructive actions.

### 2.6 Focus States

All interactive elements get:
```css
focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none
```

### 2.7 Loading / Empty / Error States

- **Loading**: Skeleton shimmer blocks matching the card/panel they replace
- **Empty**: Directional text ("Describe your app to start compiling") with a subtle icon, not "No data"
- **Error**: Rose-tinted card with error message + retry action, explains what happened

---

## Part 3: Self-Critique

**"Would this look like a generic AI-generated template?"**

Checklist:
- [ ] Distinctive color palette (indigo + teal, not default blue)
- [ ] Deliberate type scale with mono for code/technical content
- [ ] Pipeline as signature visual moment (numbered stages with animation)
- [ ] Consistent 4px spacing grid
- [ ] Clear button hierarchy (one primary per screen)
- [ ] Active voice copy ("Generate app" not "Submit")
- [ ] No filler text
- [ ] Responsive breakpoints
- [ ] Keyboard focus states
- [ ] Loading/empty/error states

**Potential generic traps to avoid**:
- Don't make every card the same rounded-xl with border — vary elevation
- Don't use gradient text everywhere — reserve for the headline only
- Don't add unnecessary animations — the pipeline beam is the one signature animation
- Don't over-use the indigo accent — it's for primary actions only, not every label
- Keep the pipeline visualization unique to this product

---

## Part 4: Implementation Order

1. Unify `app/globals.css` — single CSS variable system, define the palette
2. Update `styles/globals.css` — align shadcn vars with the new palette
3. Update `button.tsx` — change sky-400 to indigo-500
4. Update `layout.tsx` — convert nav to Tailwind, add responsive
5. Update `Hero.tsx` — bigger pipeline strip, better hierarchy
6. Update `app/page.tsx` — landing page with pipeline as centerpiece
7. Update `compiler/page.tsx` — sidebar, tabs, pipeline visualization
8. Update `dashboard/page.tsx` — stat cards, form, history
9. Update `pricing/page.tsx` — cards, comparison table, responsive
10. Update `demo/page.tsx` — tabs, split view
11. Update `generated/[gid]/page.tsx` — fix color inconsistencies
12. Update `sign-in` and `sign-up` pages
13. Update `builder/page.tsx` and `builder/editor.tsx`
14. Update all components (forms, status, history, etc.)
15. Final review — contrast ratios, focus states, copy pass
