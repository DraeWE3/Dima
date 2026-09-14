# Ryvon CSS Patterns — Enhanced Reference

This file documents the full enhanced CSS pattern system derived from `app/globals.css`.
Loaded when implementing Figma-to-code conversions in this project.

---

## Design Token System

### Theming Architecture
The project uses a **three-layer token system**:

```
Layer 1: Raw CSS custom properties on :root / .dark (HSL values)
         ↓
Layer 2: @theme block maps to Tailwind color tokens
         ↓
Layer 3: Component classes consume via var(--color-*) or Tailwind utilities
```

This means `bg-background`, `text-foreground`, etc. are valid Tailwind tokens
that resolve to the current theme's values.

### Light Mode Tokens
```css
:root {
  --background: hsl(0 0% 100%);
  --foreground: hsl(240 10% 3.9%);
  --primary: hsl(240 5.9% 10%);
  --secondary: hsl(240 4.8% 95.9%);
  --muted: hsl(240 4.8% 95.9%);
  --muted-foreground: hsl(240 3.8% 46.1%);
  --accent: hsl(240 4.8% 95.9%);
  --destructive: hsl(0 84.2% 60.2%);
  --border: hsl(240 5.9% 90%);
  --ring: hsl(240 10% 3.9%);
  --radius: 0.5rem;
}
```

### Dark Mode Tokens (Primary Mode for Ryvon)
```css
.dark {
  --background: hsl(240 10% 3.9%);    /* near-black */
  --foreground: hsl(0 0% 98%);         /* near-white */
  --card: hsl(240 10% 3.9%);
  --muted: hsl(240 3.7% 15.9%);
  --muted-foreground: hsl(240 5% 64.9%);
  --border: hsl(240 3.7% 15.9%);
}
```

### Custom Brand Tokens (Ryvon-specific, not in Tailwind theme)
```css
/* Direct hex values used throughout the codebase */
#0080FF    /* primary blue — borders, glows, gradients */
#1882D9    /* mid blue — dot-active, circles, gradients */
#32A2F2    /* light blue — success toasts, active borders */
#3071E1    /* gradient end */
#8CDFF4    /* gradient start (light cyan) */
#9d9e9f    /* muted gray text */
#000000    /* true black backgrounds */
#070a13    /* canvas/code preview bg */
```

---

## Component Pattern Library

### Pattern 1: Full-Bleed Background Page
```css
.page-name {
  background-image: url('/img/[name].webp');
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  width: 100%;
  height: 100dvh;           /* use dvh for mobile viewport */
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  align-items: center;
  flex-direction: column;
}
```
**Key**: Always `100dvh` (dynamic viewport height), always `overflow-x: hidden`.

---

