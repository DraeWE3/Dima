# Cursor & Magnetic Interaction Patterns

## Pattern 1: `quickTo` Cursor Follower
**Source: `truus-awwward/components/CursorBubble.jsx` & `VimeoHero.jsx`**

`gsap.quickTo()` is the correct approach for cursor followers — it creates an optimized
setter that avoids creating a new tween on every mousemove event. Using `power3` (not
elastic) keeps the cursor lag feeling purposeful rather than springy.

```jsx
// React implementation (cleanup in useEffect return)
useEffect(() => {
    const cursor = document.querySelector(".custom-cursor");
    if (!cursor) return;

    // Create optimized setters once — don't create tweens in mousemove!
    const xTo = gsap.quickTo(cursor, "x", { duration: 0.5, ease: "power3" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.5, ease: "power3" });

    // Initial state
    gsap.set(cursor, { rotation: -30, scale: 0, opacity: 0 });

    const onMouseMove = (e) => {
        xTo(e.clientX + 13); // Slight offset so cursor tip aligns
        yTo(e.clientY - 43);
    };

    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
}, []);
```

### Hover State: Scale Up with Elastic Bounce

```jsx
// When cursor enters an interactive element
const onMouseOver = (e) => {
    const interactiveEl = e.target.closest("a, button, [data-cursor]");

    if (interactiveEl) {
        gsap.killTweensOf(cursor, "opacity,scale,rotation");  // Prevent conflict
        gsap.to(cursor, {
            opacity: 1,
            scale: 1,
            rotation: 0,        // Straighten up when active
            duration: 1.7,
            delay: 0.1,
            ease: "elastic.out(1, 0.4)",  // Elastic pop — feels playful, not mechanical
        });
        cursor.textContent = "click"; // Optional text change
    }
};

// When cursor leaves an interactive element
const onMouseOut = () => {
    gsap.killTweensOf(cursor, "opacity,scale,rotation");
    gsap.to(cursor, {
        opacity: 1,
        scale: 0,               // Shrink back to invisible
        rotation: -30,          // Return to tilted state
        duration: 0.3,
        ease: "sine.inOut",     // Soft disappear — don't draw attention
    });
};

document.addEventListener("mouseover", onMouseOver);
document.addEventListener("mouseleave", onMouseOut);
```

Vanilla JS version:
```js
const cursor = document.querySelector(".custom-cursor");
const xTo = gsap.quickTo(cursor, "x", { duration: 0.5, ease: "power3" });
const yTo = gsap.quickTo(cursor, "y", { duration: 0.5, ease: "power3" });

window.addEventListener("mousemove", e => {
    xTo(e.clientX);
    yTo(e.clientY);
});
```

Required CSS:
```css
.custom-cursor {
    position: fixed;
    top: 0; left: 0;
    width: 60px; height: 60px;
    border-radius: 50%;
    background: rgba(255,255,255,0.9);
    color: #000;
    font-size: 11px;
    display: flex; align-items: center; justify-content: center;
    pointer-events: none;  /* CRITICAL — never block clicks */
    z-index: 99999;
    transform: translate(-50%, -50%) scale(0);  /* Center on cursor hotspot */
    will-change: transform;
}
body { cursor: none; }  /* Hide system cursor on desktop */
```

---

## Pattern 2: Magnetic Button Effect
**Source: `hetari-portfolio/src/animations/index.ts → activateMagneto()` / `resetMagneto()`**

Uses `quickTo` for both the button element AND its inner text, with different
"strength" multipliers. The text moves more than the container, creating a sense
of depth. `elastic.out(1, 0.3)` gives the spring-back feel on mouseout.

```js
// activateMagneto: called on mousemove over the button
function activateMagneto(event, magnetoEl, magnetoTextEl, strength = 40, textStrength = 40) {
    // Create quickTo setters (ideally created once outside this function)
    const xBtn = gsap.quickTo(magnetoEl, "x", { duration: 1, ease: "elastic.out(1, 0.3)" });
    const yBtn = gsap.quickTo(magnetoEl, "y", { duration: 1, ease: "elastic.out(1, 0.3)" });
    const xText = gsap.quickTo(magnetoTextEl, "x", { duration: 1, ease: "elastic.out(1, 0.3)" });
    const yText = gsap.quickTo(magnetoTextEl, "y", { duration: 1, ease: "elastic.out(1, 0.3)" });

    const { clientX, clientY } = event;
    const { width, height, left, top } = magnetoEl.getBoundingClientRect();

    // Calculate offset from center (normalized -0.5 to 0.5, then scaled)
    const newX = ((clientX - left) / width - 0.5) * strength;
    const newY = ((clientY - top) / height - 0.5) * textStrength;

    xBtn(newX);
    yBtn(newY);
    xText(newX);
    yText(newY);
}

// resetMagneto: called on mouseleave
function resetMagneto(magnetoEl, magnetoTextEl) {
    const xBtn = gsap.quickTo(magnetoEl, "x", { duration: 1, ease: "elastic.out(1, 0.3)" });
    const yBtn = gsap.quickTo(magnetoEl, "y", { duration: 1, ease: "elastic.out(1, 0.3)" });
    const xText = gsap.quickTo(magnetoTextEl, "x", { duration: 1, ease: "elastic.out(1, 0.3)" });
    const yText = gsap.quickTo(magnetoTextEl, "y", { duration: 1, ease: "elastic.out(1, 0.3)" });
    xBtn(0); yBtn(0); xText(0); yText(0);
}
```

### Recommended: Pre-create quickTo setters outside events

