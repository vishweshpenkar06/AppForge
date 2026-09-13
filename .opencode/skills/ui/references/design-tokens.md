# Design Tokens Reference

## Token Naming Convention

Tokens follow a three-level hierarchy: **category.variant.modifier**

```
color.background.default
color.background.subtle
color.brand.default
color.brand.hover
color.text.primary
color.text.muted
color.border.default
```

## Full CSS Custom Property System

```css
/* styles/globals.css */
:root {
  /* Backgrounds — 3 layers of depth */
  --color-bg-base:    #ffffff;
  --color-bg-subtle:  #f9fafb;
  --color-bg-raised:  #f3f4f6;
  --color-bg-overlay: rgba(0, 0, 0, 0.04);

  /* Foreground */
  --color-text-primary:   #111827;
  --color-text-secondary: #374151;
  --color-text-muted:     #9ca3af;
  --color-text-disabled:  #d1d5db;
  --color-text-inverse:   #ffffff;

  /* Brand */
  --color-brand:        #6366f1;
  --color-brand-hover:  #4f46e5;
  --color-brand-active: #4338ca;
  --color-brand-subtle: #eef2ff;
  --color-brand-text:   #ffffff;

  /* Semantic */
  --color-success:        #10b981;
  --color-success-subtle: #ecfdf5;
  --color-warning:        #f59e0b;
  --color-warning-subtle: #fffbeb;
  --color-error:          #ef4444;
  --color-error-subtle:   #fef2f2;
  --color-info:           #3b82f6;
  --color-info-subtle:    #eff6ff;

  /* Borders */
  --color-border:        rgba(0, 0, 0, 0.08);
  --color-border-strong: rgba(0, 0, 0, 0.16);
  --color-border-brand:  var(--color-brand);

  /* Shadows */
  --shadow-xs: 0 1px 2px rgba(0,0,0,.05);
  --shadow-sm: 0 1px 3px rgba(0,0,0,.1), 0 1px 2px rgba(0,0,0,.06);
  --shadow-md: 0 4px 6px rgba(0,0,0,.07), 0 2px 4px rgba(0,0,0,.06);
  --shadow-lg: 0 10px 15px rgba(0,0,0,.1), 0 4px 6px rgba(0,0,0,.05);
  --shadow-xl: 0 20px 25px rgba(0,0,0,.1), 0 10px 10px rgba(0,0,0,.04);

  /* Spacing scale */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-6:  24px;
  --space-8:  32px;
  --space-12: 48px;
  --space-16: 64px;

  /* Typography */
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", monospace;
  --text-xs:   0.75rem;   /* 12px */
  --text-sm:   0.875rem;  /* 14px */
  --text-base: 1rem;      /* 16px */
  --text-lg:   1.125rem;  /* 18px */
  --text-xl:   1.25rem;   /* 20px */
  --text-2xl:  1.5rem;    /* 24px */
  --text-3xl:  1.875rem;  /* 30px */
  --text-4xl:  2.25rem;   /* 36px */

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
}

.dark {
  --color-bg-base:    #0f1117;
  --color-bg-subtle:  #161b27;
  --color-bg-raised:  #1e2535;
  --color-bg-overlay: rgba(255, 255, 255, 0.04);

  --color-text-primary:   #f9fafb;
  --color-text-secondary: #d1d5db;
  --color-text-muted:     #6b7280;
  --color-text-disabled:  #374151;
  --color-text-inverse:   #111827;

  --color-brand:        #818cf8;
  --color-brand-hover:  #a5b4fc;
  --color-brand-active: #c7d2fe;
  --color-brand-subtle: #1e1b4b;

  --color-border:        rgba(255, 255, 255, 0.08);
  --color-border-strong: rgba(255, 255, 255, 0.16);

  --shadow-xs: 0 1px 2px rgba(0,0,0,.4);
  --shadow-sm: 0 1px 3px rgba(0,0,0,.5), 0 1px 2px rgba(0,0,0,.4);
  --shadow-md: 0 4px 6px rgba(0,0,0,.4), 0 2px 4px rgba(0,0,0,.3);
  --shadow-lg: 0 10px 15px rgba(0,0,0,.5), 0 4px 6px rgba(0,0,0,.3);
  --shadow-xl: 0 20px 25px rgba(0,0,0,.5), 0 10px 10px rgba(0,0,0,.3);
}
```

## Tailwind Config Mapping

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "var(--color-brand)",
          hover:   "var(--color-brand-hover)",
          active:  "var(--color-brand-active)",
          subtle:  "var(--color-brand-subtle)",
        },
        bg: {
          base:    "var(--color-bg-base)",
          subtle:  "var(--color-bg-subtle)",
          raised:  "var(--color-bg-raised)",
        },
        text: {
          primary:   "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          muted:     "var(--color-text-muted)",
          disabled:  "var(--color-text-disabled)",
        },
        border: {
          DEFAULT: "var(--color-border)",
          strong:  "var(--color-border-strong)",
        },
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
      },
      borderRadius: {
        sm:   "var(--radius-sm)",
        md:   "var(--radius-md)",
        lg:   "var(--radius-lg)",
        xl:   "var(--radius-xl)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
} satisfies Config;
```
