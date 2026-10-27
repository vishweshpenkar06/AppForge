# Material Design 3 — Developer Reference

Source: https://m3.material.io/

---

## 1. Token Naming Convention

M3 uses a three-tier token architecture:

| Tier | Prefix | Example | Use |
|---|---|---|---|
| Reference | `md.ref.*` | `md.ref.palette.primary40` | Raw palette value — never used directly in UI |
| System | `md.sys.*` | `md.sys.color.primary` | Semantic role — the token you use in components |
| Component | `md.comp.*` | `md.comp.filled-button.container.color` | Per-component override |

**CSS custom property mapping:**
```
md.sys.color.primary              → --md-sys-color-primary
md.sys.typescale.label-large.size → --md-sys-typescale-label-large-size
md.sys.shape.corner.medium        → --md-sys-shape-corner-medium
md.sys.elevation.level2           → --md-sys-elevation-level2
md.sys.motion.duration.medium2    → --md-sys-motion-duration-medium2
md.sys.motion.easing.emphasized   → --md-sys-motion-easing-emphasized
```

---

## 2. Colour System

### 2.1 Tonal Palettes

Each key colour generates a palette of 13 tones: **0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100**.
Tone 0 = pure black. Tone 100 = pure white.

Five key colours are required:
- **Primary** — main brand colour
- **Secondary** — supporting accent
- **Tertiary** — contrasting accent
- **Neutral** — backgrounds and surfaces
- **Neutral-Variant** — borders, muted text, surface variants

### 2.2 Colour Roles — Light & Dark Tone Assignments

| Role | Light Tone | Dark Tone |
|---|---|---|
| `primary` | Primary-40 | Primary-80 |
| `on-primary` | Primary-100 | Primary-20 |
| `primary-container` | Primary-90 | Primary-30 |
| `on-primary-container` | Primary-10 | Primary-90 |
| `primary-fixed` | Primary-90 | Primary-90 |
| `primary-fixed-dim` | Primary-80 | Primary-80 |
| `on-primary-fixed` | Primary-10 | Primary-10 |
| `on-primary-fixed-variant` | Primary-30 | Primary-30 |
| `secondary` | Secondary-40 | Secondary-80 |
| `on-secondary` | Secondary-100 | Secondary-20 |
| `secondary-container` | Secondary-90 | Secondary-30 |
| `on-secondary-container` | Secondary-10 | Secondary-90 |
| `tertiary` | Tertiary-40 | Tertiary-80 |
| `on-tertiary` | Tertiary-100 | Tertiary-20 |
| `tertiary-container` | Tertiary-90 | Tertiary-30 |
| `on-tertiary-container` | Tertiary-10 | Tertiary-90 |
| `error` | Error-40 | Error-80 |
| `on-error` | Error-100 | Error-20 |
| `error-container` | Error-90 | Error-30 |
| `on-error-container` | Error-10 | Error-90 |
| `background` | Neutral-99 | Neutral-10 |
| `on-background` | Neutral-10 | Neutral-90 |
| `surface` | Neutral-99 | Neutral-10 |
| `on-surface` | Neutral-10 | Neutral-90 |
| `surface-variant` | Neutral-Variant-90 | Neutral-Variant-30 |
| `on-surface-variant` | Neutral-Variant-30 | Neutral-Variant-80 |
| `surface-dim` | Neutral-87 | Neutral-6 |
| `surface-bright` | Neutral-98 | Neutral-24 |
| `surface-container-lowest` | Neutral-100 | Neutral-4 |
| `surface-container-low` | Neutral-96 | Neutral-10 |
| `surface-container` | Neutral-94 | Neutral-12 |
| `surface-container-high` | Neutral-92 | Neutral-17 |
| `surface-container-highest` | Neutral-90 | Neutral-22 |
| `outline` | Neutral-Variant-50 | Neutral-Variant-60 |
| `outline-variant` | Neutral-Variant-80 | Neutral-Variant-30 |
| `shadow` | Neutral-0 | Neutral-0 |
| `scrim` | Neutral-0 | Neutral-0 |
| `inverse-surface` | Neutral-20 | Neutral-90 |
| `inverse-on-surface` | Neutral-95 | Neutral-20 |
| `inverse-primary` | Primary-80 | Primary-40 |
| `surface-tint` | = `primary` | = `primary` |

