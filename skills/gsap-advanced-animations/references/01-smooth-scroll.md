# Smooth Scroll Setup

## Pattern 1: Lenis + GSAP Ticker (Vanilla JS)
**Source: `portfolio-prashant/js/lenis-scroll.js`**

The key insight: Lenis must be driven by `gsap.ticker` not `requestAnimationFrame` directly,
so that GSAP's ScrollTrigger and Lenis stay in sync on the same frame loop.
`lagSmoothing(0)` prevents GSAP from skipping frames when the tab is hidden (avoids janky resume).

```js
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Responsive settings: mobile lerp is tighter (0.05 = slower, silkier)
// Desktop can go up to 0.1 — feels more responsive
const isMobile = window.innerWidth <= 900;

const lenis = new Lenis({
  duration: isMobile ? 1 : 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Expo easing
  smooth: true,
  smoothTouch: isMobile,        // Only enable on mobile (feels weird on desktop trackpad)
  touchMultiplier: isMobile ? 1.5 : 2,
  lerp: isMobile ? 0.05 : 0.1, // Linear interpolation — lower = silkier, slower
  smoothWheel: true,
  syncTouch: true,
});

// Bridge Lenis scroll events → ScrollTrigger recalculation
lenis.on("scroll", ScrollTrigger.update);

// Drive Lenis with GSAP's ticker (not RAF) so they share the same frame
gsap.ticker.add((time) => { lenis.raf(time * 1000); });

// Disable lag compensation — prevents animation stutters after tab switch
gsap.ticker.lagSmoothing(0);

// Resize: only rebuild if mobile state actually changed (saves unnecessary work)
let _isMobile = isMobile;
window.addEventListener("resize", () => {
  const nowMobile = window.innerWidth <= 900;
  if (nowMobile !== _isMobile) {
    _isMobile = nowMobile;
    lenis.destroy();
    // Re-init with new settings (same pattern as above)
  }
});
```

---

## Pattern 2: Lenis in React (Next.js)
**Source: `truus-awwward/components/SmoothScroll.jsx`**

Returned as a `null` render component — mounts once in the layout, lives for the entire session.
Stores lenis on `window.__lenis` so child components (like TransitionScribble) can call `lenis.scrollTo(0)` during transitions without prop drilling.

```jsx
'use client';
import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function SmoothScroll() {
    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            touchMultiplier: 1.5,
        });

        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => { lenis.raf(time * 1000); });
        gsap.ticker.lagSmoothing(0);

        // Make lenis accessible to child components (avoids prop drilling)
        window.__lenis = lenis;

        // Extra: change tab title when user switches away — a nice touch
        const orig = document.title;
        const onVisible = () => { document.title = document.hidden ? "Hey, come back! 👋" : orig; };
        document.addEventListener('visibilitychange', onVisible);

        return () => {
            lenis.destroy();
            document.removeEventListener('visibilitychange', onVisible);
            delete window.__lenis;
        };
    }, []);

    return null; // No DOM output — purely behavioral
}
```

Mount in `layout.tsx` (or App root):
```jsx
// layout.tsx
import SmoothScroll from '@/components/SmoothScroll';
export default function RootLayout({ children }) {
    return <html><body><SmoothScroll />{children}</body></html>;
}
```

---

## Pattern 3: ScrollSmoother (GSAP Club Plugin)
**Source: `spylt-milk/client/src/App.tsx`**

ScrollSmoother is the GSAP-native alternative to Lenis — requires a Club GSAP subscription.
The key detail: only create it AFTER the preloader completes (`loaded` state), otherwise ScrollTrigger measures wrong heights.

```tsx
// App.tsx
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/all"; // Club plugin
import { useGSAP } from "@gsap/react";
gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

const App = () => {
    const [loaded, setLoaded] = useState(false);

    useGSAP(() => {
        // Don't init smoother until preloader is done — prevents height calculation errors
        if (loaded && !ScrollSmoother.get()) {
            ScrollSmoother.create({
                wrapper: "#smooth-wrapper",
                content: "#smooth-content",
                smooth: 1.5,  // 1.5s lag (higher = silkier)
                effects: true, // Enables data-speed/data-lag attributes on children
            });
            ScrollTrigger.refresh(); // Recalculate all positions after init
        }
    }, [loaded]);

    return (
        <main>
            {!loaded && <PreLoader onComplete={() => setLoaded(true)} />}
            {loaded && (
                <div id="smooth-wrapper">
                    <div id="smooth-content">
                        {/* All page content here */}
                    </div>
                </div>
            )}
        </main>
    );
};
```

Required HTML structure for ScrollSmoother:
```html
<!-- The wrapper must be overflow:hidden; content is what gets translated -->
<div id="smooth-wrapper">
  <div id="smooth-content">
    <!-- everything goes here -->
  </div>
</div>
```
