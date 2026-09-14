---
name: gsap-advanced-animations
description: >
  A battle-tested library of GSAP animation patterns reverse-engineered from
  real Awwwards-level, production open-source sites. Use this skill whenever
  the user mentions GSAP, scroll animations, smooth scroll, hero reveals,
  preloaders, text splitting, pinned sections, marquees, magnetic buttons,
  cursor effects, page transitions, parallax, or awwwards-style motion — even
  if they just say "make it feel premium" or "add animations". This skill
  contains ready-to-drop code, not tutorial boilerplate. Always activate it
  when animation quality matters.
---

# GSAP Advanced Animations Skill

### 🌟 Master Live Demos
We have extracted and codified **20 distinct, production-grade animation patterns** from 5 Awwwards-winning repos. 
Instead of guessing how they work, open these fully interactive standalone files to see the raw HTML/CSS/JS for each effect:
- **`public/gsap_animations_demo.html`**: The complete Master Suite containing all 20 patterns.
- **`public/gsap_cards_demo.html`**: A dedicated suite focusing purely on the 10 advanced Card/Item animation patterns (including scaling decks, 3D fly-throughs, and horizontal pins).

Patterns extracted from 5 real production repos:

| # | Repo | Stack | Key GSAP Patterns |
|---|------|-------|-------------------|
| 1 | `portfolio-prashant` | Vanilla JS + Vite | ScrollTrigger, Lenis, scaleY transitions, scrub parallax, 3D z-axis card fly-through, physics particle explosion |
| 2 | `truus-awwward` (Next.js) | Next.js 15 + Lenis | `quickTo` cursor, SVG strokeDash transitions, elastic wiggle, scroll-aware navbar color-swap, CSS marquee columns |
| 3 | `hetari-portfolio` | Vue 3 + Vite + Lenis | Dedicated `animations/index.ts`, `quickTo` magneto buttons, MotionPath, `power4.inOut` hero reveal, SplitText char stagger |
| 4 | `capsule` | React + Vite | `useGSAP` hook, `gsap.context()`, SplitText preloader, pinned horizontal showcases, scroll-direction marquee |
| 5 | `spylt-milk` | React + Vite | `ScrollSmoother`, text wipe clipPaths, `SplitText.create()` + `clipPath` hero reveal, `useGSAP` with `scrollTrigger` |

---

## The 20 Codified Patterns
*(Find the full working code for all of these in `public/gsap_animations_demo.html`)*

**Text & UI Reveals**
1. SplitText ClipPath Wipe (Text revealing from bottom up out of nowhere)
2. Magnetic Button (`quickTo` followers with elastic snapping)
3. Word Color Scrub (Text characters lighting up smoothly on scroll)
4. Counter Roll (Numbers rolling up slot-machine style)
5. Loading Text Loop (Words sliding in/out sequentially)

**Layout Transitions & Overlays**
6. SVG Scribble Wipe (Path drawing over the screen for page transitions)
7. Scaley Panel Wipe (Accordion or panel scaleY reveals)
8. Circle ClipPath Reveal (Expanding a circular mask to reveal video/images)
9. Staggered Nav Menu Open/Close (Full screen overlay with staggered text entrances)
10. Preloader Progress Bar (Percentage loader with mask expansion)

**Scroll & Parallax Effects**
11. Dual Direction Marquee (Rows moving opposite directions, speeding up on scroll)
12. Testimonial Slider (Vertical sliding overlay reveals)
13. Hero Entrance Sequence (Chained staggered drops and mask wipes)
14. Parallax Floating Tags (Items floating at different speeds/rotations on scroll)

**Advanced Card & Item Interactions (Also in `gsap_cards_demo.html`)**
15. Inertia Fling (Cards popping out on hover, flinging based on mouse velocity)
16. Fan Spread / Cluster Dispersion (Cards fanning out into a deck on hover)
17. Scrubbed ClipPath Image Reveal (Image expanding out of a narrow mask on scroll)
18. True Pinned Horizontal Image Scroll (Track sliding left as container pins)
19. 3D Z-Axis Fly-Through (Cards flying from deep background `z: -1500` past the camera on scroll)
20. Live Pinned Scrub Stack (Scaling Deck - Cards pin at center screen, scaling down as subsequent cards stack over them to create 3D depth)

---

