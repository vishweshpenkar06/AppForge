# Performance Audit — AppForge

> Generated from `next build --webpack` with `ANALYZE=true`
> Build: Next.js 16.2.6 (webpack) · Date: 2026-08-27

---

## Bundle Size Summary (Client-Side Initial Chunks)

| Page | statSize | parsedSize | gzipSize | Top Offender |
|------|----------|------------|----------|--------------|
| `/eval` | 33,089 B | 12,898 B | **4,479 B** | `recharts` (eval-dashboard + chart + eval-history-chart) |
| `/builder` | 27,091 B | 10,003 B | **3,687 B** | `react-resizable-panels` + builder editor |
| `/pricing` | 21,629 B | 9,625 B | **3,196 B` | pricing page inline content |
| `/admin/users` | 26,376 B | 8,424 B | **2,919 B` | admin users page + lucide icons |
| `/templates` | 20,251 B | 8,423 B | **3,257 B` | templates page + lucide icons |
| `/` (home) | 18,730 B | 8,341 B | **2,999 B` | Hero + OnboardingTour (react-joyride) |
| `/dashboard` | 15,728 B | 7,283 B | **2,394 B` | dashboard page content |

**Shared vendor chunk** (`8500-*.js`): 34,968 B stat / 8,734 B parsed / **3,544 B gzipped**
 Contains: `next/link`, Next.js routing utilities

---

## Top 3 Bundle-Size Offenders — Findings

### 1. `recharts` (4,479 B gzipped on `/eval`)

**Impact**: Largest single-page bundle. recharts pulls in `d3-*` dependencies, `react-smooth`, `victory-vendor`, and internal state management — totaling ~200 KB stat size before minification.

**Where it's imported**:
- `components/ui/chart.tsx` — `import * as RechartsPrimitive from 'recharts'`
- `components/eval-dashboard.tsx` — `import { BarChart, Bar, XAxis, CartesianGrid, Cell } from 'recharts'`
- `components/eval-history-chart.tsx` — `import { LineChart, Line, XAxis, CartesianGrid } from 'recharts'`

**Consumer chain**: Only used by `/eval` page → `EvalDashboard` → `EvalHistoryChart` + `ChartContainer`

**Fix applied**: Created `components/eval-dashboard-lazy.tsx` using `next/dynamic` with `ssr: false`. The `/eval` page now imports `EvalDashboardLazy` instead of `EvalDashboard`, deferring the entire recharts tree until client-side hydration.

**Expected savings**: ~4,479 B gzipped removed from initial `/eval` chunk; loaded on demand instead.

---

### 2. `react-resizable-panels` (unused — dead code)

**Impact**: `components/ui/resizable.tsx` imports `react-resizable-panels` (~30 KB stat) but **no page or component in the codebase imports `ResizablePanelGroup`, `ResizablePanel`, or `ResizableHandle`**. This is dead code that gets bundled into any route that transitively touches the UI barrel.

**Where it's imported**:
- `components/ui/resizable.tsx` — `import * as ResizablePrimitive from 'react-resizable-panels'`

**Status**: Component exists but is never consumed. The library is tree-shaken by webpack in the current build (doesn't appear as a separate chunk), but it adds to node_modules weight and install time.

**Recommendation**: Remove `components/ui/resizable.tsx` and uninstall `react-resizable-panels` from `package.json` if no future use is planned. This is a pure dead-code removal.

---

### 3. `react-joyride` (loaded eagerly on `/` homepage)

**Impact**: `components/OnboardingTour.tsx` imports `react-joyride` which pulls in `scroll`, `create-react-context`, `detect-browser`, and DOM manipulation utilities. This adds ~5–8 KB gzipped to the homepage bundle.

**Where it's imported**:
- `app/page.tsx` — `import OnboardingTour from '@/components/OnboardingTour'`

**Fix applied**: Created `components/onboarding-tour-lazy.tsx` using `next/dynamic` with `ssr: false`. The homepage now imports `OnboardingTourLazy`, deferring react-joyride until after initial paint.

**Expected savings**: ~5–8 B gzipped removed from initial `/` chunk.

---

## Dynamic Imports Applied

| Component | File | Strategy |
|-----------|------|----------|
| `EvalDashboard` | `components/eval-dashboard-lazy.tsx` | `next/dynamic` with `ssr: false` + skeleton loading |
| `OnboardingTour` | `components/onboarding-tour-lazy.tsx` | `next/dynamic` with `ssr: false` |

**Pages updated**:
- `app/eval/page.tsx` — imports `EvalDashboardLazy` instead of `EvalDashboard`
- `app/page.tsx` — imports `OnboardingTourLazy` instead of `OnboardingTour`

---

## `next.config.mjs` Changes

```js
import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [{ protocol: 'https', hostname: '**.clerk.com' }],
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'date-fns',
      'recharts',
    ],
  },
}

export default withBundleAnalyzer(nextConfig)
```

**Changes**:
- Added `@next/bundle-analyzer` (enabled via `ANALYZE=true`)
- Added `images.formats` for AVIF/WebP auto-negotiation
- Added `images.remotePatterns` for Clerk avatar URLs
- Added `experimental.optimizePackageImports` for tree-shaking of lucide-react, Radix icons, date-fns, and recharts

---

## Web App Manifest

Created `public/manifest.json` for installable PWA support:

- **name**: `AppForge`
- **short_name**: `AppForge`
- **theme_color**: `#6366f1` (forge accent/indigo)
- **background_color**: `#08080c` (forge-950)
- **display**: `standalone`
- **icons**: Placeholder references for 72px through 512px (generate actual PNGs before production deploy)

**Note**: Icon files in `public/icons/` are placeholder references. Generate actual icon PNGs (or use a tool like `pwa-asset-generator`) before deploying to production.

---

## `<img>` Tag Audit

**Result**: No raw `<img>` tags found anywhere in the codebase. All image handling goes through CSS or Next.js `Image` component patterns. No fixes needed.

---

## Additional Recommendations

1. **Remove dead code**: Delete `components/ui/resizable.tsx` and uninstall `react-resizable-panels` from `package.json`
2. **Code-split admin routes**: `/admin` and `/admin/users` pages could benefit from dynamic imports for their heavy data tables
3. **Consider `next/dynamic` for the compiler page**: The `/compiler` page imports the full pipeline UI — if it's heavy, wrap it similarly
4. **Monitor recharts usage**: If more charts are added, consider lighter alternatives like `lightweight-charts` or `uPlot`
