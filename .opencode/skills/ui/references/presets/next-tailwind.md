# Preset: next-tailwind

Detected when `package.json` contains `next` + `tailwindcss` but no `@shadcn/ui`.

## Path Map

| Resource | Path |
|---|---|
| Components (primitives) | `src/components/ui/` |
| Components (features) | `src/components/features/` |
| Hooks | `src/hooks/` |
| Utils | `src/lib/utils.ts` |
| Global styles | `src/app/globals.css` |
| Tailwind config | `tailwind.config.ts` |

## Image Component

```tsx
import Image from "next/image";
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

Framer Motion (check `package.json`, install if missing):
```bash
npm install framer-motion
```

## Component Export Pattern

Named exports with `forwardRef`. No shadcn dependency — build primitives from scratch:

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
    <button ref={ref} className={cn(variants[variant], sizes[size], base, className)} {...props} />
  )
);
Button.displayName = "Button";
export { Button };
```

## Routing

App Router. Pages in `src/app/`.

## Tailwind Config

```ts
import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
} satisfies Config;
```

## Global CSS Structure

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root { /* tokens */ }
.dark { /* dark tokens */ }
```
