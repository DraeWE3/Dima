# ScrollTrigger Animation Patterns

## Pattern 1: Basic Scrub Parallax (Scale + Rotation on Scroll)
**Source: `portfolio-prashant/js/about.js`**

The key distinction from simple fade-ins: these animations use `scrub: 1` (tied to scroll position,
not played once). Each element gets its own ScrollTrigger instance stored in an array for
proper cleanup/re-init on resize.

```js
// Portrait element: scrolls up and rotates as section passes
const portraitAnim = gsap.to(".about-portrait", {
    y: -200,
    rotation: -25,
    scrollTrigger: {
        trigger: ".about-hero",
        start: "top top",     // Pins start when section reaches viewport top
        end: "bottom top",    // Ends when section bottom reaches top
        scrub: 1,             // 1s lag between scroll and animation (smoother than scrub: true)
    },
});

// Decorative tags at different parallax speeds
const tagAnims = [
    { el: "#tag-1", y: -300, rotation: -45 },
    { el: "#tag-2", y: -150, rotation:  70 },
    { el: "#tag-3", y: -400, rotation: 120 },
    { el: "#tag-4", y: -350, rotation: -60 },
    { el: "#tag-5", y: -200, rotation: 100 },
].map(({ el, y, rotation }) =>
    gsap.to(el, {
        y, rotation,
        scrollTrigger: {
            trigger: ".about-copy",
            start: "top bottom",           // Starts when section enters from bottom
            end: "bottom+=100% top",       // Extended end — extra travel distance
            scrub: 1,
        },
    })
);
```

---

## Pattern 2: Scale Pop (Stats reveal on scroll enter)
**Source: `portfolio-prashant/js/about.js`**

One-shot animation (`toggleActions: "play none none none"`) — fires when element enters viewport.
Stagger with `power4.out` gives a "rubber band" pop without actual elastic easing.

```js
gsap.set([".stat-1", ".stat-2", ".stat-3"], { scale: 0 });
gsap.to([".stat-1", ".stat-2", ".stat-3"], {
    scale: 1,
    duration: 1,
    stagger: 0.1,
    ease: "power4.out", // Fast initial movement, eases off — more pop than bounce
    scrollTrigger: {
        trigger: ".stats-section",
        start: "top 50%",                       // Half viewport
        toggleActions: "play none none none",    // Play on enter, never reverse
    },
});
```

---

## Pattern 3: Stacked Card Pinning (Services section)
**Source: `portfolio-prashant/js/services.js`**

Each card (except the last) is pinned in place as the next one scrolls over it.
Combined with `scrub` on the inner content creating a "stack" effect.
`pinSpacing: false` is critical — without it, GSAP adds spacing between pinned elements
causing layout shifts.

```js
const services = gsap.utils.toArray(".service-card");

services.forEach((card, index) => {
    const isLast = index === services.length - 1;
    const inner = card.querySelector(".service-card-inner");

    if (!isLast) {
        // Pin each card until the section ends
        ScrollTrigger.create({
            trigger: card,
            start: "top 45%",
            endTrigger: ".contact-cta",
            end: "top 90%",
            pin: true,
            pinSpacing: false, // CRITICAL: prevents gaps between pinned cards
        });

        // Inner content drifts upward as next card approaches
        gsap.to(inner, {
            y: `-${(services.length - index) * 14}vh`, // More travel for earlier cards
            ease: "none",                               // Linear — tied to scroll
            scrollTrigger: {
                trigger: card,
                start: "top 45%",
                endTrigger: ".contact-cta",
                end: "top 90%",
                scrub: true,
            },
        });
    }
});
```

---

## Pattern 4: 3D Card Fly-Through (Featured Work)
**Source: `portfolio-prashant/js/featured-work.js`**

This is the most complex pattern — cards start far behind the "camera" in 3D space (z: -1500)
and fly toward the viewer as the user scrolls. The `onUpdate` callback drives everything
manually for fine-grained control over stagger offsets.

