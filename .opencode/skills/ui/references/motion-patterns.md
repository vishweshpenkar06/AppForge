# Motion Patterns Reference

## Core Principles

1. Motion communicates — it should answer "what just happened?" or "where is my focus?"
2. Duration scales with distance: small elements 100–150ms, full-page 400–500ms
3. Enter with ease-out, exit with ease-in, physical objects use spring
4. Always wrap in `prefers-reduced-motion` guard

## Reduced Motion Guard (copy this once per project)

```tsx
// hooks/useReducedMotion.ts
import { useEffect, useState } from "react";

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}
```

## Framer Motion Recipes

### Fade-in (page sections, content areas)
```tsx
const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: "easeOut" },
};

<motion.div {...fadeIn}>...</motion.div>
```

### Staggered list (cards, rows, grid items)
```tsx
const container = {
  animate: { transition: { staggerChildren: 0.06 } },
};
const item = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
};

<motion.ul variants={container} animate="animate">
  {items.map(i => <motion.li key={i.id} variants={item} />)}
</motion.ul>
```

### Modal / Drawer (physical spring)
```tsx
const modal = {
  initial:  { opacity: 0, scale: 0.96, y: 8 },
  animate:  { opacity: 1, scale: 1,    y: 0,
    transition: { type: "spring", stiffness: 320, damping: 30 } },
  exit:     { opacity: 0, scale: 0.96, y: 8,
    transition: { duration: 0.15, ease: "easeIn" } },
};
```

### Drawer from right
```tsx
const drawer = {
  initial:  { x: "100%" },
  animate:  { x: 0,      transition: { type: "spring", stiffness: 300, damping: 32 } },
  exit:     { x: "100%", transition: { duration: 0.2, ease: "easeIn" } },
};
```

### Button press feedback (CSS only)
```css
.btn { transition: transform 120ms ease, box-shadow 120ms ease; }
.btn:hover  { transform: translateY(-1px); box-shadow: var(--shadow-md); }
.btn:active { transform: translateY(0px) scale(0.97); box-shadow: var(--shadow-xs); }
```

### Skeleton pulse (loading state)
```tsx
// Matches the exact geometry of the real content
function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "animate-pulse rounded-md bg-bg-raised",
      className
    )} />
  );
}

// Usage — mirror the real layout
<div className="space-y-3">
  <Skeleton className="h-5 w-2/3" />
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-4/5" />
</div>
```

### Number counter (data dashboards)
```tsx
import { useSpring, animated } from "@react-spring/web";

function AnimatedNumber({ value }: { value: number }) {
  const { n } = useSpring({ n: value, config: { tension: 280, friction: 40 } });
  return <animated.span>{n.to(v => Math.floor(v).toLocaleString())}</animated.span>;
}
```