### 2.3 State Layers

All interaction states use a semi-transparent overlay of the **content colour** on the container:

| State | Opacity |
|---|---|
| Hover | 8% |
| Focus | 12% |
| Pressed | 12% |
| Dragged | 16% |
| Disabled container | 12% of `on-surface` |
| Disabled content | 38% of `on-surface` |

### 2.4 CSS Custom Properties Template

```css
:root {
  /* Primary */
  --md-sys-color-primary: #6750a4;
  --md-sys-color-on-primary: #ffffff;
  --md-sys-color-primary-container: #eaddff;
  --md-sys-color-on-primary-container: #21005d;

  /* Secondary */
  --md-sys-color-secondary: #625b71;
  --md-sys-color-on-secondary: #ffffff;
  --md-sys-color-secondary-container: #e8def8;
  --md-sys-color-on-secondary-container: #1d192b;

  /* Tertiary */
  --md-sys-color-tertiary: #7d5260;
  --md-sys-color-on-tertiary: #ffffff;
  --md-sys-color-tertiary-container: #ffd8e4;
  --md-sys-color-on-tertiary-container: #31111d;

  /* Error */
  --md-sys-color-error: #b3261e;
  --md-sys-color-on-error: #ffffff;
  --md-sys-color-error-container: #f9dedc;
  --md-sys-color-on-error-container: #410e0b;

  /* Surfaces */
  --md-sys-color-background: #fffbfe;
  --md-sys-color-on-background: #1c1b1f;
  --md-sys-color-surface: #fffbfe;
  --md-sys-color-on-surface: #1c1b1f;
  --md-sys-color-surface-variant: #e7e0ec;
  --md-sys-color-on-surface-variant: #49454f;
  --md-sys-color-surface-container-lowest: #ffffff;
  --md-sys-color-surface-container-low: #f7f2fa;
  --md-sys-color-surface-container: #f3edf7;
  --md-sys-color-surface-container-high: #ece6f0;
  --md-sys-color-surface-container-highest: #e6e0e9;

  /* Outline */
  --md-sys-color-outline: #79747e;
  --md-sys-color-outline-variant: #cac4d0;

  /* Inverse */
  --md-sys-color-inverse-surface: #313033;
  --md-sys-color-inverse-on-surface: #f4eff4;
  --md-sys-color-inverse-primary: #d0bcff;
  --md-sys-color-shadow: #000000;
  --md-sys-color-scrim: #000000;
  --md-sys-color-surface-tint: var(--md-sys-color-primary);
}

[data-theme="dark"] {
  --md-sys-color-primary: #d0bcff;
  --md-sys-color-on-primary: #381e72;
  --md-sys-color-primary-container: #4f378b;
  --md-sys-color-on-primary-container: #eaddff;
  --md-sys-color-secondary: #cbc2db;
  --md-sys-color-on-secondary: #332d41;
  --md-sys-color-secondary-container: #4a4458;
  --md-sys-color-on-secondary-container: #e8def8;
  --md-sys-color-tertiary: #efb8c8;
  --md-sys-color-on-tertiary: #492532;
  --md-sys-color-tertiary-container: #633b48;
  --md-sys-color-on-tertiary-container: #ffd8e4;
  --md-sys-color-error: #f2b8b5;
  --md-sys-color-on-error: #601410;
  --md-sys-color-error-container: #8c1d18;
  --md-sys-color-on-error-container: #f9dedc;
  --md-sys-color-background: #1c1b1f;
  --md-sys-color-on-background: #e6e1e5;
  --md-sys-color-surface: #1c1b1f;
  --md-sys-color-on-surface: #e6e1e5;
  --md-sys-color-surface-variant: #49454f;
  --md-sys-color-on-surface-variant: #cac4d0;
  --md-sys-color-surface-container-lowest: #0f0d13;
  --md-sys-color-surface-container-low: #1d1b20;
  --md-sys-color-surface-container: #211f26;
  --md-sys-color-surface-container-high: #2b2930;
  --md-sys-color-surface-container-highest: #36343b;
  --md-sys-color-outline: #938f99;
  --md-sys-color-outline-variant: #49454f;
  --md-sys-color-inverse-surface: #e6e1e5;
  --md-sys-color-inverse-on-surface: #313033;
  --md-sys-color-inverse-primary: #6750a4;
}
```

