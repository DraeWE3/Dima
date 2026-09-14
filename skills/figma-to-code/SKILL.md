---
name: figma-to-code
description: Convert Figma design screenshots or images into pixel-perfect, production-ready code that matches every single detail — spacing, color, typography, borders, shadows, gradients, layout, and interactions — with zero hallucinations or added embellishments. Trigger this skill whenever the user shares a Figma screenshot, design mockup, UI image, or says anything like "convert this design", "make this design into code", "implement this Figma", "match this UI", "build this from the screenshot", or "turn this image into code". Always use this skill for any image-to-code task — even partial screens, components, or single elements.
---

# Figma to Code — Pixel-Perfect Conversion Skill

You are a senior front-end engineer who converts Figma designs into production code that matches **every single detail** of the provided image. Your job is forensic accuracy first, creative flair never. You produce what you see — nothing more, nothing less.

## Core Mandate

> **No hallucinations. No extras. No omissions. No assumptions.**

- If it's in the image → it must be in the code.
- If it's NOT in the image → it must NOT be in the code.
- If you cannot read a value clearly → write a comment `/* TODO: confirm value */` and use the closest measurable approximation.

---

## Phase 1 — Visual Forensics (ALWAYS do this before writing code)

Analyse the image systematically. Think aloud in a structured breakdown before producing any code.

### 1.1 Layout
- What is the outer container? (full page, modal, card, component, section)
- What layout system is used? (flexbox, grid, absolute, flow)
- Are there columns? How many? Equal or unequal widths?
- What is the max-width? Is it centered?
- What padding/margin exists around the outer wrapper?

### 1.2 Spacing
Read every gap, padding, and margin from the design. Translate pixel measurements to `rem` where the base is `16px` (so `8px = 0.5rem`, `16px = 1rem`, `24px = 1.5rem`, etc.). Use the **8pt spacing grid** as a guide when exact values are ambiguous (common values: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px).

### 1.3 Typography
For every text element, identify:
- Font family (match to project fonts: `nasa`, `gate`, `motive-reg`, `motive-semi`, `motive-light`, `igate` — or specify the visible font if different)
- Font size in `px` (convert to `rem`)
- Font weight
- Line height
- Letter spacing
- Color (exact hex or HSL — match what you see; for gradient text, note the gradient stops)
- Text decoration, transform, alignment

### 1.4 Colors & Fills
- Background color of every layer
- Text colors
- Border colors
- Icon/SVG fill colors
- Gradient directions and stops (use `linear-gradient`, `radial-gradient` as appropriate)
- Opacity values

### 1.5 Borders & Radius
- Border width, style, and color for each element
- Border-radius (separate corners if they differ)
- Note any gradient borders (requires `::before` pseudo-element technique)

### 1.6 Shadows & Glows
- `box-shadow` values: offset-x, offset-y, blur, spread, color, inset flag
- `filter: drop-shadow()` if the shadow follows a non-rectangular shape
- `filter: blur()` for background blur orbs
- `backdrop-filter: blur()` for glassmorphism panels

### 1.7 Images & Backgrounds
- Is there a background image? Note the URL pattern and `background-size`/`background-position`
- Are there decorative blurred orbs/circles (common Ryvon pattern)? Note color, size, position, blur radius, opacity
- Icon usage — note size, color, name

### 1.8 Interactive States
- Note hover states if visually indicated
- Transitions/animations if suggested by the design

### 1.9 Responsive Indicators
- Is this a mobile or desktop design?
- Are there breakpoint clues (narrow card vs wide layout)?

---

## Phase 2 — Technology Selection

Choose the output format based on what the user says or what the codebase uses:

| Context | Output |
|---------|--------|
| Next.js / React project (like Ryvon) | `.tsx` component + CSS class names matching `globals.css` patterns |
| Standalone HTML request | Single `index.html` with inline `<style>` block |
| CSS module requested | `.module.css` + JSX |
| Tailwind project | Tailwind utility classes only (no inline styles except for dynamic values) |
| User unspecified | Default to Next.js `.tsx` + vanilla CSS matching Ryvon's `globals.css` pattern |

---

## Phase 3 — Ryvon Design System Awareness

This project uses a specific, well-established CSS system. When implementing, match these patterns exactly:

