# Text & SplitText Animation Patterns

## Pattern 1: Line-by-line SplitText reveal (Hetari / general)
**Source: `hetari-portfolio/src/animations/index.ts → animateSplitText()`**

The key: each line needs `overflow: hidden` on its PARENT to create the
mask effect where letters slide up from below the baseline, appearing to
emerge from nothing. This is the most canonical Awwwards text pattern.

```js
// Step 1: In CSS — overflow: hidden on the wrapper
// .hero-tagline .line { overflow: hidden; display: block; }

// Step 2: Set initial state (before animation)
// gsap.set(".hero-tagline .letters", { y: "100%", autoAlpha: 0 });

// Step 3: Animate on scroll trigger
function animateSplitText(targetSelector, duration = 0.8, stagger = 0.005, delay = 0) {
    gsap.to(targetSelector, {
        y: 0,
        autoAlpha: 1,       // Combined opacity + visibility (avoids flash on reverse)
        duration: duration,
        stagger: stagger,
        delay: delay,
        ease: "power4.inOut",
        scrollTrigger: {
            trigger: targetSelector,
            start: "top bottom",
            toggleActions: "play none none reverse",
        },
    });
}

// Usage
animateSplitText(".hero-tagline .letters");         // Default
animateSplitText(".section-heading .chars", 1.2, 0.02, 0.3); // Custom timing
```

### Working with Vanilla SplitText (no React)

```js
// Wait for fonts BEFORE splitting — critical for accurate character widths
document.fonts.ready.then(() => {
    const split = new SplitText(".hero-title", {
        type: "chars words lines",  // Can split to multiple levels
        charsClass: "char",
        wordsClass: "word",
        linesClass: "line",
    });

    // GPU-accelerate immediately
    gsap.set(split.chars, { force3D: true });

    // Animate
    gsap.from(split.chars, {
        yPercent: 110,      // Slightly more than 100% to avoid clipping edge case
        stagger: 0.03,
        duration: 1,
        ease: "power4.out",
    });

    // Always revert on component destroy / page transition
    // split.revert();
});
```

---

## Pattern 2: xPercent slide-in (Capsule Preloader)
**Source: `capsule/frontend/src/components/Preloader/Preloader.jsx`**

Character-level x-axis reveal. Start from right (`xPercent: 100`), animate to center (0),
then exit to left (`xPercent: -100`). Creates a "typewriter passing through" effect.

```js
const logoSplit = new SplitText(logoRef.current, {
    type: "chars",
    charsClass: "char",
});

// Apply GPU acceleration immediately post-split
gsap.set(logoSplit.chars, { force3D: true });

// Entry: chars slide in from right
gsap.set(logoSplit.chars, { xPercent: 100 });

const tl = gsap.timeline();
tl.to(logoSplit.chars, {
    xPercent: 0,
    stagger: 0.05,        // 50ms per char — good for 5-10 char words
    duration: 1,
    ease: "power4.inOut",  // The definitive "snap in" ease
})
// Exit: chars continue sliding left
.to(logoSplit.chars, {
    xPercent: -100,
    stagger: 0.05,
    duration: 1,
    ease: "power4.inOut",
}, "-=0.5"); // Overlap by 0.5s with entry exit for fluid transition

// Cleanup (important!)
// logoSplit.revert();
```

---

## Pattern 3: Lines via SplitText with clipPath (StickyCols)
**Source: `capsule/frontend/src/components/StickyCols/StickyCols.jsx`**

Wraps each split line in a `<span>` to create a mask per line, then uses `yPercent`
transitions between two sets of content during a pinned scroll. This creates the
impression of one text morphing into another.