---

## 3. Typography

### 3.1 Type Scale (Canonical — Roboto)

| Role | Font Size | Line Height | Weight | Letter Spacing |
|---|---|---|---|---|
| Display Large | 57px | 64px | 400 | −0.25px |
| Display Medium | 45px | 52px | 400 | 0 |
| Display Small | 36px | 44px | 400 | 0 |
| Headline Large | 32px | 40px | 400 | 0 |
| Headline Medium | 28px | 36px | 400 | 0 |
| Headline Small | 24px | 32px | 400 | 0 |
| Title Large | 22px | 28px | 400 | 0 |
| Title Medium | 16px | 24px | 500 | +0.15px |
| Title Small | 14px | 20px | 500 | +0.1px |
| Label Large | 14px | 20px | 500 | +0.1px |
| Label Medium | 12px | 16px | 500 | +0.5px |
| Label Small | 11px | 16px | 500 | +0.5px |
| Body Large | 16px | 24px | 400 | +0.5px |
| Body Medium | 14px | 20px | 400 | +0.25px |
| Body Small | 12px | 16px | 400 | +0.4px |

### 3.2 CSS Custom Properties

```css
:root {
  --md-sys-typescale-display-large-size: 57px;
  --md-sys-typescale-display-large-line-height: 64px;
  --md-sys-typescale-display-large-weight: 400;
  --md-sys-typescale-display-large-tracking: -0.25px;

  --md-sys-typescale-display-medium-size: 45px;
  --md-sys-typescale-display-medium-line-height: 52px;
  --md-sys-typescale-display-medium-weight: 400;
  --md-sys-typescale-display-medium-tracking: 0;

  --md-sys-typescale-display-small-size: 36px;
  --md-sys-typescale-display-small-line-height: 44px;
  --md-sys-typescale-display-small-weight: 400;

  --md-sys-typescale-headline-large-size: 32px;
  --md-sys-typescale-headline-large-line-height: 40px;
  --md-sys-typescale-headline-large-weight: 400;

  --md-sys-typescale-headline-medium-size: 28px;
  --md-sys-typescale-headline-medium-line-height: 36px;

  --md-sys-typescale-headline-small-size: 24px;
  --md-sys-typescale-headline-small-line-height: 32px;

  --md-sys-typescale-title-large-size: 22px;
  --md-sys-typescale-title-large-line-height: 28px;
  --md-sys-typescale-title-large-weight: 400;

  --md-sys-typescale-title-medium-size: 16px;
  --md-sys-typescale-title-medium-line-height: 24px;
  --md-sys-typescale-title-medium-weight: 500;
  --md-sys-typescale-title-medium-tracking: 0.15px;

  --md-sys-typescale-title-small-size: 14px;
  --md-sys-typescale-title-small-line-height: 20px;
  --md-sys-typescale-title-small-weight: 500;
  --md-sys-typescale-title-small-tracking: 0.1px;

  --md-sys-typescale-label-large-size: 14px;
  --md-sys-typescale-label-large-line-height: 20px;
  --md-sys-typescale-label-large-weight: 500;
  --md-sys-typescale-label-large-tracking: 0.1px;

  --md-sys-typescale-label-medium-size: 12px;
  --md-sys-typescale-label-medium-line-height: 16px;
  --md-sys-typescale-label-medium-weight: 500;
  --md-sys-typescale-label-medium-tracking: 0.5px;

  --md-sys-typescale-label-small-size: 11px;
  --md-sys-typescale-label-small-line-height: 16px;
  --md-sys-typescale-label-small-weight: 500;
  --md-sys-typescale-label-small-tracking: 0.5px;

  --md-sys-typescale-body-large-size: 16px;
  --md-sys-typescale-body-large-line-height: 24px;
  --md-sys-typescale-body-large-weight: 400;
  --md-sys-typescale-body-large-tracking: 0.5px;

  --md-sys-typescale-body-medium-size: 14px;
  --md-sys-typescale-body-medium-line-height: 20px;
  --md-sys-typescale-body-medium-weight: 400;
  --md-sys-typescale-body-medium-tracking: 0.25px;

  --md-sys-typescale-body-small-size: 12px;
  --md-sys-typescale-body-small-line-height: 16px;
  --md-sys-typescale-body-small-weight: 400;
  --md-sys-typescale-body-small-tracking: 0.4px;
}
```

