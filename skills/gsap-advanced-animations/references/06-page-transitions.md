# Page Transition Patterns

## Pattern 1: scaleY Panel Wipe (Vanilla JS)
**Source: `portfolio-prashant/js/transition.js`**

Multi-panel scaleY wipe — the most common awwwards transition. Key detail:
`transformOrigin` switches between `"top"` (reveal) and `"bottom"` (cover) to determine
which direction the panels animate from.

```js
// ── HTML Structure ──
// <div class="overlay overlay-1"></div>
// <div class="overlay overlay-2"></div>
// <div class="overlay overlay-3"></div>

function revealTransition() {
    // Set panels at full height (covering screen), collapse from top
    gsap.set(".transition-overlay", { scaleY: 1, transformOrigin: "top" });
    return gsap.to(".transition-overlay", {
        scaleY: 0,
        duration: 0.6,
        stagger: -0.1,          // NEGATIVE = last panel first (reverse order)
        ease: "power2.inOut",
    });
}

function coverTransition() {
    // Set panels at zero height, expand from bottom
    gsap.set(".transition-overlay", { scaleY: 0, transformOrigin: "bottom" });
    return gsap.to(".transition-overlay", {
        scaleY: 1,
        duration: 0.6,
        stagger: 0.1,           // POSITIVE = first panel first
        ease: "power2.inOut",
    });
}

// ── Click handler ──
document.querySelectorAll("a[href]").forEach(link => {
    link.addEventListener("click", (e) => {
        const href = link.getAttribute("href");
        if (!href || href.startsWith("http") || href === "#") return;
        if (isSamePage(href)) return;

        e.preventDefault();
        coverTransition().eventCallback("onComplete", () => {
            window.location.href = href;
        });
    });
});

// ── On page load, reveal ──
document.addEventListener("DOMContentLoaded", revealTransition);
```

```css
.transition-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    pointer-events: none;
    transform-origin: top;
}
.transition-overlay:nth-child(1) { background: #0a0a0a; z-index: 9999; }
.transition-overlay:nth-child(2) { background: #1a1a1a; z-index: 9998; }
.transition-overlay:nth-child(3) { background: #2a2a2a; z-index: 9997; }
```

---

## Pattern 2: SVG Scribble Wipe (Next.js / React)
**Source: `truus-awwward/components/TransitionScribble.jsx`**

The most unique transition pattern — a large SVG stroke is drawn/undrawn with
`strokeDashoffset` to "scribble" over the screen during navigation.
Uses `window.__lenis` (set by SmoothScroll component) to instantly jump to top
at the midpoint of the transition.

```jsx
'use client';
import { useEffect } from 'react';
import { gsap } from 'gsap';

export default function TransitionScribble() {
    useEffect(() => {
        const path = document.querySelector(".scribble path");
        const svg = document.querySelector(".scribble");
        if (!path || !svg) return;

        const colors = ["#00ff88", "#0088ff", "#ff0066", "#ffaa00"]; // Brand colors

        const runTransition = (e) => {
            if (e) e.preventDefault();
            // Prevent double-trigger
            if (gsap.isTweening(path) || document.body.classList.contains("is-transitioning")) return;

            const pathLength = path.getTotalLength();
            const l = pathLength + 5;
            const color = colors[Math.floor(Math.random() * colors.length)];

            svg.style.color = color;
            gsap.set(path, { strokeDasharray: l, strokeDashoffset: l, strokeWidth: "3%", opacity: 1 });
            gsap.set(svg, { opacity: 1 });

            document.body.classList.add("is-transitioning");

            const tl = gsap.timeline({
                onComplete: () => {
                    document.body.classList.remove("is-transitioning");
                    gsap.set(path, { strokeWidth: "0%" });
                }
            });

            // DRAW: stroke appears (covering the screen)
            tl.to(path, { strokeDashoffset: 0, duration: 0.8, ease: "power1.inOut" }, 0)
              .to(path, { strokeWidth: "60%", duration: 0.8, ease: "power2.inOut" }, 0)

            // MIDPOINT: scroll to top
              .call(() => {
                  const lenis = window.__lenis;
                  if (lenis) lenis.scrollTo(0, { immediate: true });
                  else window.scrollTo(0, 0);
              }, null, 0.8)

            // UN-DRAW: stroke disappears (revealing new content)
              .to(path, { strokeDashoffset: -l, duration: 1.5, ease: "power2.inOut" }, 0.8)
              .to(path, { strokeWidth: "3%", duration: 1.5, ease: "power2.inOut" }, 0.8);

            return tl;
        };

        // Trigger on navigation click, or call directly:
        // runTransition(null)

        document.querySelector(".nav-logo")?.addEventListener("click", runTransition);

        return () => {
            document.querySelector(".nav-logo")?.removeEventListener("click", runTransition);
        };
    }, []);

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="scribble"
            viewBox="0 0 3222 3114"
            fill="none"
            preserveAspectRatio="none"
            style={{
                position: "fixed", inset: 0, width: "100vw", height: "100vh",
                pointerEvents: "none", zIndex: 9999
            }}
        >
            {/* Your SVG scribble path here — draw a chaotic/looping path
                that fills the viewport */}
            <path
                d="M300 454C506 319 711 185 836 110 ..."
                stroke="currentColor"
                strokeLinecap="round"
                style={{ strokeWidth: "0%", strokeDashoffset: "0.001" }}
            />
        </svg>
    );
}
```

