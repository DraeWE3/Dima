---
name: glass-button-skill
description: >
  Complete implementation skill for Apple-style liquid glass UI in Next.js.
  Covers glass buttons, cards, navbars, modals, inputs, sidebars, tags,
  tooltips, and gooey toggles — all using SVG filters (feDisplacementMap,
  feGaussianBlur, feColorMatrix). Trigger this skill whenever the user wants:
  glass morphism, frosted glass, liquid glass, glassmorphism UI, gooey toggles,
  SVG filter effects, macOS/iOS-style glass, refractive material, Apple Vision Pro
  aesthetic, blur-filter UI, liquid cards, glass navigation, glass panels,
  or anything described as "make it look like Apple / liquid / frosted / premium glass".
  Always use this skill when building any glass or liquid UI component in Next.js.
---

# Liquid Glass UI Skill — Next.js

Production patterns for realistic liquid glass UI using SVG filters.
No canvas, no WebGL — pure CSS + SVG, fully compatible with Next.js App Router.

## The Two Core Effects

| Effect | Filter Used | Best For |
|--------|------------|---------|
| **Liquid Glass** | `feDisplacementMap` + `feTurbulence` or normal-map `feImage` | Buttons, cards, navbars, modals, inputs, panels |
| **Goo Blob** | `feGaussianBlur` + `feColorMatrix` | Toggle switches, morphing blobs, dripping effects |

---

## Quick Component Index

Read the reference file for the component you need:

| Reference | Components Covered |
|-----------|-------------------|
| [`references/01-next-setup.md`](references/01-next-setup.md) | SVG provider, GlassRoot component, global CSS, Next.js setup |
| [`references/02-glass-surfaces.md`](references/02-glass-surfaces.md) | Cards, panels, modals, sidebars, hero sections |
| [`references/03-glass-nav.md`](references/03-glass-nav.md) | Navbar, floating nav, breadcrumbs, tabs |
| [`references/04-glass-interactive.md`](references/04-glass-interactive.md) | Buttons, pills, icon buttons, inputs, tags, tooltips |
| [`references/05-goo-toggle.md`](references/05-goo-toggle.md) | Goo toggle switch, colored variants, React component |
| [`references/06-animations.md`](references/06-animations.md) | Hover, ripple, shimmer, entrance animations |

---

## How Glass Works (The Physics)

Real glass **refracts** light — it bends rays passing through it. SVG's
`feDisplacementMap` simulates this by shifting each pixel based on a **normal map**
(an image encoding surface angles as RGB). Red channel → X displacement,
Green channel → Y displacement.

Two types of displacement used here:

**feTurbulence (container warp)** — uses Perlin noise to create organic waviness
across a whole panel. Scale 50–100 for dramatic; 10–30 for subtle.

**feImage normal-map (button/lens)** — uses a pre-baked PNG of a glass lens normal
map. Creates physically accurate per-button refraction. The base64 image is in
`references/01-next-setup.md`.

The `inset box-shadow` on `::before` simulates the specular highlight — the bright
rim you see on the curved edge of a real glass object.

---

## Critical Rules (All Components)

```
1. isolation: isolate     — prevents filter bleeding to sibling elements
2. pointer-events: none   — on all ::before/::after pseudo-elements
3. z-index layering:      content (z:2) > highlight ring (z:1) > filter (z:-1 or 0)
4. SVG filter placement:  in <GlassFilterProvider> at layout root, never duplicated
5. backdrop-filter + SVG: combine them — backdrop-filter for blur, filter url() for warp
6. 'use client'           — all glass components require client-side rendering
7. will-change: transform — on interactive glass elements for GPU compositing
```

---

## Color Palette for Glass

```css
/* Light-mode glass (on bright backgrounds) */
--glass-bg:       rgba(255, 255, 255, 0.15);
--glass-border:   rgba(255, 255, 255, 0.25);
--glass-shine:    rgba(255, 255, 255, 0.70);
--glass-shadow:   rgba(0, 0, 0, 0.15);

/* Dark-mode glass (on dark backgrounds) */
--glass-bg-dark:  rgba(255, 255, 255, 0.06);
--glass-border-dk:rgba(255, 255, 255, 0.12);
--glass-shine-dk: rgba(255, 255, 255, 0.80);
```

---

## Next.js File Structure

```
app/
├── layout.tsx                    ← Mount <GlassFilterProvider> here
├── globals.css                   ← Glass CSS variables + keyframes
└── components/
    └── glass/
        ├── GlassFilterProvider.tsx   ← Hidden SVG filters (once, at root)
        ├── GlassCard.tsx
        ├── GlassNav.tsx
        ├── GlassButton.tsx
        ├── GlassInput.tsx
        ├── GlassModal.tsx
        └── GooToggle.tsx
```