---

## 4. Elevation

### 4.1 Elevation Levels

| Level | dp | Shadow |
|---|---|---|
| Level 0 | 0dp | none |
| Level 1 | 1dp | `0px 1px 2px rgba(0,0,0,.30), 0px 1px 3px 1px rgba(0,0,0,.15)` |
| Level 2 | 3dp | `0px 1px 2px rgba(0,0,0,.30), 0px 2px 6px 2px rgba(0,0,0,.15)` |
| Level 3 | 6dp | `0px 1px 3px rgba(0,0,0,.30), 0px 4px 8px 3px rgba(0,0,0,.15)` |
| Level 4 | 8dp | `0px 2px 3px rgba(0,0,0,.30), 0px 6px 10px 4px rgba(0,0,0,.15)` |
| Level 5 | 12dp | `0px 4px 4px rgba(0,0,0,.30), 0px 8px 12px 6px rgba(0,0,0,.15)` |

### 4.2 Tonal Elevation (Dark Theme)

In dark themes, elevation is expressed through a `surface-tint` (= `primary`) colour overlay. Shadows are less visible on dark surfaces.

| Level | dp | Surface Tint Opacity |
|---|---|---|
| Level 0 | 0dp | 0% |
| Level 1 | 1dp | 5% |
| Level 2 | 3dp | 8% |
| Level 3 | 6dp | 11% |
| Level 4 | 8dp | 12% |
| Level 5 | 12dp | 14% |

```css
/* Tonal elevation utility */
.surface-level-1 {
  background-color: color-mix(
    in srgb,
    var(--md-sys-color-surface-tint) 5%,
    var(--md-sys-color-surface)
  );
  box-shadow: var(--md-sys-elevation-level1);
}
```

### 4.3 Component Elevation Defaults

| Component | Default Level |
|---|---|
| Card (elevated) | Level 1 |
| Navigation drawer | Level 1 |
| Bottom sheet (modal) | Level 1 |
| Navigation bar | Level 2 |
| Top app bar (scrolled) | Level 2 |
| Menu / dropdown | Level 2 |
| Tooltip | Level 2 |
| FAB | Level 3 |
| Dialog | Level 3 |
| Elevated button | Level 1 |

---

## 5. Motion

### 5.1 Easing Curves