```js
// Initial state: cards scattered in XY space, pushed deep in Z
const positions = [
    { y: 100, x: 1000 }, { y: 1500, x: 100 }, /* ... more positions */
];
cards.forEach((card, i) => {
    gsap.set(card, { x: positions[i].x, y: positions[i].y, z: -1500, scale: 0 });
});

ScrollTrigger.create({
    trigger: ".featured-work",
    start: "top top",
    end: `+=${window.innerHeight * 5}px`, // 5 viewport heights of scroll
    pin: true,
    scrub: 1,
    onUpdate: (self) => {
        const progress = self.progress; // 0 → 1

        // Horizontal title scroll
        gsap.set(".featured-titles", { x: -(window.innerWidth * 4) * progress });

        // Cards fly in with manual stagger
        cards.forEach((card, index) => {
            const staggerOffset = index * 0.075;
            const rawProgress = (progress - staggerOffset) * 2;
            const p = Math.max(0, Math.min(1, rawProgress)); // Clamp 0–1

            // Z from -1500 to +1500 (card flies through camera)
            gsap.set(card, {
                z: -1500 + 3000 * p,
                scale: Math.max(0, Math.min(1, p * 10)), // Quick scale-up
            });
        });
    },
});
```

---

## Pattern 5: Hero Scroll-out (Section leaves viewport)
**Source: `hetari-portfolio/src/animations/index.ts → animateAboutMeSectionLeave()`**

A subtle but effective pattern — the current section scales down and drifts up as
the user scrolls out, making the transition to the next section feel dimensional.

```js
function sectionScrollOut(selector) {
    gsap.to(selector, {
        yPercent: -10,
        scale: 0.95,
        ease: "power1",    // Very gentle — barely perceptible during the scroll
        scrollTrigger: {
            trigger: selector,
            start: "75% bottom", // Triggers when 75% of section is above viewport center
            scrub: 1,
        },
    });
}

// Usage
sectionScrollOut("#about-section");
sectionScrollOut("#hero-section");
```

---

## Pattern 6: Horizontal Pinned Scroll (Flavor Slider)
**Source: `spylt-milk/client/src/sections/FlavorSection.tsx`**

Horizontal scroll that maps to vertical scroll progress.
`scrollAmount` is calculated dynamically from the actual scroll width of the inner container.

```tsx
useGSAP(() => {
    const slider = document.querySelector(".flavor-scroll-inner");
    // Distance to scroll = overflow width of inner container
    const scrollAmount = slider.scrollWidth - window.innerWidth;

    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: ".flavor-section",
            start: "top 0%",
            end: "+=4000",   // Adjust: more scroll = slower horizontal speed
            scrub: true,
            pin: true,
        },
    });

    tl.to(".flavor-scroll-inner", {
        x: `-${scrollAmount}px`,
        ease: "power1.inOut", // Slight ease prevents abrupt start/stop
    });
}, []);
```

---

## ScrollTrigger Configuration Quick Reference

```js
ScrollTrigger.create({
    trigger: ".element",

    // ── Position ──
    start: "top 80%",       // "element-edge viewport-edge" or "Xpx" or "X%"
    end: "bottom 20%",      // Can also be: "+=500px" (500px from start)
    endTrigger: ".other",   // Different element for end calculation

    // ── Pinning ──
    pin: true,              // Pin trigger element
    pin: ".other",          // Pin a different element
    pinSpacing: false,      // Don't add spacing for pinned element
    anticipatePin: 1,       // Pre-pin 1s early to avoid flicker

    // ── Scrub ──
    scrub: true,            // Instant tie to scroll
    scrub: 1,               // 1s lag (smooth)
    scrub: 0.5,             // 0.5s lag (faster response)

    // ── Toggle Actions: onEnter onLeave onEnterBack onLeaveBack ──
    toggleActions: "play none none none",    // Plays once, never reverses
    toggleActions: "play pause reverse pause", // Full bidirectional
    toggleActions: "play none none reverse", // Play on enter, reverse on leave-back

    // ── Snap ──
    snap: { snapTo: "labels", duration: 0.3, ease: "power1.inOut" }, // Snap to timeline labels
    snap: 1 / numSections,  // Snap to each section boundary

    // ── Debug ──
    markers: true,          // Shows start/end lines (remove in production!)
    id: "my-trigger",       // For ScrollTrigger.getById("my-trigger")
});
```