### Pattern 2: Glass Card (Primary)
```css
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.089);
  border-radius: 1rem;         /* = 16px */
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

**Variants by opacity:**
- Ultra-subtle: `rgba(255,255,255,0.02)` bg
- Settings card: `rgba(8, 14, 25, 0.35)` bg + `blur(12px)`
- Login card: `rgba(13, 43, 74, 0)` bg + `blur(1px)` + `border-radius: 32px`
- Sidebar footer: `rgba(0, 0, 0, 0.4)` + `blur(10px)` + `border-radius: 20px`

---

### Pattern 3: Primary Gradient Button (CTA)
```css
.generate-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  background-image: linear-gradient(to right, #8CDFF4, #3071E1);
  border-radius: 5rem;
  padding: 0.6rem 1rem;
  cursor: pointer;
  color: #fff;
  font-family: motive-semi;
  font-size: 13px;
}
```

**Login variant** (vertical gradient):
```css
background: linear-gradient(135deg, #8CDFF4 0%, #3071E1 100%);
border-radius: 50px;
box-shadow: 0 6px 20px rgba(110, 201, 245, 0.35),
            0 2px 8px rgba(110, 201, 245, 0.25);
```

---

### Pattern 4: Side-Stripe Glass Button (nav/utility)
```css
.btn {
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
  padding: 0.6rem 1.2rem;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  cursor: pointer;
}

.btn p {
  font-family: motive-reg;
  font-size: 13px;
  background: linear-gradient(to bottom, #ffffff, #9d9e9f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
}
```
**Note**: The two `background-image` gradients are 1px-wide vertical stripes on left and right edges — simulating side borders with color.

---

### Pattern 5: Gradient Text
```css
/* Standard white-to-gray gradient text (all headings and nav labels) */
.gradient-text {
  background: linear-gradient(to bottom, #ffffff, #9d9e9f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Always pair these two — -webkit prefix required for Safari */
```

---

### Pattern 6: Blur Orb Decoration
```css
/* Placed absolute inside a relative parent */
.blur-orb {
  width: 10rem;
  height: 10rem;
  background: #0080FF;     /* or #1882D9 */
  position: absolute;
  border-radius: 50%;
  filter: blur(50px);
  opacity: 0.5;
  z-index: 0;
  pointer-events: none;
}

/* Common positions */
/* Top-center (suggestion card): top: -95%; left: 50%; transform: translate(-50%); */
/* Top-left (login card):        top: -25%; left: -20%; */
/* Bottom-right (login card):    bottom: -25%; right: -20%; */
/* Top fade (agent bg):          position absolute, height: 200px, gradient overlay */
```

---

### Pattern 7: Gradient Border (::before technique)
```css
.gradient-border-element {
  position: relative;
  background: black;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gradient-border-element::before {
  content: "";
  position: absolute;
  inset: -1px;
  z-index: -1;
  background: linear-gradient(to right, #8CDFF4, #3071E1);
  border-radius: inherit;
}
```

---

### Pattern 8: Chat Input Box
```css
.chatinput {
  border-radius: 1rem;
  overflow: hidden;
  border-top: 1px solid #0080FF;
  border-bottom: 1px solid #000000;
  background-color: #000000;
  background-image:
    linear-gradient(#0080ff63, #000000),
    linear-gradient(#0080ff37, #000000);
  background-size: 1px 100%;
  background-position: 0 0, 100% 0;
  background-repeat: no-repeat;
  box-shadow: inset 0 -12px 24px #0080ff41;   /* bottom glow */
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-direction: column;
  width: 100%;
}
```
**Key detail**: `inset 0 -12px 24px #0080ff41` creates the blue bottom-edge glow inside the input.

---

### Pattern 9: Slide-In Side Panel
```css
.side-panel {
  position: fixed;
  top: 0;
  right: -110%;
  width: min(300px, 80%);
  height: 100dvh;
  background-color: #000;
  z-index: 2000;
  transition: right 0.4s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.4s;
  border-left: 1px solid #32A2F2;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.5);
  visibility: hidden;
}

.side-panel.open {
  right: 0;
  visibility: visible;
}

/* Overlay */
.side-panel-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  z-index: 1999;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
  pointer-events: none;
}

.side-panel-overlay.active {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}
```

---

### Pattern 10: Skeleton Loading
```css
.skeleton * { pointer-events: none !important; }

.skeleton *[class^="text-"] {
  color: transparent;
  border-radius: 0.375rem;
  background-color: rgba(var(--foreground), 0.2);
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  user-select: none;
}

.skeleton .skeleton-bg { background-color: rgba(var(--foreground), 0.1); }
.skeleton .skeleton-div { background-color: rgba(var(--foreground), 0.2); animation: pulse ...; }
```

---

### Pattern 11: Active Indicator (dot/pill)
```css
.indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.dot {
  width: 0.3rem;          /* 4.8px */
  height: 0.3rem;
  background-color: #9d9e9f;
  border-radius: 50%;
}

.dot-active {
  width: 1.2rem;          /* 19.2px */
  height: 0.3rem;
  background-color: #1882D9;
  border-radius: 5rem;
  box-shadow:
    0 0 6px #1882d9a2,
    0 0 20px #1882d977;
}
```

---

### Pattern 12: Input Field (login/forms)
```css
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.171);
  border: 1px solid rgba(65, 120, 165, 0.3);
  border-radius: 50px;
  padding: 0 24px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: inset 0 1px 14px rgba(0, 0, 0, 0.447);
  transition: all 0.3s ease;
}

.input-wrapper:focus-within {
  background: rgba(20, 35, 50, 0.5);
  border-color: rgba(110, 201, 245, 0.5);
  box-shadow:
    0 4px 16px rgba(110, 201, 245, 0.2),
    0 0 0 3px rgba(110, 201, 245, 0.1),
    inset 0 1px 1px rgba(255, 255, 255, 0.1);
}

.input-field {
  flex: 1;
  background: transparent !important;
  border: none !important;
  outline: none !important;
  padding: 16px 0 !important;
  font-size: 15px !important;
  color: #ffffff !important;
  font-family: motive-reg !important;
  letter-spacing: 0.2px !important;
}
```

---

### Pattern 13: Settings Glass Card
```css
.settings-glass-card {
  background: rgba(8, 14, 25, 0.35);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 128, 255, 0.2);
  border-top: 1px solid rgba(0, 128, 255, 0.4);   /* slightly brighter top */
  border-radius: 12px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  transition: all 0.3s ease;
}
```
**Note**: Top border is brighter — simulates a light source from above.

---

### Pattern 14: Scrollbar Styling
```css
/* WebKit */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; transition: background 0.2s ease; }
::-webkit-scrollbar-thumb:hover { background: rgba(var(--muted-foreground), 0.5); }
::-webkit-scrollbar-corner { background: transparent; }

/* Firefox */
* { scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
```

---

## Animation Library

### Keyframe: word-pop-in (streaming text reveal)
```css
@keyframes word-pop-in {
  0%   { opacity: 0; transform: translateY(4px) scale(0.88); filter: blur(2px); }
  65%  { opacity: 1; transform: translateY(-1px) scale(1.03); filter: blur(0); }
  100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
}
animation: word-pop-in 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) both;
```

### Keyframe: message-stream-in (whole message reveal)
```css
@keyframes message-stream-in {
  0%   { opacity: 0; transform: translateY(8px); }
  100% { opacity: 1; transform: translateY(0); }
}
animation: message-stream-in 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
```

### Keyframe: bg-shift (animated gradient background)
```css
@keyframes bg-shift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
/* Usage: */
background-size: 200% 200%;
animation: bg-shift 8s ease-in-out infinite;
```

### Keyframe: pulse-blue (pulsing button/element)
```css
@keyframes pulse-blue {
  0%   { transform: scale(1); box-shadow: 0 0 0 0 rgba(48,113,225,0.7); }
  70%  { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(48,113,225,0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(48,113,225,0); }
}
animation: pulse-blue 2s infinite;
```

### Keyframe: ios-bounce (typing indicator dots)
```css
@keyframes ios-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
  30%           { transform: translateY(-4px); opacity: 1; }
}
animation: ios-bounce 1.4s ease-in-out infinite;
```

### Keyframe: shimmer (skeleton/loading)
```css
@keyframes shimmer {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
animation: shimmer 1.5s ease-in-out infinite;
```

### Keyframe: wand-shake (hover effect)
```css
@keyframes wand-shake {
  0%   { transform: rotate(0deg); }
  25%  { transform: rotate(-10deg) scale(1.1); }
  50%  { transform: rotate(10deg) scale(1.1); }
  75%  { transform: rotate(-10deg) scale(1.1); }
  100% { transform: rotate(0deg); }
}
/* Applied on parent hover to child img: */
.parent:hover img { animation: wand-shake 0.4s ease-in-out; }
```

---

## Responsive Breakpoints

```css
/* Desktop-first, with these key breakpoints: */
@media (max-width: 1400px) { /* wide desktop → standard desktop */ }
@media (max-width: 1300px) { /* large monitor breakpoint */ }
@media (max-width: 1024px) { /* tablet landscape — hide desktop nav, show mobile menu */ }
@media (max-width: 960px)  { /* chat layout adjustments */ }
@media (max-width: 768px)  { /* tablet portrait — major layout shifts */ }
@media (max-width: 770px)  { /* slightly above 768 used for chat */ }
@media (max-width: 480px)  { /* mobile portrait — final adjustments */ }
```

**Pattern**: Desktop shows `.desktop-nav`, hides `.mobile-nav-trigger`. At `max-width: 768px`, swap.

---

## Semantic Naming Conventions

The codebase uses **semantic BEM-adjacent naming** with plain kebab-case:

```
Page-level:   .welcome-page, .chat, .settings-bg
Section:      .welcome-top, .chat-top, .chat-section
Card/Panel:   .card, .login-card, .sidebar-footer-card, .glass-card
Navigation:   .sidebar-nav-item, .footer-nav-item, .menu-items
Interaction:  .btn, .generate-btn, .login-button, .google-btn
Input:        .chatinput, .input-wrapper, .input-field
Typography:   .card-p1, .card-p2, .p-bold, .p-norm
Animation:    .animate-*, .animate-ios-bounce, .animate-pulse-blue
State:        .active, .open, .dark
Utility:      .scrollbar-hide, .gradient-border-stop, .wander-shake
```

---

## Icon Sizing Standards

Observed from the codebase:
```
Nav icons:       20×20px (.sidebar-nav-icon)
Logo images:     height: 1.4rem auto
User avatar:     1.6×1.6rem, border-radius: 50%
Button icons:    0.6rem (tiny), 0.9rem (small), 1.4rem (medium)
Feature icons:   1.7rem, 2rem (mic-btn)
Arrow icons:     14×14px
```

---

## Z-Index Scale

```
body content:       1–10
sidebar:            20
sticky headers:     50
mobile menu btn:    1001
side-menu overlay:  1999
side-menu:          2000
```
