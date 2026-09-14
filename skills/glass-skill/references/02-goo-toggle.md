# Liquid Goo Toggle — feGaussianBlur + feColorMatrix

The goo trick works by exploiting how SVG blur interacts with alpha:

1. **Blur everything** with `feGaussianBlur` — shapes bleed into each other
2. **Threshold the alpha** with `feColorMatrix` — anything below ~50% alpha snaps to
   transparent, anything above snaps to fully opaque
3. **Result**: where two blurred shapes overlap, their alpha adds up past the
   threshold → they **merge into one solid blob**

Apply this filter to a **wrapper** element, not the button itself. The wrapper
acts as the "goo canvas."

---

## Pattern 1: Basic Goo Toggle (HTML/CSS/JS)

### SVG Filter

```html
<svg style="display:none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="goo" x="-30%" y="-30%" width="160%" height="160%">
      <!-- Step 1: Blur heavily so shapes bleed -->
      <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur"/>
      <!-- Step 2: Boost alpha contrast to create hard merge boundary -->
      <feColorMatrix in="blur" type="matrix"
        values="1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 20 -8"
        result="goo"/>
      <!-- Step 3: Composite original colors back (preserves color, uses goo alpha) -->
      <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
    </filter>
  </defs>
</svg>
```

**Tuning the `feColorMatrix`:**
- Row 4 values: `0 0 0 [multiplier] [offset]`
- `multiplier: 20, offset: -8` → threshold at ~40% alpha (shapes merge when overlapping ~40%)
- Higher multiplier = sharper boundary, more aggressive merge
- Higher (less negative) offset = shapes merge sooner (need less overlap)

### HTML Structure

```html
<!-- Wrapper gets the goo filter — acts as the "goo canvas" -->
<div class="goo-wrapper">
  <button type="button" class="toggle-btn" aria-pressed="false" id="myToggle">
    <div class="toggle-track"></div>
    <div class="toggle-thumb"></div>
  </button>
</div>

<!-- Label outside wrapper (not affected by goo filter) -->
<span class="toggle-label" id="toggleLabel">Off</span>
```

### CSS

```css
/* ── Goo canvas wrapper ── */
.goo-wrapper {
  filter: url(#goo);

  /* Background must match page background — the filter makes it transparent in gaps */
  background: #1a1a2e;
  border-radius: 100px;
  padding: 4px;
  display: inline-block;
}

/* ── Toggle button ── */
.toggle-btn {
  position: relative;
  display: flex;
  align-items: center;
  width: 180px;
  height: 56px;
  background: transparent;
  border: none;
  border-radius: 100px;
  cursor: pointer;
  padding: 0;
  outline: none;
}

/* Track (the slot the thumb slides in) */
.toggle-track {
  position: absolute;
  inset: 0;
  border-radius: 100px;
  background: rgba(255, 255, 255, 0.08);
}

/* Thumb (the sliding blob) */
.toggle-thumb {
  position: absolute;
  left: 4px;
  width: 48px;
  height: 48px;
  background: #ffffff;
  border-radius: 50%;
  will-change: left, width;

  /* Spring transition for the slide */
  transition:
    left   0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
    width  0.2s ease,
    border-radius 0.2s ease;
}

/* ── Pressed state: thumb slides right ── */
.toggle-btn[aria-pressed="true"] .toggle-thumb {
  left: calc(100% - 52px); /* 180px - 48px thumb - 4px padding * 2 */
}

/* ── Active state: thumb stretches (the "liquid pull" effect) ── */
/* Because the wrapper has the goo filter, this stretch looks like
   the thumb is being pulled through liquid */
.toggle-btn:active .toggle-thumb {
  width: 64px;
  border-radius: 100px;
}
.toggle-btn[aria-pressed="true"]:active .toggle-thumb {
  left: calc(100% - 68px); /* adjusted for stretched width */
}
```

### JavaScript

```js
const toggle = document.getElementById('myToggle');
const label  = document.getElementById('toggleLabel');

toggle.addEventListener('click', () => {
  const isPressed = toggle.getAttribute('aria-pressed') === 'true';
  toggle.setAttribute('aria-pressed', String(!isPressed));
  label.textContent = isPressed ? 'Off' : 'On';
});
```

---

## Pattern 2: Colored Goo Toggle

To change the thumb color (purple, pink, green, etc.), set `background` on the
thumb element. Each color variant needs its own isolated goo wrapper so colors
don't bleed across variants.