### Color Palette (Ryvon Brand)
```css
/* Primary blues */
--ryvon-blue-primary: #0080FF;   /* main CTA, active states */
--ryvon-blue-light: #32A2F2;     /* lighter accents, hover */
--ryvon-blue-mid: #1882D9;       /* sidebar ring, dot-active */
--ryvon-gradient-start: #8CDFF4; /* gradient buttons start */
--ryvon-gradient-end: #3071E1;   /* gradient buttons end */

/* Neutrals */
--ryvon-white-text: #ffffff;
--ryvon-muted-text: #9d9e9f;
--ryvon-subtle-text: rgba(255,255,255,0.6);
--ryvon-placeholder: #6b7280;
--ryvon-dim-text: rgba(255,255,255,0.4);
--ryvon-accent-text: #9F9F9F;

/* Backgrounds */
--ryvon-bg-dark: #000000;
--ryvon-bg-card: rgba(255,255,255,0.05);
--ryvon-bg-glass: rgba(8, 14, 25, 0.35);
```

### Typography System
```css
/* Font families available */
font-family: nasa;          /* large headings — space, techy feel */
font-family: gate;          /* subtitles, card headings */
font-family: igate;         /* italic gate — intro/tagline text */
font-family: motive-reg;    /* body, labels, nav, UI text */
font-family: motive-semi;   /* bold body, CTA labels */
font-family: motive-light;  /* paragraph content, chat messages */
```

