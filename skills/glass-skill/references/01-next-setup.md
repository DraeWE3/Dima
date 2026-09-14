# Next.js Setup — Glass UI

## Step 1: GlassFilterProvider (place in layout.tsx)

This component renders the hidden SVG filter definitions once at the root.
All glass components in the app reference these by ID — they must be in the DOM
before any glass component renders.

```tsx
// app/components/glass/GlassFilterProvider.tsx
export default function GlassFilterProvider() {
  return (
    <svg
      style={{ display: 'none', position: 'absolute' }}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>

        {/* ── CONTAINER GLASS: organic warp across a whole panel ── */}
        <filter id="glass-container" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.008 0.008"
            numOctaves="2"
            seed="92"
            result="noise"
          />
          <feGaussianBlur in="noise" stdDeviation="0.02" result="blur" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="blur"
            scale="77"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* ── BUTTON GLASS: normal-map lens refraction per-element ── */}
        <filter id="glass-btn" primitiveUnits="objectBoundingBox">
          <feImage
            href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAF6ESURBVHgB7b1ZsB3HeSb4ZZ1zV+wEQCykAJIASHERQNBaKRKySMkxYYVly+6x3fNgR0e4rZn2vIw7RnbMONrd0X5wKMLTT+7psf0w7ocZWz22pZ5Wz0xL1EaJ1M5NJEWR1EKJhECBK0gAF/ee+icr1//PzKpT595zsZE/ULeycquqrP+rf8uso/7lHxPhTZoqqZmzUBteRbXzOQz2fB/Y9CKgjzG7pLezoGZTI5CuR3NNugYNRjZPtyeqQKOh3g9AS/OglVnQ8rzJgz7GaAY4vQnqhT2onn8LqpevRPXSlVArM3iTpktDvEmrpmr2DIZXP43hjp+g2nISatNLGOz6AdSWFxyzE2r+lwj2beTfSQSfowuTzpUu0dsi7B52X7s9qSav0seuXj3UQNkF9eJuvd+BwavbMfzZ1Zh55sY3gbMGehMgE5AansP8wQcxc+WPMbv/UQz3/ABULTMY6H0DAqoNwzc5aNLk0g2bGxx4mESg8Hx9JvdfuVIV8pWye5OnKn1chfRo62nQth860Nj8RgoNjx/E7A9vxtxz12H2xzegWlrEm9SP3gRIBw0WX8W8VpFmdv8AC4cewGD7s3rEliwUSEsIvWFUm71hdrJAaQBCRnN1gDFlbjMM7qAhtNuSpuuAoSJATDXl8yqzV0aiVCFPub3NG2B596NY2vM4Xm3y6hnMHr8Ocz+6GfM/uR6zJ/ZjcHoz3qQyvQmQhKq5M9h48NvYePN9mN39NNT8a5onRxoQDggOEDAA8WkPDAsKDwZyilEAB1IVCxEklOSrCA4VShQrruyxstLEgIKBxuZVRrKQBolyew17DZZHcWbv40bK4NwGzB8/gE0Pvh+Lz9yEwZmNeJMivQkQNKrTMhavehJbDn8BGw5+S/PQWc3mKxYQKxEIDVBs2gODwjG8BHHAIA+IAAySWIA4QC5BVLJTosiqXSpIEASpwfOsFPFAUU6iWCkzMOl6cA6n3/IAXnvLw9pWWcDi00ex5ZFj2KAljKIKb3R6QwNkYc/T2HLj/dj81vtQLbziVCcNjNGK5kC9r7XkcKCwEoMsUIjZGkZ6eGAgSAqb5JIEiLYGJyprVw2p8CfLU/5AWYPdF1r1SjkQeVAoBhAJFg8UpYaoq3M4df29ePX6+7Rk2Yit3zmGrY+9FwsnrsEbld5wABnMnsb2W+/BFUfuwXDTSac+jQwoiFYcEFZQ16OoPlHtDHAnLYgYSLiEoACUoF41woUDRJADRxdASiBhRrvRqGJFK1kqDx8PDgsiq5ZxqaIiUCoLkiZNagakHRIvHP1POHn0/8HMy3uw9fH3YscDH8Dw7BtLBXvDAGRu0wsaGJ/Fjrd9DmrulJEU9WhkJUZtwdEAItgaDiC1N7gzA9xJB26Ep94obncQ91o5alWvPEk1S+R74IyQ2SsYeZVLJSqXkyRO/QoAqawkqdQyarM/p6WJdhs3UkVv5zb/CD9997P42eHP4IrH78RODZTZUzvwRqDLHiCzm09iz7s+ha0Hvq4N8AYYmglW9FZbNQrkgWDBAAeMTFokgBDSg6KNIfZwoAi4ISEwIizaAaKSUosLDpwoOYIL2LmISQAjAiaqYc7jpfeV3monSWz+IKhgyoBlBqO5FZw4+h9x8q33Ysv3fw57vvkhzOnYy+VMly1ANux4Bnve8Z+w9dD9zrjWoBjpmEW97FQpq0bVDhxGnarJgMSoU7WLbdR1GRCJMY7UC0Uk95Dl1J5wFEGgsh64wa7CjoJlEkECFY35EmBUZb1hVu1a0UDQhnsDmMoBxkgUnafjPY0KpqoZrMwt4+RNlE"
            x="0" y="0" width="1" height="1"
            result="map"
            preserveAspectRatio="none"
          />
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.02" result="blur" />
          <feDisplacementMap
            in="blur" in2="map"
            scale="0.8"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* ── SUBTLE GLASS: lighter warp for cards/panels ── */}
        <filter id="glass-subtle" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.012"
            numOctaves="2"
            seed="42"
            result="noise"
          />
          <feGaussianBlur in="noise" stdDeviation="0.5" result="blur" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="blur"
            scale="18"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* ── GOO: blob merge for toggles ── */}
        <filter id="goo" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 20 -8"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>

        {/* ── GOO TIGHT: less blur, for smaller elements ── */}
        <filter id="goo-tight" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 25 -10"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>

      </defs>
    </svg>
  );
}
```

