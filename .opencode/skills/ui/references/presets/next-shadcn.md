# Preset: next-shadcn

Detected when `package.json` contains `next` + `tailwindcss` + `@shadcn/ui` (or `shadcn`).

## Path Map

| Resource | Path |
|---|---|
| Components (primitives) | `src/components/ui/` |
| Components (features) | `src/components/features/` |
| Hooks | `src/hooks/` |
| Utils | `src/lib/utils.ts` |
| Global styles | `src/app/globals.css` |
| Tailwind config | `tailwind.config.ts` |
| Token constants | `src/lib/tokens.ts` |

## Image Component

```tsx
import Image from "next/image";
// Always use next/image. Never use <img> for content images.
```

## Font Setup

```tsx
// src/app/layout.tsx
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
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

Required packages: `clsx`, `tailwind-merge`. Check `package.json` before writing — install if missing:
```bash
npm install clsx tailwind-merge
```

## Animation Library

Framer Motion. Check for `framer-motion` in `package.json`.
```bash
npm install framer-motion
```

Import pattern:
```tsx
import { motion, AnimatePresence } from "framer-motion";
```

## Component Export Pattern

Follow shadcn conventions — named exports, no default exports, `displayName` set:

```tsx
// src/components/ui/button.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => (
    <button ref={ref} className={cn(baseStyles, className)} {...props} />
  )
);
Button.displayName = "Button";

export { Button };
export type { ButtonProps };
```

## Routing

App Router (`app/` directory). Pages live in `src/app/`. Do not generate `pages/` directory files.

## Tailwind Config Extension

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // Token extensions added here by /ui theme
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

## Global CSS Structure

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* tokens written here by /ui theme or /ui init */
  }
  .dark {
    /* dark tokens written here */
  }
}
```
