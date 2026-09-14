# Pinned Sections & Advanced Scroll Patterns

## Pattern 1: StickyCols — Pinned Phase Transitions
**Source: `capsule/frontend/src/components/StickyCols/StickyCols.jsx`**

The most sophisticated pinning pattern: a single pinned section with multiple visual "phases"
choreographed by timeline position. Uses `clipPath` reveals, `opacity/scale` for dismissal,
and SplitText for text transitions between phases.

```jsx
import { useGSAP } from "@gsap/react";
import gsap, { ScrollTrigger, SplitText } from "gsap/all";

const StickyCols = () => {
    useGSAP(() => {
        gsap.registerPlugin(ScrollTrigger, SplitText);

        // 1. Split text elements into lines
        document.querySelectorAll(".text-col h1, .text-col p").forEach(el => {
            const split = new SplitText(el, { type: "lines", linesClass: "line" });
            split.lines.forEach(line => {
                line.innerHTML = `<span>${line.textContent}</span>`;
            });
        });
        ScrollTrigger.refresh(); // Recalculate after DOM mutation

        // 2. Initial states
        gsap.set(".col-1", { opacity: 1 });           // Phase 1 content visible
        gsap.set(".col-2", { x: "-100%", opacity: 0 }); // Phase 2 content hidden left
        gsap.set(".col-3", { y: "100%" });              // Phase 3 image hidden below
        gsap.set(".text-v1 .line span", { yPercent: 0 });   // Text v1 visible
        gsap.set(".text-v2 .line span", { yPercent: -125 }); // Text v2 above (hidden)

        // Image starts at scale > 1 (zoomed in, no clipPath visible)
        gsap.set(".reveal-img", { scale: 1.6, clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)" });

        // 3. Master timeline drives all phases
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: ".sticky-section",
                start: "top 20%",
                end: "+=90%",   // How much scroll controls the whole sequence
                pin: true,      // Section stays fixed
                scrub: 1,       // Tie animation to scroll position
            },
        });

        // ── PHASE 1 → PHASE 2 ──
        tl.to(".col-1", { opacity: 0, scale: 0.8, duration: 0.8 })
          .to(".col-2", { x: "0%", opacity: 1, duration: 0.8 }, "<")
          .to(".col-3-image", { y: "0%", duration: 0.8 }, "<")
          .to(".reveal-img", {
              clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)", // Full reveal
              duration: 0.8,
          }, "<")
          .to(".reveal-img", { scale: 1, duration: 0.8 }, "<"); // Zoom out to normal

        // ── PHASE 2 → PHASE 3 ──
        tl.to(".col-2", { opacity: 0, scale: 0.8, duration: 0.8 })
          // Text swap: v1 slides up, v2 slides in from above
          .to(".text-v1 .line span", { yPercent: -125, duration: 0.8 }, "<")
          .to(".col-3", { x: "0%", duration: 0.8 }, "-=0.8") // Overlap
          .to(".text-v2 .line span", { yPercent: 0, delay: 0.4, duration: 0.8 }, "<");

        return () => {
            ScrollTrigger.getAll().forEach(st => st.kill());
            tl.kill();
        };
    });
    // ... JSX
};
```

---

## Pattern 2: Pinned Horizontal Scroll
**Source: `spylt-milk/client/src/sections/FlavorSection.tsx`**

Standard horizontal scroll — vertical scroll input is remapped to horizontal movement.
The `scrollAmount` is dynamic based on actual content width.

```tsx
useGSAP(() => {
    const slider = document.querySelector<HTMLElement>(".h-scroll-inner");
    if (!slider) return;

    // Dynamic calculation — works for any content width
    const scrollAmount = slider.scrollWidth - window.innerWidth;

    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: ".h-scroll-section",
            start: "top 0%",        // Pin when section reaches top
            end: `+=4000`,          // 4000px of vertical scroll
            scrub: true,            // Tie to scroll position
            pin: true,              // Keep section visible
        },
    });

    tl.to(".h-scroll-inner", {
        x: `-${scrollAmount}px`,
        ease: "power1.inOut",       // Slight ease (not "none") for less jarring ends
    });

    // Mobile: don't pin, show vertically instead
    // (Handled by conditional in the useGSAP callback)
}, []);
```

