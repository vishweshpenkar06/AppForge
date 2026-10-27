# Visual Fidelity Deep-Dives

## Shadows

A single `box-shadow` looks flat. Layer two: one tight and dark for depth, one wide and soft for ambience.

```css
/* Flat — avoid */
box-shadow: 0 4px 6px rgba(0,0,0,0.1);

/* Layered — use this */
box-shadow:
  0 1px 3px  rgba(0, 0, 0, 0.12),
  0 4px 12px rgba(0, 0, 0, 0.08);

/* Elevated panel */
box-shadow:
  0 2px 4px  rgba(0, 0, 0, 0.10),
  0 8px 24px rgba(0, 0, 0, 0.08),
  0 0  0 1px rgba(0, 0, 0, 0.04);   /* hairline border via shadow */
```

For dark themes, increase opacity (shadows need to be heavier to read on dark surfaces):
```css
box-shadow:
  0 1px 3px  rgba(0, 0, 0, 0.5),
  0 4px 12px rgba(0, 0, 0, 0.4);
```

## Borders

Use `0.5px` for hairline separators. Pair with opacity instead of hardcoded grey to stay theme-compatible.

```css
/* Avoid */
border: 1px solid #e5e7eb;

/* Use */
border: 1px solid rgba(0, 0, 0, 0.08);       /* light */
border: 1px solid rgba(255, 255, 255, 0.08);  /* dark */

/* Tailwind equivalents */
className="border border-black/8 dark:border-white/8"
```

For top-only separator (list items, table rows):
```css
border-top: 0.5px solid rgba(0, 0, 0, 0.06);
```

## Glassmorphism

Three mandatory properties. All three together, or none.
```css
.glass {
  background:    rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  border:        1px solid rgba(255, 255, 255, 0.3);
}

/* Dark variant */
.glass-dark {
  background:    rgba(15, 17, 23, 0.75);
  backdrop-filter: blur(16px) saturate(150%);
  border:        1px solid rgba(255, 255, 255, 0.08);
}
```

Tailwind:
```
className="bg-white/70 dark:bg-zinc-900/75 backdrop-blur-xl border border-white/30 dark:border-white/8"
```

## Typography Scale in Practice

```css
/* Hero headline */
font-size: clamp(2rem, 5vw, 4rem);
font-weight: 700;
letter-spacing: -0.04em;
line-height: 1.1;

/* Section heading */
font-size: 1.5rem;   /* 24px */
font-weight: 600;
letter-spacing: -0.02em;
line-height: 1.3;

/* Body */
font-size: 1rem;
font-weight: 400;
letter-spacing: 0;
line-height: 1.7;

/* Caption / label */
font-size: 0.75rem;
font-weight: 500;
letter-spacing: 0.06em;
text-transform: uppercase;
color: var(--color-text-muted);
```

## Focus Rings

Never remove focus rings without a replacement. Use a brand-coloured ring with offset.

```css
/* Remove the default, add a better one */
:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-bg-base), 0 0 0 4px var(--color-brand);
}
```

Tailwind:
```
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2
```

## Colour Contrast Quick Reference

| Text / Background | Min ratio | Pass? |
|---|---|---|
| #111827 on #ffffff | 16.7:1 | AAA |
| #374151 on #ffffff |  9.7:1 | AAA |
| #6b7280 on #ffffff |  4.6:1 | AA (body) |
| #9ca3af on #ffffff |  2.7:1 | FAIL — decorative only |
| white on #6366f1 brand |  4.5:1 | AA |
| white on #818cf8 (dark brand) | 3.0:1 | AA large text only |

Always verify with `color-contrast()` CSS function or a contrast checker before shipping.