```html
<!-- Purple variant -->
<div class="goo-wrapper" style="background: #1a1030;">
  <button class="toggle-btn" aria-pressed="false" style="width:120px; height:44px;">
    <div class="toggle-track"></div>
    <div class="toggle-thumb" style="background: #7c6aff; width:36px; height:36px;"></div>
  </button>
</div>

<!-- Pink variant -->
<div class="goo-wrapper" style="background: #1f1018;">
  <button class="toggle-btn" aria-pressed="false" style="width:120px; height:44px;">
    <div class="toggle-track"></div>
    <div class="toggle-thumb" style="background: #ff6ac1; width:36px; height:36px;"></div>
  </button>
</div>
```

**Why each variant needs its own wrapper:** The goo filter merges ALL children of the
filtered element. If two colored thumbs share a wrapper, their blurred edges merge
when close together and create a muddy mixed color.

---

## Pattern 3: Icons Inside the Toggle

Icons must sit **above** the goo filter output. Place them in a separate `div` that is
positioned over the toggle but is NOT a child of the goo wrapper:

```html
<div style="position: relative; display: inline-block;">
  <div class="goo-wrapper">
    <button class="toggle-btn" id="iconToggle" aria-pressed="false">
      <div class="toggle-track"></div>
      <div class="toggle-thumb"></div>
    </button>
  </div>
  <!-- Icons: absolute overlay, not inside goo wrapper -->
  <div class="toggle-icons" aria-hidden="true">
    <svg class="icon icon-off"><!-- moon SVG --></svg>
    <svg class="icon icon-on"><!-- sun SVG --></svg>
  </div>
</div>
```

```css
.toggle-icons {
  position: absolute;
  inset: 4px;                   /* match wrapper padding */
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  pointer-events: none;
  z-index: 2;
}

.icon { width: 20px; height: 20px; transition: opacity 0.3s ease; }

/* Show moon when off, sun when on */
#iconToggle[aria-pressed="false"] .icon-off { opacity: 0; }
#iconToggle[aria-pressed="true"]  .icon-on  { opacity: 0; }
#iconToggle[aria-pressed="false"] .icon-on  { opacity: 0.8; }
#iconToggle[aria-pressed="true"]  .icon-off { opacity: 0.8; }
```

---

## Pattern 4: React Component

```tsx
// GooToggle.tsx
'use client';
import { useState } from 'react';

interface GooToggleProps {
  defaultPressed?: boolean;
  color?: string;
  bgColor?: string;
  onChange?: (pressed: boolean) => void;
}

export default function GooToggle({
  defaultPressed = false,
  color = '#ffffff',
  bgColor = '#1a1a2e',
  onChange,
}: GooToggleProps) {
  const [pressed, setPressed] = useState(defaultPressed);

  const handleClick = () => {
    const next = !pressed;
    setPressed(next);
    onChange?.(next);
  };

  return (
    <>
      {/* Place this svg block in layout.tsx in production */}
      <svg style={{ display: 'none' }}>
        <defs>
          <filter id="goo" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur"/>
            <feColorMatrix in="blur" type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8"
              result="goo"/>
            <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
          </filter>
        </defs>
      </svg>

      <div
        style={{
          filter: 'url(#goo)',
          background: bgColor,
          borderRadius: '100px',
          padding: '4px',
          display: 'inline-block',
        }}
      >
        <button
          type="button"
          aria-pressed={pressed}
          onClick={handleClick}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            width: '180px',
            height: '56px',
            background: 'transparent',
            border: 'none',
            borderRadius: '100px',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {/* Track */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '100px',
            background: 'rgba(255,255,255,0.08)',
          }}/>
          {/* Thumb */}
          <div style={{
            position: 'absolute',
            left: pressed ? 'calc(100% - 52px)' : '4px',
            width: '48px',
            height: '48px',
            background: color,
            borderRadius: '50%',
            transition: 'left 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            willChange: 'left',
          }}/>
        </button>
      </div>
    </>
  );
}
```

---

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Icons inside goo wrapper | Icons get blurred and merged into blobs | Move icons to a sibling overlay div |
| Wrong wrapper background | Transparent gaps show the page bg, breaking the seamless look | Set `background` on `.goo-wrapper` to match the page background exactly |
| `stdDeviation` too low | Shapes don't merge — no goo effect | Increase to at least `8`; `10-13` is ideal |
| `stdDeviation` too high | Everything blurs into mush | Keep under `15` for typical toggle sizes |
| Multiple colors in one wrapper | Colors bleed and merge together | Each color variant needs its own `.goo-wrapper` |
| Filter on button not wrapper | The filter applies to the button's own rendering, not its relationship with siblings | Always apply to the **parent container** |
