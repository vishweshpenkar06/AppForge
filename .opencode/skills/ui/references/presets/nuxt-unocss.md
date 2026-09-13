# Preset: nuxt-unocss

Detected when `package.json` contains `nuxt` + `@unocss/nuxt` or `unocss`.

## Path Map

| Resource | Path |
|---|---|
| Components (primitives) | `components/ui/` |
| Components (features) | `components/features/` |
| Composables (hooks) | `composables/` |
| Utils | `utils/index.ts` |
| Global styles | `assets/css/main.css` |
| UnoCSS config | `uno.config.ts` |

## Image Component

Use native `<img>` with Nuxt Image if installed:
```vue
<NuxtImg src="/hero.jpg" alt="Hero" loading="lazy" />
```
Fall back to native `<img loading="lazy">` if `@nuxt/image` not in `package.json`.

## cn() Equivalent

UnoCSS uses `clsx` directly — no `twMerge` needed:
```ts
// utils/index.ts
export { clsx as cx } from "clsx";
```

## Animation Library

AutoAnimate (lightweight, Vue-native) or VueUse Motion:
```bash
npm install @formkit/auto-animate
# or
npm install @vueuse/motion
```

AutoAnimate usage:
```vue
<script setup>
import { useAutoAnimate } from "@formkit/auto-animate/vue";
const [parent] = useAutoAnimate();
</script>
<template>
  <ul ref="parent">
    <li v-for="item in items" :key="item.id">{{ item.name }}</li>
  </ul>
</template>
```

## Component Pattern

Vue SFCs with `<script setup>` and TypeScript:

```vue
<!-- components/ui/Button.vue -->
<script setup lang="ts">
interface Props {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  variant: "primary",
  size: "md",
});
</script>

<template>
  <button
    :disabled="disabled || loading"
    :class="cx(base, variants[variant], sizes[size], $attrs.class)"
  >
    <slot />
  </button>
</template>
```

## UnoCSS Config

```ts
// uno.config.ts
import { defineConfig, presetUno, presetAttributify } from "unocss";

export default defineConfig({
  presets: [presetUno(), presetAttributify()],
  theme: {
    colors: {
      brand: "var(--color-brand)",
      // token extensions added by /ui theme
    },
  },
});
```

## Global CSS

```css
/* assets/css/main.css */
:root { /* tokens */ }
.dark { /* dark tokens */ }
```

Register in `nuxt.config.ts`:
```ts
export default defineNuxtConfig({
  css: ["~/assets/css/main.css"],
});
```