```js
// After SplitText splits into lines, add inner span for masking
const elements = document.querySelectorAll(".col-content h1, .col-content p");
elements.forEach(el => {
    const split = new SplitText(el, { type: "lines", linesClass: "line" });
    split.lines.forEach(line => {
        // Wrap line text in span — the span will animate, the .line is the mask
        line.innerHTML = `<span>${line.textContent}</span>`;
    });
});

// Two text states for the same section
gsap.set(".content-v1 .line span", { yPercent: 0 });   // Visible
gsap.set(".content-v2 .line span", { yPercent: -125 }); // Hidden above

// In pinned scroll timeline, swap between them:
tl
  .to(".content-v1 .line span", { yPercent: -125, duration: 0.8 })
  .to(".content-v2 .line span", { yPercent: 0, delay: 0.4, duration: 0.8 }, "<");
```

Required CSS:
```css
.line {
    overflow: hidden;
    display: block;
}
.line span {
    display: block; /* inline-block also works */
}
```

---

## Pattern 4: Scroll-Triggered Line Reveal with fadeIn
**Source: `hetari-portfolio/src/animations/index.ts → fadeIn()`**

A reusable utility function pattern — the important detail is `autoAlpha` vs `opacity`:
`autoAlpha` also toggles CSS `visibility` which prevents the element from being
tab-focusable when invisible, and avoids subpixel rendering issues on some browsers.

```js
// Reusable fade-in utility
function fadeIn(selector, targetOpacity = 1, duration = 0.5) {
    gsap.to(selector, {
        opacity: targetOpacity,
        duration: duration,
        ease: "power4.inOut",
        stagger: 0.1, // If selector matches multiple elements
        scrollTrigger: {
            trigger: selector,
            start: "top bottom",
            toggleActions: "play none none reverse",
        },
    });
}

// Reset helper (set before animation, not animate)
function resetOpacity(selector, opacity = 0) {
    gsap.set(selector, { opacity });
}

// Typical usage in component init
resetOpacity(".card");
resetOpacity(".heading");
fadeIn(".card");
fadeIn(".heading", 1, 0.8);
```

---

## Pattern 5: SVG Path Stroke Animation (Marquee/Transition)
**Source: `truus-awwward/components/TransitionScribble.jsx` & `DoubleMarquee.jsx`**

Drawing SVG paths by animating `strokeDashoffset`. The key formula:
`strokeDasharray = pathLength + 5` (slight padding prevents visible gap at end).

```js
// Get path length (must be done after DOM is mounted)
const path = document.querySelector(".animated-path");
const pathLength = path.getTotalLength();
const l = pathLength + 5; // Add 5px buffer

// Initial state: fully hidden (offset = full length)
gsap.set(path, {
    strokeDasharray: l,
    strokeDashoffset: l,
    strokeWidth: 2,
    opacity: 1,
});

// Animate: draw stroke from start to end
gsap.to(path, {
    strokeDashoffset: 0,
    duration: 1.5,
    ease: "power2.out",
    scrollTrigger: {
        trigger: ".path-wrapper",
        start: "top 70%",
        toggleActions: "play none none reverse",
    },
});

// To "un-draw" (erase from start): animate offset to -l
gsap.to(path, {
    strokeDashoffset: -l, // Negative = draws/erases in reverse direction
    duration: 1.5,
    ease: "power2.inOut",
});
```

Arrow/underline usage pattern from DoubleMarquee:
```js
// Initial: path hidden
gsap.set(".arrow-path", { strokeDashoffset: 1000 });

// Animated in as part of scroll-triggered timeline
const tl = gsap.timeline({
    scrollTrigger: {
        trigger: ".section",
        start: "top 70%",
        toggleActions: "play none none reverse",
    }
});
tl
  .to(".underline", { scaleX: 1, opacity: 1, duration: 1, ease: "power2.out" })
  .to(".blob-icon", { scale: 1, opacity: 1, rotation: -10, duration: 0.6, ease: "back.out(1.7)" }, "-=0.5")
  .to(".arrow-path", { strokeDashoffset: 0, duration: 1.5, ease: "power2.out" }, "-=0.3");
```