```js
function createMagnetoButton(containerEl, textEl, { strength = 40, textStrength = 40 } = {}) {
    // Create setters ONCE — not on every mousemove
    const xBtn = gsap.quickTo(containerEl, "x", { duration: 1, ease: "elastic.out(1, 0.3)" });
    const yBtn = gsap.quickTo(containerEl, "y", { duration: 1, ease: "elastic.out(1, 0.3)" });
    const xText = gsap.quickTo(textEl, "x", { duration: 1, ease: "elastic.out(1, 0.3)" });
    const yText = gsap.quickTo(textEl, "y", { duration: 1, ease: "elastic.out(1, 0.3)" });

    const onMove = (e) => {
        const { width, height, left, top } = containerEl.getBoundingClientRect();
        xBtn(((e.clientX - left) / width - 0.5) * strength);
        yBtn(((e.clientY - top) / height - 0.5) * textStrength);
        xText(((e.clientX - left) / width - 0.5) * textStrength);
        yText(((e.clientY - top) / height - 0.5) * textStrength);
    };
    const onLeave = () => { xBtn(0); yBtn(0); xText(0); yText(0); };

    containerEl.addEventListener("mousemove", onMove);
    containerEl.addEventListener("mouseleave", onLeave);

    // Return cleanup function
    return () => {
        containerEl.removeEventListener("mousemove", onMove);
        containerEl.removeEventListener("mouseleave", onLeave);
    };
}

// Usage
const cleanup = createMagnetoButton(
    document.querySelector(".mag-btn"),
    document.querySelector(".mag-btn-text"),
    { strength: 40, textStrength: 60 }
);
// Call cleanup() on page transition
```

HTML structure:
```html
<!-- Container moves slightly, text moves more -->
<button class="mag-btn" style="position: relative;">
    <span class="mag-btn-text">Get in Touch</span>
</button>
```

---

## Pattern 3: Wiggle on Hover (Navbar Logo)
**Source: `truus-awwward/components/Navbar.jsx → initWiggle()`**

A micro-interaction that feels "alive" — rapid rotation with `steps(1)` easing creates
a cartoon jitter effect (not a smooth rotation). Stops and springs back on mouse leave.

```js
function initWiggle(element, intensity = 8) {
    const target = element.querySelector("[data-wiggle-target]") || element;
    gsap.set(target, { transformOrigin: "center center" });

    let tween;
    const onEnter = () => {
        tween = gsap.to(target, {
            rotation: intensity,
            duration: 0.17,
            repeat: -1,
            yoyo: true,         // Rock back and forth
            ease: "steps(1)",   // Instant snap — cartoonish jitter (not smooth sine)
        });
    };
    const onLeave = () => {
        if (tween) {
            tween.kill();
            gsap.to(target, { rotation: 0, duration: 0.3, ease: "power2.out" });
        }
    };

    element.addEventListener("mouseenter", onEnter);
    element.addEventListener("mouseleave", onLeave);

    return () => {
        element.removeEventListener("mouseenter", onEnter);
        element.removeEventListener("mouseleave", onLeave);
    };
}

// Usage — different intensity for different elements
initWiggle(document.querySelector(".logo"), 8);
initWiggle(document.querySelector(".emoji-icon"), 15);
```

---

## Pattern 4: Mouse Image Trail
**Source: `portfolio-prashant/js/contact.js`**

Images appear at cursor position and fade out — no GSAP tweens on mousemove,
just CSS transitions for performance. GSAP used only for scale-in/out with custom easing.

```js
const config = {
    imageCount: 8,
    imageLifespan: 800,       // ms before image starts fading
    mouseThreshold: 80,       // px movement before new image created
    inDuration: 600,          // ms for scale-in
    outDuration: 800,         // ms for scale-out
    inEasing: "cubic-bezier(.07,.5,.5,1)",
    outEasing: "cubic-bezier(.87, 0, .13, 1)",
};

const images = ["/img/1.jpg", "/img/2.jpg", /* ... */];
const trail = [];
let lastX = 0, lastY = 0;

const createTrailImage = (x, y) => {
    const img = document.createElement("img");
    img.src = images[Math.floor(Math.random() * images.length)];
    img.className = "trail-img";
    const rotation = (Math.random() - 0.5) * 40; // Random tilt -20 to +20 deg
    img.style.cssText = `
        position: absolute;
        left: ${x}px; top: ${y}px;
        transform: translate(-50%, -50%) rotate(${rotation}deg) scale(0);
        transition: transform ${config.inDuration}ms ${config.inEasing};
        pointer-events: none;
        width: 150px;
    `;
    container.appendChild(img);
    requestAnimationFrame(() => {
        img.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(1)`;
    });
    trail.push({ el: img, rotation, removeTime: Date.now() + config.imageLifespan });
};

document.addEventListener("mousemove", (e) => {
    const distance = Math.hypot(e.clientX - lastX, e.clientY - lastY);
    if (distance > config.mouseThreshold) {
        lastX = e.clientX; lastY = e.clientY;
        createTrailImage(e.clientX - container.getBoundingClientRect().left, e.clientY - container.getBoundingClientRect().top);
    }
});

// Cleanup loop — remove old images
const cleanup = () => {
    const now = Date.now();
    if (trail.length && now >= trail[0].removeTime) {
        const { el, rotation } = trail.shift();
        el.style.transition = `transform ${config.outDuration}ms ${config.outEasing}`;
        el.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(0)`;
        setTimeout(() => el.remove(), config.outDuration);
    }
    requestAnimationFrame(cleanup);
};
cleanup();
```
