# Example: Audit Mode Output

**Prompt:** `/ui audit` on a basic dashboard page

---

## UI Audit Report

### Score: 5.5 / 10

| Category           | Score | Notes |
|--------------------|-------|-------|
| Visual Hierarchy   |  5/10 | Primary action not visually distinct from secondary actions |
| Typography         |  6/10 | Line-height too tight on body copy (1.4 → should be 1.6+) |
| Depth & Layering   |  4/10 | Cards use flat `border-gray-200`, no shadow hierarchy |
| Interactive States |  4/10 | Buttons have hover but no active/focus-visible states |
| Responsiveness     |  7/10 | Grid collapses well but sidebar overlaps on 768px breakpoint |
| Accessibility      |  5/10 | Icon buttons missing `aria-label`, form inputs missing `for` |
| Motion             |  6/10 | No loading states; existing transitions are abrupt (no ease) |

### Top 3 improvements (highest ROI first):

**1. [Depth & Layering]** — Cards read as flat panels. Add a layered shadow and a hairline border.

Before:
```tsx
<div className="border border-gray-200 rounded-lg p-4">
```

After:
```tsx
<div className="border border-black/8 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
```

**2. [Interactive States]** — Primary button is missing `active` scale and `focus-visible` ring. Keyboard users get no feedback.

Before:
```tsx
<button className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded">
```

After:
```tsx
<button className="bg-brand text-white hover:bg-brand-hover active:scale-95 px-4 py-2 rounded-md
  transition-all duration-150
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2
  disabled:opacity-50 disabled:pointer-events-none">
```

**3. [Accessibility]** — Icon-only buttons have no accessible label. Screen readers announce "button" with no context.

Before:
```tsx
<button><TrashIcon /></button>
```

After:
```tsx
<button aria-label="Delete item"><TrashIcon aria-hidden="true" /></button>
```