---

## Pattern 3: Loader Overlay with SVG Morph (Vue)
**Source: `hetari-portfolio/src/animations/index.ts → animateLoadingPath()`**

Loading screen that slides up (revealing page below) while simultaneously morphing
an SVG path shape. The `<20%` label offset means the path morph starts when the
slide-up is 20% through — creates coordinated "unfolding" effect.

```js
function animateLoadingScreen(pathRef, targetPathData, onComplete) {
    const tl = gsap.timeline({});

    // 1. Loading screen slides up (reveals content below)
    tl.to("#loading-screen", {
        delay: 3,       // Wait for content to be ready
        bottom: "100%", // Slide to top of viewport and beyond
        duration: 1,
        ease: "power2.inOut",
        onStart: () => {
            setTimeout(() => {
                // Fire hero entrance 120ms after slide starts
                // (slight delay prevents jarring simultaneous reveal + animation)
                animateHeroNav();
                document.body.classList.remove("no-scroll");
                window.scrollTo(0, 0);
            }, 120);
        },
    });

    // 2. SVG path morphs simultaneously (starts when slide is 20% done)
    tl.to(pathRef, {
        duration: 1,
        attr: { d: targetPathData }, // Morph to new path shape
        ease: "power2.inOut",
        onComplete: () => {
            gsap.set("#loading-screen", { display: "none" }); // Remove from layout
            if (onComplete) onComplete();
        },
    }, "<20%"); // '<20%' = offset from previous tween's start by 20%

    return tl;
}

// Text cycling during load
function animateLoadingText(textSelector) {
    gsap.to(textSelector, {
        y: 0,
        duration: 1,
        ease: "power2.inOut",
        delay: 0.5,
        stagger: 0.1,
        onComplete: () => {
            gsap.to(textSelector, {
                delay: 1.2,
                opacity: 0,
                duration: 1,
                ease: "power2.inOut",
                onComplete: () => {
                    gsap.set(textSelector, { y: "100%", opacity: 1 });
                    // Ready for next text cycle
                },
            });
        },
    });
}
```

---

## Pattern 4: Instant Scroll-to-Top During Transition
**Source: `truus-awwward/components/TransitionScribble.jsx`**

When transitioning between sections/pages, always scroll to top at the midpoint
of the transition (when screen is fully covered). Lenis needs a special API call,
not `window.scrollTo` which Lenis ignores.

```js
// After transition covers the screen:
const scrollToTop = () => {
    const lenis = window.__lenis;
    if (lenis) {
        lenis.scrollTo(0, { immediate: true }); // Instant, no animation
    } else {
        window.scrollTo(0, 0);
    }
    // Refresh ScrollTrigger so all triggers recalculate from new scroll position
    ScrollTrigger.refresh();
};
```
