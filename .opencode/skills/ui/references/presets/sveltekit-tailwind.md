# Preset: sveltekit-tailwind

Detected when `package.json` contains `@sveltejs/kit` + `tailwindcss`.

## Path Map

| Resource | Path |
|---|---|
| Components (primitives) | `src/lib/components/ui/` |
| Components (features) | `src/lib/components/features/` |
| Utils | `src/lib/utils.ts` |
| Global styles | `src/app.css` |
| Tailwind config | `tailwind.config.ts` |

## Image Component

Native `<img>` with `loading="lazy"`. Use `@sveltejs/enhanced-img` if present:
```svelte
<enhanced:img src="/hero.jpg" alt="Hero" />
```

## cn() Utility

```ts
// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## Animation Library

Svelte's built-in transitions are preferred over Framer Motion:

```svelte
<script>
  import { fly, fade, scale } from "svelte/transition";
  import { spring } from "svelte/motion";
</script>

<!-- Fade in on mount -->
<div transition:fade={{ duration: 200 }}>content</div>

<!-- Fly in from below -->
<div in:fly={{ y: 12, duration: 250, easing: cubicOut }}>content</div>
```

Reduced motion:
```svelte
<script>
  import { prefersReducedMotion } from "@sveltejs/kit";
  // or use matchMedia directly
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
</script>
```

## Component Pattern

Svelte SFCs with TypeScript and `$$Props`:

```svelte
<!-- src/lib/components/ui/Button.svelte -->
<script lang="ts">
  import { cn } from "$lib/utils";

  export let variant: "primary" | "secondary" | "ghost" = "primary";
  export let size: "sm" | "md" | "lg" = "md";
  export let disabled = false;
  export let loading = false;

  let className = "";
  export { className as class };
</script>

<button
  {disabled}
  class={cn(base, variants[variant], sizes[size], className)}
  on:click
>
  <slot />
</button>
```

Export from barrel file:
```ts
// src/lib/index.ts
export { default as Button } from "./components/ui/Button.svelte";
```

## Tailwind Config

```ts
import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: { extend: {} },
  plugins: [],
} satisfies Config;
```

## Global CSS

```css
/* src/app.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root { /* tokens */ }
.dark { /* dark tokens */ }
```

Import in `src/routes/+layout.svelte`:
```svelte
<script>
  import "../app.css";
</script>
```
