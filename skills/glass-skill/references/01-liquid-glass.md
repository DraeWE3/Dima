# Liquid Glass Effect — feDisplacementMap

The glass effect works by layering three visual systems on each element:

1. **Backdrop blur** — `backdrop-filter: blur()` for the frosted-glass background
2. **Displacement warp** — `filter: url(#btn-glass)` bends surrounding pixels using a normal map
3. **Highlight ring** — `box-shadow: inset` simulates the bright edge of real glass

---

## Pattern 1: Glass Container + Button (Vanilla HTML/CSS)

This is the full working implementation. Copy the SVG filter block once into your
HTML, then the CSS classes can be reused for any glass element.

### SVG Filters (place once in `<body>`, `display:none`)

```html
<svg style="display:none" xmlns="http://www.w3.org/2000/svg">
  <defs>

    <!-- Container: fractal noise displacement (wavy warp on the whole panel) -->
    <filter id="container-glass" x="0%" y="0%" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.008 0.008"
                    numOctaves="2" seed="92" result="noise"/>
      <feGaussianBlur in="noise" stdDeviation="0.02" result="blur"/>
      <feDisplacementMap in="SourceGraphic" in2="blur"
                         scale="77" xChannelSelector="R" yChannelSelector="G"/>
    </filter>

    <!-- Button: normal-map image displacement (lens refraction per-button) -->
    <filter id="btn-glass" primitiveUnits="objectBoundingBox">
      <feImage
        href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAF6ESURBVHgB7b1ZsB3HeSb4ZZ1zV+wEQCykAJIASHERQNBaKRKySMkxYYVly+6x3fNgR0e4rZn2vIw7RnbMONrd0X5wKMLTT+7psf0w7ocZWz22pZ5Wz0xL1EaJ1M5NJEWR1EKJhECBK0gAF/ee+icr1//PzKpT595zsZE/ULeycquqrP+rf8uso/7lHxPhTZoqqZmzUBteRbXzOQz2fB/Y9CKgjzG7pLezoGZTI5CuR3NNugYNRjZPtyeqQKOh3g9AS/OglVnQ8rzJgz7GaAY4vQnqhT2onn8LqpevRPXSlVArM3iTpktDvEmrpmr2DIZXP43hjp+g2nISatNLGOz6AdSWFxyzE2r+lwj2beTfSQSfowuTzpUu0dsi7B52X7s9qSav0seuXj3UQNkF9eJuvd+BwavbMfzZ1Zh55sY3gbMGehMgE5AansP8wQcxc+WPMbv/UQz3/ABULTMY6H0DAqoNwzc5aNLk0g2bGxx4mESg8Hx9JvdfuVIV8pWye5OnKn1chfRo62nQth860Nj8RgoNjx/E7A9vxtxz12H2xzegWlrEm9SP3gRIBw0WX8W8VpFmdv8AC4cewGD7s3rEliwUSEsIvWFUm71hdrJAaQBCRnN1gDFlbjMM7qAhtNuSpuuAoSJATDXl8yqzV0aiVCFPub3NG2B596NY2vM4Xm3y6hnMHr8Ocz+6GfM/uR6zJ/ZjcHoz3qQyvQmQhKq5M9h48NvYePN9mN39NNT8a5onRxoQDggOEDAA8WkPDAsKDwZyilEAB1IVCxEklOSrCA4VShQrruyxstLEgIKBxuZVRrKQBolyew17DZZHcWbv40bK4NwGzB8/gE0Pvh+Lz9yEwZmNeJMivQkQNKrTMhavehJbDn8BGw5+S/PQWc3mKxYQKxEIDVBs2gODwjG8BHHAIA+IAAySWIA4QC5BVLJTosiqXSpIEASpwfOsFPFAUU6iWCkzMOl6cA6n3/IAXnvLw9pWWcDi00ex5ZFj2KAljKIKb3R6QwNkYc/T2HLj/dj81vtQLbziVCcNjNGK5kC9r7XkcKCwEoMsUIjZGkZ6eGAgSAqb5JIEiLYGJyprVw2p8CfLU/5AWYPdF1r1SjkQeVAoBhAJFg8UpYaoq3M4df29ePX6+7Rk2Yit3zmGrY+9FwsnrsEbld5wABnMnsb2W+/BFUfuwXDTSac+jQwoiFYcEFZQ16OoPlHtDHAnLYgYSLiEoACUoF41woUDRJADRxdASiBhRrvRqGJFK1kqDx8PDgsiq5ZxqaIiUCoLkiZNagakHRIvHP1POHn0/8HMy3uw9fH3YscDH8Dw7BtLBXvDAGRu0wsaGJ/Fjrd9DmrulJEU9WhkJUZtwdEAItgaDiC1N7gzA9xJB26Ep94obncQ91o5alWvPEk1S+R74IyQ2SsYeZVLJSqXkyRO/QoAqawkqdQyarM/p6WJdhs3UkVv5zb/CD9997P42eHP4IrH78RODZTZUzvwRqDLHiCzm09iz7s+ha0Hvq4N8AYYmglW9FZbNQrkgWDBAAeMTFokgBDSg6KNIfZwoAi4ISEwIizaAaKSUosLDpwoOYIL2LmISQAjAiaqYc7jpfeV3monSWz+IKhgyoBlBqO5FZw4+h9x8q33Ysv3fw57vvkhzOnYy+VMly1ANux4Bnve8Z+w9dD9zrjWoBjpmEW97FQpq0bVDhxGnarJgMSoU7WLbdR1GRCJMY7UC0Uk95Dl1J5wFEGgsh64wa7CjoJlEkECFY35EmBUZb1hVu1a0UDQhnsDmMoBxkgUnafjPY0KpqoZrMwt4+RNlE"
        x="0" y="0" width="1" height="1" result="map" preserveAspectRatio="none"/>
      <feGaussianBlur in="SourceGraphic" stdDeviation="0.02" result="blur"/>
      <feDisplacementMap in="blur" in2="map" scale="0.8"
                         xChannelSelector="R" yChannelSelector="G"/>
    </filter>

  </defs>
</svg>
```