HTML structure:
```html
<!-- Outer section is what gets pinned -->
<section class="h-scroll-section" style="overflow: hidden;">
    <!-- Inner content is wider than viewport -->
    <div class="h-scroll-inner" style="display: flex; width: max-content;">
        <div class="slide">Slide 1</div>
        <div class="slide">Slide 2</div>
        <div class="slide">Slide 3</div>
    </div>
</section>
```

---

## Pattern 3: Progress Indicator for Pinned Section
**Source: `portfolio-prashant/js/featured-work.js`**

10 dot indicators update opacity based on scroll progress. Built dynamically to
match any number of sections.

```js
// Build indicators dynamically
const indicatorContainer = document.querySelector(".progress-indicators");
for (let i = 0; i < numSections; i++) {
    // Section label
    const label = document.createElement("p");
    label.textContent = `0${i + 1}`;
    indicatorContainer.appendChild(label);
    // 10 dots per section
    for (let d = 0; d < 10; d++) {
        const dot = document.createElement("div");
        dot.className = "indicator-dot";
        indicatorContainer.appendChild(dot);
    }
}

// Update in ScrollTrigger onUpdate
ScrollTrigger.create({
    trigger: ".pinned-section",
    start: "top top",
    end: `+=${window.innerHeight * 5}px`,
    pin: true,
    scrub: 1,
    onUpdate: (self) => {
        const dots = document.querySelectorAll(".indicator-dot");
        const progressPerDot = 1 / dots.length;
        dots.forEach((dot, i) => {
            const dotStart = i * progressPerDot;
            gsap.to(dot, {
                opacity: self.progress > dotStart ? 1 : 0.2,
                duration: 0.3,
            });
        });
    },
});
```

---

## Pattern 4: About Section Parallax Tags
**Source: `portfolio-prashant/js/about.js`**

Multiple decorative elements around a pinned section, each with its own parallax
velocity and rotation. The varied rotations (`-45`, `70`, `120`, `-60`, `100`)
create organic, non-mechanical motion.

```js
// Each tag has different y distance and rotation — key for organic feel
const tagConfigs = [
    { selector: "#tag-1", y: -300, rotation: -45 },
    { selector: "#tag-2", y: -150, rotation:  70 },
    { selector: "#tag-3", y: -400, rotation: 120 },
    { selector: "#tag-4", y: -350, rotation: -60 },
    { selector: "#tag-5", y: -200, rotation: 100 },
];

// IMPORTANT: Only on desktop (>1000px) — these are decorative elements
// that don't work well in a compressed mobile layout
if (window.innerWidth > 1000) {
    tagConfigs.forEach(({ selector, y, rotation }) => {
        if (!document.querySelector(selector)) return;
        gsap.to(selector, {
            y, rotation,
            scrollTrigger: {
                trigger: ".about-content",
                start: "top bottom",      // Starts when about section enters bottom of viewport
                end: "bottom+=100% top",  // Extends 100% beyond section bottom
                scrub: 1,                 // Smooth tie to scroll
            },
        });
    });
}
```

---

## Pattern 5: Portrait Parallax (About Hero)
**Source: `portfolio-prashant/js/about.js`**

A portrait image that moves up and rotates during the hero scroll.
The combination of `y: -200` and `rotation: -25` creates a floating/tilting feel.

```js
gsap.to(".about-portrait", {
    y: -200,        // Moves up 200px relative to its original position
    rotation: -25,  // Tilts counterclockwise during scroll
    scrollTrigger: {
        trigger: ".about-hero",
        start: "top top",       // Pinned-style: starts at top of viewport
        end: "bottom top",      // Ends when section scrolls completely off
        scrub: 1,               // Smooth lag (1s)
    },
});
```

---

## ScrollTrigger End Trigger Pattern

When you want a pin or scroll effect to end based on a DIFFERENT element than the trigger:

```js
// Example: Service cards that stay pinned until the CTA section appears
ScrollTrigger.create({
    trigger: ".service-card",     // The element to watch for START
    start: "top 45%",
    endTrigger: ".contact-cta",  // Watch a DIFFERENT element for END
    end: "top 90%",
    pin: true,
    pinSpacing: false,
});
```

This pattern from Prashant's services section creates a stacked card effect
where ALL cards remain pinned until the CTA section scrolls into view.