## Step 2: Mount in layout.tsx

```tsx
// app/layout.tsx
import GlassFilterProvider from '@/components/glass/GlassFilterProvider';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <GlassFilterProvider />   {/* Must be first — filters must exist before components */}
        {children}
      </body>
    </html>
  );
}
```

## Step 3: globals.css — Glass Variables + Keyframes

```css
/* app/globals.css */

:root {
  /* Glass surfaces */
  --glass-bg:          rgba(255, 255, 255, 0.10);
  --glass-bg-heavy:    rgba(255, 255, 255, 0.18);
  --glass-border:      rgba(255, 255, 255, 0.20);
  --glass-border-bold: rgba(255, 255, 255, 0.35);
  --glass-shine:       rgba(255, 255, 255, 0.70);
  --glass-shadow:      rgba(0, 0, 0, 0.25);
  --glass-blur:        12px;
  --glass-blur-heavy:  24px;

  /* Highlight ring values (used in box-shadow: inset) */
  --glass-ring: inset 1.5px 1.5px 0 -1px rgba(255,255,255,0.75),
                inset -1px -1px 0 -1px rgba(255,255,255,0.20),
                inset 0 0 6px 1px rgba(255,255,255,0.12);

  --glass-ring-btn: inset 2px 2px 0px -2px rgba(255,255,255,0.85),
                    inset 0 0 4px 1px rgba(255,255,255,0.50);
}

/* Shimmer animation — sweep highlight across a glass surface */
@keyframes glass-shimmer {
  0%   { transform: translateX(-100%) skewX(-15deg); }
  100% { transform: translateX(200%)  skewX(-15deg); }
}

/* Ripple for click feedback */
@keyframes glass-ripple {
  to { transform: translate(-50%, -50%) scale(18); opacity: 0; }
}

/* Entrance — glass panel fades and slides in */
@keyframes glass-enter {
  from { opacity: 0; transform: translateY(12px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0)    scale(1); }
}
```

## Step 4: Tailwind config (if using Tailwind)

```js
// tailwind.config.ts
export default {
  theme: {
    extend: {
      backdropBlur: {
        glass: '12px',
        'glass-heavy': '24px',
      },
      boxShadow: {
        glass: 'inset 1.5px 1.5px 0 -1px rgba(255,255,255,0.75), inset 0 0 6px 1px rgba(255,255,255,0.12)',
        'glass-btn': 'inset 2px 2px 0px -2px rgba(255,255,255,0.85), inset 0 0 4px 1px rgba(255,255,255,0.50)',
      },
    },
  },
};
```