### HTML Structure

```html
<!-- The scene: any image/gradient background -->
<div class="glass-scene">

  <!-- Container: the glass panel -->
  <div class="glass-container">

    <!-- Button inside the glass panel -->
    <button type="button" class="glass-btn" aria-label="Add">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round">
        <path d="M5 12h14"/><path d="M12 5v14"/>
      </svg>
    </button>

  </div>
</div>
```

### CSS

```css
/* ── Scene: the background the glass sits on ── */
.glass-scene {
  position: relative;
  width: 340px;
  height: 220px;
  border-radius: 32px;
  overflow: hidden;
  background: url('/your-image.jpg') center/cover no-repeat;
}

/* ── Glass Container ── */
.glass-container {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Highlight ring — simulates the bright edge of glass */
.glass-container::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: inherit;
  box-shadow:
    inset 2px 2px 0px -1px rgba(255, 255, 255, 0.75),
    inset -1px -1px 0px -1px rgba(255, 255, 255, 0.3),
    inset 0 0 4px 1px rgba(255, 255, 255, 0.15);
  pointer-events: none; /* CRITICAL: never block clicks */
}

/* SVG displacement warp — bends surrounding pixels */
.glass-container::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: inherit;
  backdrop-filter: blur(2px);      /* frosted glass background */
  filter: url(#container-glass);   /* pixel warp on top */
  isolation: isolate;              /* CRITICAL: prevents filter bleed */
  pointer-events: none;
}

/* ── Glass Button ── */
.glass-btn {
  position: relative;
  z-index: 2;                      /* above ::before and ::after */
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  padding: 16px;
  background: transparent;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  outline: none;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.glass-btn:hover  { transform: scale(1.08); }
.glass-btn:active { transform: scale(0.94); }

/* Button highlight ring */
.glass-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.12);
  box-shadow:
    inset 2px 2px 0px -2px rgba(255, 255, 255, 0.8),
    inset 0 0 3px 1px rgba(255, 255, 255, 0.5);
  pointer-events: none;
}

/* Button displacement warp (uses normal-map image for per-button refraction) */
.glass-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: 9999px;
  backdrop-filter: blur(6px);
  filter: url(#btn-glass);
  isolation: isolate;
  pointer-events: none;
}

/* SVG icon inside button */
.glass-btn svg {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  stroke: rgba(255, 255, 255, 0.95);
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}
```