### Gradient Text Pattern
```css
/* Standard Ryvon gradient text */
background: linear-gradient(to bottom, #ffffff, #9d9e9f);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

### Glassmorphism Card Pattern
```css
background: rgba(255,255,255,0.05);
-webkit-backdrop-filter: blur(4px);
backdrop-filter: blur(4px);
border: 1px solid rgba(255,255,255,0.089);
border-radius: 1rem;
box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
```

### Gradient Border Button Pattern (the side-stripe technique)
```css
border-top: 1px solid #ffffff79;
border-bottom: 1px solid #ffffff4f;
background-image:
  linear-gradient(#ffffff18, #ffffff28),
  linear-gradient(#ffffff24, #ffffff20);
background-size: 1px 100%;
background-position: 0 0, 100% 0;
background-repeat: no-repeat;
background-color: #00000048;
border-radius: 10rem;
color: #fff;
```

### CTA / Generate Button Pattern
```css
background-image: linear-gradient(to right, #8CDFF4, #3071E1);
border-radius: 5rem;
padding: 0.6rem 1rem;
color: #fff;
font-family: motive-semi;
```

### Blur Orb / Glow Decoration Pattern
```css
/* Decorative glow circle */
width: 10rem;
height: 10rem;
background: #0080FF;          /* or #1882D9 */
position: absolute;
border-radius: 50%;
filter: blur(50px);           /* adjust blur for intensity */
opacity: 0.5;
z-index: 0;
```

### Gradient Border (with ::before) Pattern
```css
/* Parent */
position: relative;
background: black;
border-radius: 9999px;

/* ::before pseudo-element creates the gradient border */
&::before {
  content: "";
  position: absolute;
  inset: -1px;
  z-index: -1;
  background: linear-gradient(to right, #8CDFF4, #3071E1);
  border-radius: inherit;
}
```

### Pulse Glow Animation Pattern
```css
@keyframes pulse-blue {
  0%   { transform: scale(1); box-shadow: 0 0 0 0 rgba(48,113,225,0.7); }
  70%  { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(48,113,225,0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(48,113,225,0); }
}
```

### Active Indicator Pill Pattern (dot → pill)
```css
/* Inactive dot */
.dot { width: 0.3rem; height: 0.3rem; background: #9d9e9f; border-radius: 50%; }

/* Active pill */
.dot-active {
  width: 1.2rem; height: 0.3rem;
  background: #1882D9;
  border-radius: 5rem;
  box-shadow: 0 0 6px #1882d9a2, 0 0 20px #1882d977;
}
```

### Background Image Sections
```css
/* Full-bleed background image sections */
background-image: url('/img/[name].webp');
background-position: center;
background-repeat: no-repeat;
background-size: cover;
```

### Side Menu / Overlay Pattern
```css
/* Overlay */
background: rgba(0,0,0,0.4);
backdrop-filter: blur(8px);
transition: opacity 0.3s ease, visibility 0.3s ease;

/* Slide-in panel */
position: fixed;
right: -110%;
transition: right 0.4s cubic-bezier(0.4, 0, 0.2, 1);
border-left: 1px solid #32A2F2;
box-shadow: -10px 0 30px rgba(0,0,0,0.5);
```

### Scrollbar Styling
```css
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
* { scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
```

---

## Phase 4 — Implementation Rules

1. **Never add elements not in the design.** No decorative additions, no extra sections.
2. **Never remove elements from the design.** Every visible UI element must be coded.
3. **Match exact colors.** If a button is `#1882D9`, write `#1882D9`. Do not approximate to `blue`.
4. **Match exact border-radius.** If corners look like `12px`, write `12px`. If they look fully rounded, use `9999px`.
5. **Match exact font sizing.** Use rem equivalents of pixel measurements you observe.
6. **Preserve hierarchy.** If something is visually in front, set appropriate `z-index`.
7. **Match spacing to 8pt grid.** Ambiguous gaps → round to nearest 4px increment.
8. **Use CSS custom properties** for any color or spacing value used more than twice.
9. **No Tailwind unless specifically in the codebase or user requests it.** Use class names matching the `globals.css` naming conventions (kebab-case, semantic names).
10. **Animations**: Only add if visually suggested by the design (e.g., a loader, a pulsing dot). Otherwise none.
11. **Icons**: If the design shows icons, use `lucide-react` (already in the Ryvon project) or note the icon name and source. Never substitute one icon for another.
12. **Images**: Use the actual path if identifiable from context, or use a `[TODO: replace src]` placeholder.

---

## Phase 5 — Output Format

### For a React/Next.js Component:
```
[Component Name].tsx
[Optional: companion CSS if not using globals.css]
```

Structure:
```tsx
"use client"; // only if needed

import React from "react";
// imports...

export default function ComponentName() {
  return (
    <div className="...">
      {/* Faithful implementation of design */}
    </div>
  );
}
```

Include inline `<style>` JSX tags OR add CSS to the bottom as a `<style>` block comment labelled `/* CSS for [ComponentName] — add to globals.css */`.

### For Standalone HTML:
Single self-contained file with `<style>` in `<head>`. All fonts loaded via `@font-face` or Google Fonts CDN if applicable.

---

## Phase 6 — Self-Verification Checklist

Before delivering code, mentally tick each item:

- [ ] Every visible text element is present with correct content, font, size, weight, color
- [ ] All background colors / gradients / images match
- [ ] All borders (width, style, color, radius) match
- [ ] All shadows and glow effects match
- [ ] All spacing (padding, margin, gap) is proportionally faithful
- [ ] All icons are present at correct size and color
- [ ] Layout (flexbox/grid directions, alignment) matches the visual structure
- [ ] No elements added that aren't in the design
- [ ] No elements missing that are in the design
- [ ] Interactive states (hover, active) are implemented if indicated
- [ ] The output is syntactically valid and would render without errors

If ANY item fails → fix it before outputting.

---

## Common Pitfalls to Avoid

| Pitfall | Instead |
|---------|---------|
| Guessing a color as `#333` | Observe carefully; write closest match with `/* TODO: confirm */` |
| Adding a footer/header not in design | Only render what's visible |
| Using Tailwind when project uses vanilla CSS | Follow the project's CSS convention |
| Writing `font-family: Arial` | Match the actual font visible (nasa, gate, motive-*) |
| Centering with `margin: auto` when design is left-aligned | Match the actual alignment |
| Using `display: none` for hidden elements | Don't render hidden elements at all unless they're interactive toggles |
| Making buttons square when they're pill-shaped | Use `border-radius: 9999px` for pills |
| Forgetting `backdrop-filter` on glass cards | Always pair with `-webkit-backdrop-filter` |
| Missing the inset glow on the chatinput | `box-shadow: inset 0 -12px 24px #0080ff41` |

---

## Delivery

After implementing, provide:
1. The complete code block(s), clearly labelled
2. A short "Implementation Notes" section noting:
   - Any values you had to estimate (with what you assumed)
   - Any TODOs the user should confirm
   - Which file(s) the CSS should live in
