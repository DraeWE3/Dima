# Marquee & Infinite Scroll Patterns

## Pattern 1: Scroll-Direction-Aware Marquee with `gsap.utils.unitize`
**Source: `capsule/frontend/src/components/Marquee/MarqueeText.jsx`**

The smartest marquee implementation — detects scroll direction and reverses the marquee
on scroll up. Uses `gsap.utils.unitize` with the `modifiers` plugin to loop animation
smoothly without resetting position (the key to a seamless loop).

```jsx
import { useEffect, useRef } from "react";
import gsap from "gsap";

const Marquee = ({ items, speed = 10 }) => {
    const animRef = useRef(null);
    const directionRef = useRef("forward");

    useEffect(() => {
        const startMarquee = (direction = "forward") => {
            if (animRef.current) animRef.current.kill();

            animRef.current = gsap.to(".marquee-track", {
                x: direction === "forward" ? "-100%" : "0%",
                duration: speed,
                repeat: -1,
                ease: "none",       // LINEAR — critical for smooth loop
                modifiers: {
                    // Modulo keeps x within -100% to 0% range for seamless loop
                    x: gsap.utils.unitize(x => parseFloat(x) % 100),
                }
            });

            // Rotate star/icon element on direction change
            gsap.to(".marquee-star", {
                rotation: direction === "forward" ? "+=110" : "-=110",
                duration: 0.5,
                ease: "power2.out",
            });
        };

        startMarquee("forward");

        const onWheel = (e) => {
            const newDir = e.deltaY > 0 ? "forward" : "reverse";
            if (newDir !== directionRef.current) {
                directionRef.current = newDir;
                startMarquee(newDir);
            }
        };

        window.addEventListener("wheel", onWheel);
        return () => {
            window.removeEventListener("wheel", onWheel);
            animRef.current?.kill();
        };
    }, []);

    // Duplicate items for seamless loop
    return (
        <div className="marquee-wrapper" style={{ overflow: "hidden" }}>
            <div className="marquee-track" style={{ display: "flex", width: "200%" }}>
                {[...items, ...items].map((item, i) => (
                    <div key={i} className="marquee-item">{item}</div>
                ))}
            </div>
        </div>
    );
};
```

Required CSS:
```css
.marquee-wrapper { overflow: hidden; white-space: nowrap; }
.marquee-track { display: flex; width: max-content; will-change: transform; }
.marquee-item { flex-shrink: 0; padding: 0 2rem; }
```

---

## Pattern 2: CSS-based Infinite Marquee (No GSAP)
**Source: `truus-awwward/components/DoubleMarquee.jsx` (columns approach)**

Two columns of items that scroll infinitely via pure CSS animation.
Great for logo marquees, brand lists, etc. GSAP only used for entrance animation.

```jsx
// Two vertical columns scrolling at different speeds
const DoubleMarquee = ({ brands }) => {
    const tracks = [brands, [...brands].reverse()]; // Second track goes opposite direction

    return (
        <div className="double-marquee">
            {tracks.map((trackItems, colIndex) => (
                <div key={colIndex} className={`marquee-column column-${colIndex}`}>
                    <div className="marquee-track">
                        {/* Duplicate for seamless loop */}
                        {[...trackItems, ...trackItems].map((brand, i) => (
                            <div key={i} className="marquee-item">
                                <img src={brand.logo} alt={brand.name} />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};
```

```css
.marquee-column {
    overflow: hidden;
    height: 100%;
}
.marquee-track {
    display: flex;
    flex-direction: column;
    animation: marquee-scroll 20s linear infinite;
    will-change: transform;
}
.column-1 .marquee-track {
    animation-direction: reverse; /* Second column goes opposite */
    animation-duration: 15s;      /* Different speed for visual variety */
}
@keyframes marquee-scroll {
    0%   { transform: translateY(0); }
    100% { transform: translateY(-50%); } /* -50% because content is duplicated */
}
/* Pause on hover */
.marquee-column:hover .marquee-track { animation-play-state: paused; }
```

### GSAP Entrance Animation for Marquee Section

```js
// From truus-awwward DoubleMarquee.jsx
gsap.registerPlugin(ScrollTrigger);

// Set initial states
gsap.set(".section-underline", { scaleX: 0, opacity: 0 });
gsap.set(".section-icon", { scale: 0, opacity: 0 });
gsap.set(".arrow-path", { strokeDashoffset: 1000 });

const entranceTl = gsap.timeline({
    scrollTrigger: {
        trigger: ".marquee-section",
        start: "top 70%",
        toggleActions: "play none none reverse",
    }
});

entranceTl
    .to(".section-underline", { scaleX: 1, opacity: 1, duration: 1, ease: "power2.out" })
    .to(".section-icon", {
        scale: 1, opacity: 1, rotation: -10,
        duration: 0.6,
        ease: "back.out(1.7)",  // back.out gives a slight overshoot
    }, "-=0.5")
    .to(".arrow-path", {
        strokeDashoffset: 0,
        duration: 1.5,
        ease: "power2.out",
    }, "-=0.3");
```

---

## Pattern 3: Horizontal Text Marquee (Featured Work)
**Source: `portfolio-prashant/js/featured-work.js`**

Long title text that scrolls horizontally across the screen during a pinned scroll section.
The `moveDistance` is calculated as a multiple of viewport width for responsive behavior.

```js
const featuredTitles = document.querySelector(".scrolling-titles");
const moveDistance = window.innerWidth * 4; // 4x viewport width of scroll travel

// Set initial position (titles start visible)
gsap.set(featuredTitles, { x: 0 });

// Inside the ScrollTrigger onUpdate callback:
ScrollTrigger.create({
    trigger: ".featured-section",
    start: "top top",
    end: `+=${window.innerHeight * 5}px`,
    pin: true,
    scrub: 1,
    onUpdate: (self) => {
        // Titles move left proportional to scroll progress
        gsap.set(featuredTitles, {
            x: -moveDistance * self.progress,
        });
    },
});
```

CSS for the scrolling titles:
```css
.scrolling-titles {
    white-space: nowrap;    /* Prevent wrapping */
    display: flex;
    gap: 4rem;
    will-change: transform;
}
```

---

## Pattern 4: Scroll-Velocity Marquee (Advanced)

Combines Lenis scroll velocity with marquee speed for a more physically accurate feel:

```js
import Lenis from "lenis";
import gsap from "gsap";

const marquee = document.querySelector(".marquee-track");
let velocity = 0;
let baseSpeed = 1;
const xTo = gsap.quickTo(marquee, "x", { duration: 0.8, ease: "power3" });

// Get Lenis instance from global
const lenis = window.__lenis;
if (lenis) {
    lenis.on("scroll", ({ velocity: v }) => {
        velocity = v;
    });
}

// Drive in RAF loop
gsap.ticker.add(() => {
    const speed = baseSpeed + Math.abs(velocity) * 0.05;
    // This is simplified — for a production marquee use modifiers as in Pattern 1
    // xTo(-speed);
});
```
