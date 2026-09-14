# Hero Reveals & Preloaders

## Pattern 1: Multi-element Hero Entrance Timeline
**Source: `hetari-portfolio/src/animations/index.ts → animateHeroNav()`**

This fires AFTER the preloader resolves. Everything starts off-screen (via CSS) and
the timeline staggers elements in using `power4.inOut` — the stiffest easing for the
most dramatic "snapping into place" feel used universally in Awwwards sites.

```js
// animateHeroNav — called when preloader completes
function animateHeroNav() {
  // Header slides down from above
  gsap.to("header", { y: 0, duration: 1.5, ease: "power4.inOut" });

  // SVG name paths (each letter is a path) stagger in with micro-delay
  gsap.to("#svg-name g path", {
    y: 0, delay: 0.2, duration: 1.5,
    ease: "power4.inOut",
    stagger: 0.01, // Very tight — 10ms per path element
  });

  // Decorative star element
  gsap.to("#star", { x: 1, delay: 0.2, duration: 1.5, ease: "power4.inOut" });

  // Full-screen overlay slides up to reveal page beneath
  gsap.to(".overlay", {
    y: "100%", delay: 0.2, duration: 1.5,
    ease: "power4.inOut",
    onComplete: () => gsap.set(".overlay", { display: "none" }), // DOM cleanup
  });

  // Profile image scales from 0 (or small) to full size
  gsap.to("#profile-img", { scale: 1, delay: 0.4, duration: 1.5, ease: "power4.inOut" });

  // CTAs and arrows come in from their respective off-screen positions
  gsap.to(["#down-arrow", "#contact-btn", "#available-badge"], {
    x: 0, y: 0, delay: 0.4, duration: 1.5, ease: "power4.inOut",
  });

  // SplitText hero tagline — called after DOM confirms fonts loaded
  // (see text animations reference for animateSplitText details)
  animateSplitText("#tagline .letters", "#tagline .letters", 1.5, 0.005, 0.4);

  // Hero scroll-out: as user scrolls away, hero fades and shrinks
  gsap.to("#hero", {
    scrollTrigger: { trigger: "#hero", start: "top top", scrub: 1 },
    opacity: 0.5,
    scale: 0.9,
    translateZ: 0, // Force GPU layer for performance
  });
}
```

CSS initial states (set in stylesheet, not GSAP, so they work without JS):
```css
header { transform: translateY(-100%); }
.overlay { position: fixed; inset: 0; z-index: 100; }
#profile-img { transform: scale(0.7); }
#down-arrow, #contact-btn { transform: translateX(40px); }
```

---

## Pattern 2: SplitText + clipPath Hero Reveal (SpyltMilk)
**Source: `spylt-milk/client/src/sections/HeroSection.tsx`**

The `clipPath` technique is more powerful than simple y-translate — it reveals text
through a "window" without needing a wrapper element per line. `SplitText.create()` is
the newer API (GSAP 3.12+) that auto-returns an object instead of `new SplitText()`.

```tsx
useGSAP(() => {
    // Wait for custom fonts to load before measuring/splitting
    // (critical — SplitText measures character widths which depend on fonts)
    document.fonts.ready.then(() => {
        const titleSplit = SplitText.create(".hero-title", { type: "chars" });

        const tl = gsap.timeline({ delay: 1 }); // 1s after page loads

        tl
          // 1. Fade in the overall content block
          .to(".hero-content", { opacity: 1, y: 0, ease: "power1.inOut" })
          // 2. Reveal subtitle through clipPath (like a blind opening)
          .to(".hero-subtitle-wrapper", {
              duration: 1,
              clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
              ease: "circ.out",
          }, "-=0.5") // Start 0.5s before previous finishes
          // 3. Characters fly up from below (yPercent: 200 = starts 2x below container)
          .from(titleSplit.chars, {
              yPercent: 200,
              stagger: 0.02,
              ease: "power2.out",
          }, "-=0.5");

        // Scroll-exit: hero tilts and shrinks as user scrolls past
        const heroTl = gsap.timeline({
            scrollTrigger: {
                trigger: ".hero-container",
                start: "1% top", // Tiny offset prevents triggering on load
                end: "bottom top",
                scrub: true,
            }
        });
        heroTl.to(".hero-container", {
            rotate: 7,      // Slight perspective tilt
            scale: 0.9,
            yPercent: 30,   // Drift down as it shrinks
            ease: "power1.inOut",
        });
    });
});

// Required initial CSS state for clipPath reveal:
// .hero-subtitle-wrapper { clip-path: polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%); }
```

---

## Pattern 3: SplitText Preloader with Progress Bar
**Source: `capsule/frontend/src/components/Preloader/Preloader.jsx`**

The most sophisticated preloader pattern — uses `useLayoutEffect` (not `useEffect`)
to ensure DOM measurements happen before paint. Uses `gsap.context()` for clean
scoping and `split.revert()` to restore original DOM on unmount.

