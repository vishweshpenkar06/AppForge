# Preset: vite-react-tailwind

Detected when `package.json` contains `vite` + `react` + `tailwindcss` (no `next` or `@sveltejs/kit`).

## Path Map

| Resource | Path |
|---|---|
| Components (primitives) | `src/components/ui/` |
| Components (features) | `src/components/features/` |
| Hooks | `src/hooks/` |
| Utils | `src/lib/utils.ts` |
| Global styles | `src/styles/globals.css` |
| Tailwind config | `tailwind.config.ts` |

## Image Component

Native `<img>` with `loading="lazy"`. No `next/image` available:

```tsx
<img src="/hero.jpg" alt="Hero" loading="lazy" decoding="async" />
```

For optimised images, check for `vite-imagetools` or `@unpic/react` in `package.json`.

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

Framer Motion (check `package.json`, install if missing):
```bash
npm install framer-motion
```

## Component Pattern

Named exports with `forwardRef`. No framework-specific router — use React Router or TanStack Router if routing is needed:

```tsx
// src/components/ui/button.tsx
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  )
);
Button.displayName = "Button";
export { Button };
```

## Path Aliases

Check `vite.config.ts` for `resolve.alias`. If `@` alias is not configured, add it:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

Also update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  }
}
```

## Tailwind Config

```ts
import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
} satisfies Config;
```

## Global CSS

```css
/* src/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root { /* tokens */ }
.dark { /* dark tokens */ }
```

Import in `src/main.tsx`:
```tsx
import "./styles/globals.css";
```
