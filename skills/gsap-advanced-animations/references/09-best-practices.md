# GSAP Best Practices

## Performance

### DO: Transform-only animations (GPU composited)
```js
// ✅ GPU-accelerated: x, y, scale, rotation, opacity
gsap.to(el, { x: 100, y: 50, scale: 1.2, rotation: 45, opacity: 0.5 });

// ❌ Avoid: causes layout recalculation
gsap.to(el, { left: 100, top: 50, width: 200, height: 100 });
```

### DO: Force3D for elements that will animate
```js
// Apply GPU layer BEFORE animation starts
gsap.set([split.chars, ".card", ".overlay"], { force3D: true });
```

### DO: `will-change` in CSS for frequently animated elements
```css
.cursor-follower, .marquee-track, .hero-img { will-change: transform; }
/* BUT: remove after animation if element won't animate again — it's a hint, not free */
```

### DO: `gsap.quickTo` for mouse-driven animations (not tweens in mousemove)
```js
// ✅ Correct — create setters once, call on every mousemove
const xTo = gsap.quickTo(cursor, "x", { duration: 0.5, ease: "power3" });
const yTo = gsap.quickTo(cursor, "y", { duration: 0.5, ease: "power3" });
window.addEventListener("mousemove", e => { xTo(e.clientX); yTo(e.clientY); });

// ❌ Wrong — creates new tween on every mousemove event (massive performance hit)
window.addEventListener("mousemove", e => {
    gsap.to(cursor, { x: e.clientX, y: e.clientY }); // DON'T DO THIS
});
```

### DO: `translateZ: 0` for elements in scroll-scrub animations
```js
gsap.to("#hero", {
    scrollTrigger: { trigger: "#hero", start: "top top", scrub: 1 },
    opacity: 0.5,
    scale: 0.9,
    translateZ: 0, // Forces GPU composite layer
});
```

### DO: `gsap.ticker.lagSmoothing(0)` when using Lenis
```js
// Prevents GSAP from compensating for tab-switch gaps
// (which causes Lenis to jerk on tab re-focus)
gsap.ticker.lagSmoothing(0);
```

---

## Cleanup & Memory Management

### React: Always use `gsap.context()` or `useGSAP`
```jsx
// Pattern 1: useGSAP hook (simplest in function components)
useGSAP(() => {
    const split = new SplitText(ref.current, { type: "chars" });
    gsap.from(split.chars, { yPercent: 100, stagger: 0.05 });
    return () => split.revert(); // Inner cleanup within context
    // Note: gsap tweens auto-cleanup because they're scoped to useGSAP context
}, []);

// Pattern 2: Manual context (for useLayoutEffect or complex setups)
useLayoutEffect(() => {
    const ctx = gsap.context(() => {
        // All GSAP calls here are automatically scoped
        gsap.to(".box", { x: 100 });
    });
    return () => ctx.revert(); // Kills everything in context
}, []);
```

### Vanilla JS: Kill instances before re-init (resize pattern)
```js
// Pattern from prashant portfolio
let stInstance = null;
const initAnimations = () => {
    // Always kill first
    if (stInstance) stInstance.kill();
    // Re-create fresh
    stInstance = ScrollTrigger.create({ /* ... */ });
};
initAnimations();
window.addEventListener("resize", initAnimations);
```

### Always revert SplitText
```js
const split = new SplitText(".text", { type: "chars" });
// ... animations
// On cleanup:
split.revert(); // Restores original HTML — critical for re-init on resize
```

### Kill specific ScrollTrigger instances
```js
// Kill all that belong to a section
ScrollTrigger.getAll()
    .filter(t => t.vars.trigger?.closest?.(".my-section"))
    .forEach(t => t.kill());

// Kill by id
ScrollTrigger.getById("my-trigger")?.kill();

// Kill all (nuclear option — use sparingly)
ScrollTrigger.killAll();
```

---

## Responsive Animations

### Pattern 1: Disable on mobile (Prashant approach)
```js
const initAnimations = () => {
    if (window.innerWidth <= 1000) {
        instances.forEach(i => i?.kill());
        instances = [];
        return; // Exit early — no animations on mobile
    }
    // ... desktop animations
};
```

### Pattern 2: matchMedia (the GSAP-official way)
```js
const mm = gsap.matchMedia();

mm.add("(min-width: 1024px)", () => {
    // Desktop animations
    const tl = gsap.timeline({ scrollTrigger: { /* ... */ } });
    return () => tl.kill(); // Cleanup when media query no longer matches
});

mm.add("(max-width: 1023px)", () => {
    // Mobile animations (or none)
});

// Cleanup on unmount
// mm.revert();
```

### Pattern 3: `useMediaQuery` in React (Capsule / SpyltMilk)
```tsx
import { useMediaQuery } from "react-responsive";

const Component = () => {
    const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
    const isTablet = useMediaQuery({ query: "(max-width: 1024px)" });

    useGSAP(() => {
        if (!isMobile) {
            gsap.to(".hero-img", {
                yPercent: -5, scale: 1.2,
                scrollTrigger: { /* ... */ }
            });
        }
    }, [isMobile]); // Re-run when breakpoint changes
};
```

---

## Accessibility: `prefers-reduced-motion`

Never skip this — it's essential for users with vestibular disorders.

```js
// Check at animation init
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!prefersReducedMotion) {
    // Run full animations
    initAnimations();
    initLenis();
} else {
    // Provide instant-state alternatives
    gsap.set(".hero-content", { opacity: 1, y: 0 }); // Skip entrance
    // Don't init smooth scroll
}

// OR with matchMedia (handles dynamic preference changes):
gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
    // Full animation suite
    initAnimations();
});
```

CSS backup (always include alongside JS):
```css
@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
    }
}
```

---

## Plugin Registration Rules

```js
// ✅ Register plugins ONCE at the app root
gsap.registerPlugin(ScrollTrigger, SplitText, ScrollSmoother);

// ❌ Never inside components/loops
function MyComponent() {
    gsap.registerPlugin(ScrollTrigger); // Harmless but wasteful
}

// ✅ Vue: In main.ts
// ✅ React: In App.tsx or main.tsx
// ✅ Vanilla JS: Once at the top of main.js
```

---

## SplitText Font Loading

**ALWAYS** wait for fonts before splitting. Characters measure incorrectly without fonts loaded,
causing misaligned or collapsed lines.

```js
// ✅ Correct
document.fonts.ready.then(() => {
    const split = new SplitText(".heading", { type: "lines" });
    gsap.from(split.lines, { yPercent: 100, stagger: 0.1 });
});

// ❌ Wrong — fonts may not be loaded yet on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
    const split = new SplitText(".heading", { type: "lines" }); // May measure wrong
});
```

---

## Common Mistakes

| Mistake | Why It's Wrong | Fix |
|---------|---------------|-----|
| `gsap.to` in mousemove handler | Creates thousands of tweens/s | Use `gsap.quickTo` |
| Forgetting `split.revert()` | Leaves SplitText spans in DOM, breaks re-init | Always revert in cleanup |
| No `pinSpacing: false` on stacked pins | Creates unwanted gaps between pinned elements | Add `pinSpacing: false` |
| `ScrollTrigger.refresh()` missing after preloader | All ScrollTrigger positions calculated before page is final height | Call `refresh()` after preloader completes |
| Animating `left`/`top` | Causes layout reflow on every frame | Use `x`/`y` (transforms) |
| `new SplitText` inside scroll callbacks | Re-splits on every scroll event | Split once on mount |
| `markers: true` in production | Shows debug lines to users | Remove before shipping |