```jsx
import React, { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
gsap.registerPlugin(SplitText);

const Preloader = ({ onComplete }) => {
    const logoRef = useRef(null);

    useLayoutEffect(() => {
        let splits = {};

        const ctx = gsap.context(() => {
            // Wait for fonts — critical for SplitText accuracy
            document.fonts.ready.then(() => {
                // Split logo text into individual characters
                const logoSplit = new SplitText(logoRef.current, {
                    type: "chars",
                    charsClass: "char",
                });

                // Apply GPU acceleration immediately after split
                gsap.set([logoSplit.chars], { force3D: true });

                // Split footer text into lines
                splits.footer = new SplitText(".preloader-footer p", {
                    type: "lines", linesClass: "line"
                });

                // ── Initial States ──
                gsap.set(logoSplit.chars, { xPercent: 100 }); // Off right
                gsap.set(splits.footer.lines, { yPercent: 100 }); // Off bottom
                gsap.set(".progress-bar", { scaleX: 0 });

                // ── Progress bar animation (fake loading) ──
                function animateProgress(duration = 4) {
                    const tl = gsap.timeline();
                    // 3 random steps that add to 100%
                    [0.3 + Math.random() * 0.2, 0.6 + Math.random() * 0.2, 1].forEach((target, i, arr) => {
                        tl.to(".progress-bar", {
                            scaleX: target,
                            duration: duration / arr.length,
                            ease: "power2.out",
                        });
                    });
                    return tl;
                }

                // ── Master Timeline ──
                const tl = gsap.timeline({ delay: 0.2 });
                tl
                  // Slide chars in from right
                  .to(logoSplit.chars, { xPercent: 0, stagger: 0.05, duration: 1, ease: "power4.inOut" })
                  .add(animateProgress(), "<") // Run progress simultaneously
                  // Footer lines slide up
                  .to(splits.footer.lines, { yPercent: 0, stagger: 0.1, duration: 0.8, ease: "power4.out" }, "0.25")
                  // Exit: chars slide out left
                  .to(logoSplit.chars, { xPercent: -100, stagger: 0.05, duration: 1, ease: "power4.inOut" }, "-=0.5")
                  .to(splits.footer.lines, { yPercent: -100, stagger: 0.1, duration: 0.8, ease: "power4.inOut" }, "<")
                  // Circular mask expands to reveal page
                  .to(".preloader-mask", { scale: 5, duration: 2.5, ease: "power3.out" }, "<")
                  .to(".progress-bar-wrapper", { opacity: 0, duration: 0.5 }, "-=0.25")
                  .set(".preloader", { display: "none" }) // Remove from layout
                  .call(onComplete); // Notify parent preloader is done
            });
        });

        // Cleanup on unmount
        return () => {
            Object.values(splits).forEach(s => s?.revert());
            ctx.revert();
        };
    }, []);

    return (
        <div className="preloader">
            <div className="progress-bar-wrapper">
                <div className="progress-bar" style={{ transformOrigin: "left center" }} />
                <h1 ref={logoRef} className="logo-text">BrandName</h1>
            </div>
            <div className="preloader-mask" /> {/* Circle that expands */}
            <div className="preloader-footer"><p>A tagline for your brand</p></div>
        </div>
    );
};
```

Required CSS for the circular mask reveal:
```css
.preloader { position: fixed; inset: 0; z-index: 9999; background: #000; }
.preloader-mask {
    position: absolute;
    width: 100px; height: 100px;
    border-radius: 50%;
    background: var(--page-bg);
    top: 50%; left: 50%;
    transform: translate(-50%, -50%) scale(1);
}
.progress-bar {
    height: 2px;
    background: currentColor;
    transform-origin: left center;
    transform: scaleX(0);
}
```

---

## Pattern 4: scaleY Overlay Transition (Prashant Portfolio)
**Source: `portfolio-prashant/js/transition.js`**

Simple but effective — multiple `.transition-overlay` elements with staggered scaleY.
Negative stagger on reveal (reverse order = top-down collapse). Positive stagger on exit (bottom-up fill).

```js
// Staggered panel collapse on page ENTER (reveal)
function revealTransition() {
    gsap.set(".transition-overlay", { scaleY: 1, transformOrigin: "top" });
    return gsap.to(".transition-overlay", {
        scaleY: 0,
        duration: 0.6,
        stagger: -0.1, // NEGATIVE stagger = panels reveal from last to first
        ease: "power2.inOut",
    });
}

// Staggered panel fill on page LEAVE (cover)
function coverTransition() {
    gsap.set(".transition-overlay", { scaleY: 0, transformOrigin: "bottom" });
    return gsap.to(".transition-overlay", {
        scaleY: 1,
        duration: 0.6,
        stagger: 0.1, // POSITIVE = panels fill from first to last
        ease: "power2.inOut",
    });
}

// Click handler for internal links
document.querySelectorAll("a[data-transition]").forEach(link => {
    link.addEventListener("click", (e) => {
        if (isSamePage(link.href)) return;
        e.preventDefault();
        coverTransition().then(() => {
            window.location.href = link.href;
        });
    });
});
```

HTML structure:
```html
<!-- 3 panels for a layered wipe effect -->
<div class="transition-overlay" style="background: #111; z-index: 100;"></div>
<div class="transition-overlay" style="background: #222; z-index: 99;"></div>
<div class="transition-overlay" style="background: #333; z-index: 98;"></div>
```
```css
.transition-overlay {
    position: fixed; inset: 0;
    transform-origin: top;
    pointer-events: none;
}
```