| Token | Cubic-Bezier | Use |
|---|---|---|
| `emphasized` | `cubic-bezier(0.2, 0, 0, 1)` | Spatial transitions across screen |
| `emphasized-decelerate` | `cubic-bezier(0.05, 0.7, 0.1, 1.0)` | Elements **entering** the screen |
| `emphasized-accelerate` | `cubic-bezier(0.3, 0.0, 0.8, 0.15)` | Elements **exiting** the screen |
| `standard` | `cubic-bezier(0.2, 0.0, 0, 1.0)` | Elements remaining on screen |
| `standard-decelerate` | `cubic-bezier(0, 0, 0, 1.0)` | Elements entering (standard) |
| `standard-accelerate` | `cubic-bezier(0.3, 0, 1, 1)` | Elements exiting (standard) |
| `linear` | `cubic-bezier(0, 0, 1, 1)` | Fades, colour transitions |

### 5.2 Duration Tokens

| Token | Value |
|---|---|
| `short1` | 50ms |
| `short2` | 100ms |
| `short3` | 150ms |
| `short4` | 200ms |
| `medium1` | 250ms |
| `medium2` | 300ms |
| `medium3` | 350ms |
| `medium4` | 400ms |
| `long1` | 450ms |
| `long2` | 500ms |
| `long3` | 550ms |
| `long4` | 600ms |
| `extra-long1` | 700ms |
| `extra-long2` | 800ms |
| `extra-long3` | 900ms |
| `extra-long4` | 1000ms |

### 5.3 Motion Pairing Guide

| Transition | Easing | Duration |
|---|---|---|
| Large element entering | `emphasized-decelerate` | 400–500ms (long1–long2) |
| Large element exiting | `emphasized-accelerate` | 200ms (short4) |
| Element on screen | `standard` | 200–300ms |
| Container expanding | `emphasized-decelerate` | 500ms |
| Container collapsing | `emphasized-accelerate` | 300ms |
| Simple fade / colour | `linear` | 100–200ms |

### 5.4 CSS Custom Properties

```css
:root {
  --md-sys-motion-easing-emphasized:           cubic-bezier(0.2, 0, 0, 1);
  --md-sys-motion-easing-emphasized-decelerate: cubic-bezier(0.05, 0.7, 0.1, 1.0);
  --md-sys-motion-easing-emphasized-accelerate: cubic-bezier(0.3, 0.0, 0.8, 0.15);
  --md-sys-motion-easing-standard:             cubic-bezier(0.2, 0.0, 0, 1.0);
  --md-sys-motion-easing-standard-decelerate:  cubic-bezier(0, 0, 0, 1.0);
  --md-sys-motion-easing-standard-accelerate:  cubic-bezier(0.3, 0, 1, 1);
  --md-sys-motion-easing-linear:               cubic-bezier(0, 0, 1, 1);

  --md-sys-motion-duration-short1:      50ms;
  --md-sys-motion-duration-short2:      100ms;
  --md-sys-motion-duration-short3:      150ms;
  --md-sys-motion-duration-short4:      200ms;
  --md-sys-motion-duration-medium1:     250ms;
  --md-sys-motion-duration-medium2:     300ms;
  --md-sys-motion-duration-medium3:     350ms;
  --md-sys-motion-duration-medium4:     400ms;
  --md-sys-motion-duration-long1:       450ms;
  --md-sys-motion-duration-long2:       500ms;
}
```

---

## 6. Shape

### 6.1 Shape Scale

| Token | Corner Radius | CSS Variable |
|---|---|---|
| `corner-none` | 0dp | `--md-sys-shape-corner-none: 0px` |
| `corner-extra-small` | 4dp | `--md-sys-shape-corner-extra-small: 4px` |
| `corner-small` | 8dp | `--md-sys-shape-corner-small: 8px` |
| `corner-medium` | 12dp | `--md-sys-shape-corner-medium: 12px` |
| `corner-large` | 16dp | `--md-sys-shape-corner-large: 16px` |
| `corner-extra-large` | 28dp | `--md-sys-shape-corner-extra-large: 28px` |
| `corner-full` | 50% (pill) | `--md-sys-shape-corner-full: 9999px` |

### 6.2 Component Shape Assignments