## Quick-Start: Plugin Registration Pattern

Every project registers plugins once at the module/app root — never inside components/loops:

```js
// Vanilla JS (at top of each module that uses them)
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

// React root (App.jsx/tsx) — do ONCE
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother"; // Club plugin
import { SplitText } from "gsap/SplitText";           // Club plugin
import { useGSAP } from "@gsap/react";
gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);

// Vue 3 — in main.ts
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import MotionPathPlugin from "gsap/MotionPathPlugin";
gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);
```

---

## Reference Files

Read these when you need detailed snippets for a specific category:

| File | When to read |
|------|-------------|
| [`references/01-smooth-scroll.md`](references/01-smooth-scroll.md) | Lenis + ScrollSmoother setup, GSAP ticker integration |
| [`references/02-hero-reveals.md`](references/02-hero-reveals.md) | Hero entrance timelines, text reveal, preloaders |
| [`references/03-scroll-animations.md`](references/03-scroll-animations.md) | ScrollTrigger patterns: scrub, pin, snap, toggleActions |
| [`references/04-text-animations.md`](references/04-text-animations.md) | SplitText char/word/line reveals, mask technique |
| [`references/05-cursor-magnetic.md`](references/05-cursor-magnetic.md) | `quickTo` cursor follower, magneto buttons, hover bubbles |
| [`references/06-page-transitions.md`](references/06-page-transitions.md) | scaleY overlay, SVG strokeDash wipe, route transitions |
| [`references/07-marquee.md`](references/07-marquee.md) | Scroll-direction-aware marquee, CSS infinite marquee |
| [`references/08-pinned-sections.md`](references/08-pinned-sections.md) | Pinned scroll, 3D card fly-through, horizontal scroll, scaling stacked decks |
| [`references/09-best-practices.md`](references/09-best-practices.md) | Performance, cleanup, a11y, matchMedia, reduced-motion |

---

## Easing Quick Reference

Patterns found across all 5 repos:

| Use case | Easing | Why |
|----------|--------|-----|
| Hero entrances, preloaders | `power4.inOut` | Strong snap-in feel — dramatic but not bouncy |
| Reveal from below | `power4.out` | Quick settle at the end, natural gravity |
| Scroll-scrubbed | `none` / `power1.inOut` | Linear maps 1:1 to scroll, no overshoot |
| Magnetic/elastic reset | `elastic.out(1, 0.3)` | Spring feel when snapping back to origin |
| Cursor follower | `power3` | Balanced lag without feeling sluggish |
| Menu overlay | `power2.inOut` | Balanced in/out, clean |
| Cursor bubble scale | `elastic.out(1, 0.4)` | Playful pop when hovering interactive elements |
| Cursor hide | `sine.inOut` | Gentle, doesn't draw attention when disappearing |
| Navbar wiggle | `steps(1)` | Instant frame-by-frame jitter, cartoon feel |

---

## Cleanup Pattern (React with `useGSAP`)

```jsx
// CORRECT — gsap.context() scopes and auto-cleans
useLayoutEffect(() => {
  const ctx = gsap.context(() => {
    const split = new SplitText(ref.current, { type: "chars" });
    gsap.from(split.chars, { yPercent: 100, stagger: 0.05 });
    return () => split.revert(); // revert SplitText on cleanup
  });
  return () => ctx.revert(); // kills all GSAP tweens in this scope
}, []);

// OR — useGSAP hook (cleaner in function components)
useGSAP(() => {
  gsap.to(".box", { x: 100, scrollTrigger: { trigger: ".box", start: "top 80%" } });
}, []); // auto-cleanup on unmount
```

---

## Cleanup Pattern (Vanilla JS — Prashant Portfolio approach)

```js
// Kill and re-init on resize instead of matchMedia (simpler for vanilla)
let stInstance = null;
const init = () => {
  if (stInstance) stInstance.kill();
  stInstance = ScrollTrigger.create({ /* ... */ });
};
init();
window.addEventListener("resize", init);
```

---

## ScrollTrigger Instance Array Pattern (About page pattern from Prashant)

```js
let instances = [];
const init = () => {
  instances.forEach(i => i?.kill());
  instances = [];
  const anim = gsap.to(el, { y: -200, scrollTrigger: { scrub: 1, ... } });
  instances.push(anim.scrollTrigger);
};
```