---

## Pattern 2: Glass Pill Button

For a standalone pill-shaped glass button (no container required):

```html
<button class="glass-pill">
  <span>✦ Explore</span>
</button>
```

```css
.glass-pill {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 22px;
  border: none;
  border-radius: 100px;
  background: transparent;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.glass-pill:hover  { transform: scale(1.06) translateY(-1px); }
.glass-pill:active { transform: scale(0.97); }

/* Highlight ring */
.glass-pill::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 100px;
  background: rgba(255, 255, 255, 0.10);
  box-shadow:
    inset 1.5px 1.5px 0 -1px rgba(255, 255, 255, 0.8),
    inset 0 0 8px rgba(255, 255, 255, 0.1);
  pointer-events: none;
}

/* Displacement filter */
.glass-pill::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 100px;
  backdrop-filter: blur(10px) saturate(180%);
  filter: url(#btn-glass);
  z-index: -1;
  isolation: isolate;
  pointer-events: none;
}

/* Text above filters */
.glass-pill span { position: relative; z-index: 1; }
```

---

## Pattern 3: Click Ripple

```js
button.addEventListener('click', function(e) {
  const ripple = document.createElement('div');
  ripple.style.cssText = `
    position: absolute;
    border-radius: 50%;
    background: rgba(255,255,255,0.25);
    width: 10px; height: 10px;
    left: 50%; top: 50%;
    transform: translate(-50%, -50%) scale(0);
    animation: glass-ripple 0.6s ease-out forwards;
    pointer-events: none;
    z-index: 3;
  `;
  this.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
});
```

```css
@keyframes glass-ripple {
  to { transform: translate(-50%, -50%) scale(14); opacity: 0; }
}
```

---

## React / Next.js Version

```tsx
// GlassButton.tsx
'use client';
import { useRef } from 'react';

export default function GlassButton({ onClick, children }) {
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    // Ripple
    const btn = btnRef.current;
    if (!btn) return;
    const ripple = document.createElement('div');
    Object.assign(ripple.style, {
      position: 'absolute', borderRadius: '50%',
      background: 'rgba(255,255,255,0.25)',
      width: '10px', height: '10px',
      left: '50%', top: '50%',
      transform: 'translate(-50%,-50%) scale(0)',
      animation: 'glass-ripple 0.6s ease-out forwards',
      pointerEvents: 'none', zIndex: '3',
    });
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
    onClick?.();
  };

  return (
    <>
      {/* SVG filter — place in layout.tsx in production */}
      <svg style={{ display: 'none' }}>
        <defs>
          <filter id="btn-glass" primitiveUnits="objectBoundingBox">
            {/* ... feImage + feDisplacementMap (see full markup above) ... */}
          </filter>
        </defs>
      </svg>

      <button ref={btnRef} onClick={handleClick} className="glass-btn">
        {children}
      </button>
    </>
  );
}
```

---

## Why It Looks Like Glass — The Physics

Real glass refracts (bends) light passing through it. The `feDisplacementMap` filter
simulates this by shifting each pixel's position based on a **normal map** (the
`feImage` base64 PNG). The normal map encodes surface angles as RGB values — red
channel = X displacement, green channel = Y displacement. This makes the edges of the
button appear to bend the background behind them, exactly like a real glass lens.

The `feTurbulence` on the container uses Perlin noise instead of a normal map,
creating a more irregular "wavy glass" warp across the whole panel.

The `inset box-shadow` highlights simulate the specular reflection you see on the
curved top-edge of a real glass object.