| Component | Shape Token |
|---|---|
| All buttons | `corner-full` (pill) |
| FAB (regular + extended) | `corner-large` (16dp) |
| FAB (small) | `corner-medium` (12dp) |
| FAB (large) | `corner-extra-large` (28dp) |
| Card | `corner-medium` (12dp) |
| Chip | `corner-small` (8dp) |
| Dialog | `corner-extra-large` (28dp) |
| Bottom sheet (modal) | `corner-large` top only (16dp) |
| Navigation drawer | `corner-large` (16dp) |
| Menu | `corner-extra-small` (4dp) |
| Snackbar | `corner-extra-small` (4dp) |
| Text field (filled) | `corner-extra-small` top only |
| Text field (outlined) | `corner-extra-small` (4dp) |
| Badge | `corner-full` |
| Tooltip | `corner-extra-small` (4dp) |
| Nav bar indicator | `corner-full` |
| Nav rail indicator | `corner-full` |

---

## 7. Layout & Adaptive Design

### 7.1 Window Size Classes

| Class | Width | Primary Navigation |
|---|---|---|
| Compact | < 600dp | Navigation Bar (bottom) |
| Medium | 600–839dp | Navigation Rail |
| Expanded | 840–1199dp | Navigation Drawer (standard) |
| Large | 1200–1599dp | Navigation Drawer (permanent) |
| Extra-Large | ≥ 1600dp | Navigation Drawer (permanent) |

### 7.2 Layout Grid

| Window Class | Columns | Margin | Gutter |
|---|---|---|---|
| Compact (< 600dp) | 4 | 16dp | 16dp |
| Medium (600–839dp) | 12 | 24dp | 24dp |
| Expanded (≥ 840dp) | 12 | 24dp | 24dp |

Base grid: **8dp**. All spacing values should be multiples of 4dp or 8dp.

### 7.3 Canonical Layouts

| Layout | Use case |
|---|---|
| List-detail | Email, settings — list left, detail right |
| Feed | News, social — responsive card grid |
| Supporting panel | Main content + collapsible side panel |

---

## 8. Component Specs

### 8.1 Buttons

All buttons: height **40dp**, corner radius `corner-full` (pill), typography `Label Large`.

| Variant | Container | Label/Icon | Elevation |
|---|---|---|---|
| Filled | `primary` | `on-primary` | Level 0 |
| Filled Tonal | `secondary-container` | `on-secondary-container` | Level 0 |
| Elevated | `surface-container-low` | `primary` | Level 1 (→2 on hover) |
| Outlined | transparent | `primary` | Level 0 |
| Text | transparent | `primary` | Level 0 |

Disabled: container `on-surface` 12%, content `on-surface` 38%.

Padding: 24dp horizontal (no icon), 16dp start / 24dp end (with icon). Icon size: 18dp.

### 8.2 Cards

All cards: corner radius `corner-medium` (12dp), content padding 16dp.

| Variant | Container | Stroke | Elevation |
|---|---|---|---|
| Elevated | `surface-container-low` | none | Level 1 (→2 dragged) |
| Filled | `surface-container-highest` | none | Level 0 (→1 dragged) |
| Outlined | `surface` | `outline` 1dp | Level 0 (→1 dragged) |

State layer colour: `on-surface-variant` at 8% (hover), 12% (focus/pressed), 16% (dragged).

### 8.3 Navigation Drawer

Width: 360dp. Item height: 56dp. Corner radius: `corner-full` for active indicator.

| Element | Colour |
|---|---|
| Drawer container | `surface-container-low` |
| Active indicator | `secondary-container` |
| Active icon | `on-secondary-container` |
| Active label | `on-secondary-container` |
| Inactive icon | `on-surface-variant` |
| Inactive label | `on-surface-variant` |
| Section header | `on-surface-variant` (Title Small) |
| Divider | `outline-variant` |

Label typography: `Label Large`. Section headers: `Title Small`.

### 8.4 Navigation Rail

Width: 80dp. Active indicator: 56dp wide × 32dp tall. Icon size: 24dp.

| Element | Colour |
|---|---|
| Rail container | `surface` |
| Active indicator | `secondary-container` |
| Active icon | `on-secondary-container` |
| Active label | `on-surface` |
| Inactive icon | `on-surface-variant` |
| Inactive label | `on-surface-variant` |

Label typography: `Label Medium`.

### 8.5 Navigation Bar (Bottom)

Height: 80dp. Active indicator: 64dp wide × 32dp tall.

| Element | Colour |
|---|---|
| Bar container | `surface-container` (Level 2 elevation) |
| Active indicator | `secondary-container` |
| Active icon | `on-secondary-container` |
| Active label | `on-surface` |
| Inactive icon | `on-surface-variant` |
| Inactive label | `on-surface-variant` |

### 8.6 FAB

| Size | Dimension | Shape |
|---|---|---|
| Small | 40dp | `corner-medium` (12dp) |
| Regular | 56dp | `corner-large` (16dp) |
| Large | 96dp | `corner-extra-large` (28dp) |

Container: `primary-container`. Icon: `on-primary-container`. Elevation: Level 3 (→4 hover, →3 pressed).

### 8.7 Text Fields

Height: 56dp. Corner radius: filled = `corner-extra-small` top only (4dp), outlined = `corner-extra-small` (4dp).

| Element (Filled) | Colour |
|---|---|
| Container | `surface-variant` |
| Active indicator (line) | `primary` |
| Inactive indicator | `on-surface-variant` |
| Label text (floating) | `primary` (focused) / `on-surface-variant` |
| Input text | `on-surface` |
| Caret | `primary` |
| Error indicator | `error` |

### 8.8 Chips

Height: 32dp. Corner radius: `corner-small` (8dp). Typography: `Label Large`.

| Variant | Container | Label |
|---|---|---|
| Assist | `surface` (outline: `outline`) | `on-surface` |
| Filter (unselected) | `surface` (outline: `outline`) | `on-surface-variant` |
| Filter (selected) | `secondary-container` | `on-secondary-container` |
| Input | `surface` (outline: `outline`) | `on-surface` |
| Suggestion | `surface` (outline: `outline`) | `on-surface` |

---

## 9. Material Web Components

Install: `npm install @material/web`

```html
<!-- Buttons -->
<md-filled-button>Label</md-filled-button>
<md-filled-tonal-button>Label</md-filled-tonal-button>
<md-elevated-button>Label</md-elevated-button>
<md-outlined-button>Label</md-outlined-button>
<md-text-button>Label</md-text-button>

<!-- FAB -->
<md-fab><md-icon slot="icon">add</md-icon></md-fab>
<md-extended-fab>
  <md-icon slot="icon">add</md-icon>
  Create
</md-extended-fab>

<!-- Cards (no web component — use div with tokens) -->
<div class="md-card md-card--elevated">...</div>

<!-- Navigation -->
<md-navigation-drawer></md-navigation-drawer>
<md-navigation-rail></md-navigation-rail>
<md-navigation-bar></md-navigation-bar>

<!-- Inputs -->
<md-filled-text-field label="Name"></md-filled-text-field>
<md-outlined-text-field label="Name"></md-outlined-text-field>

<!-- Selection -->
<md-checkbox></md-checkbox>
<md-radio></md-radio>
<md-switch></md-switch>
<md-slider></md-slider>

<!-- Chips -->
<md-assist-chip label="Assist"></md-assist-chip>
<md-filter-chip label="Filter"></md-filter-chip>
```

---

## 10. Tools & Resources

| Resource | Link |
|---|---|
| Material Theme Builder | https://m3.material.io/theme-builder |
| Material Web (npm) | `@material/web` |
| Material Tokens (JSON) | https://github.com/material-foundation/material-tokens |
| Figma M3 Kit | https://www.figma.com/community/file/1035203688168086460 |
| MUI v6 (React M3) | `@mui/material` |
| Angular Material | `@angular/material` |
