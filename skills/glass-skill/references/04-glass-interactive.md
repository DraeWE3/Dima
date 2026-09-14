# Glass Interactive Elements — Buttons, Inputs, Tags, Tooltips

## Pattern 1: GlassButton (all variants)

```tsx
// app/components/glass/GlassButton.tsx
'use client';
import { ReactNode, useRef } from 'react';

type GlassButtonVariant = 'default' | 'icon' | 'pill' | 'ghost';

interface GlassButtonProps {
  children: ReactNode;
  variant?: GlassButtonVariant;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}

export default function GlassButton({
  children, variant = 'default', onClick, disabled, ariaLabel
}: GlassButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    // Ripple effect
    const btn = btnRef.current!;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'glass-ripple';
    ripple.style.left = `${e.clientX - rect.left}px`;
    ripple.style.top  = `${e.clientY - rect.top}px`;
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
    onClick?.();
  };

  return (
    <button
      ref={btnRef}
      className={`glass-btn glass-btn--${variant} ${disabled ? 'glass-btn--disabled' : ''}`}
      onClick={handleClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      <span className="glass-btn__content">{children}</span>
    </button>
  );
}
```

```css
/* ── Base glass button ── */
.glass-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  cursor: pointer;
  overflow: hidden;        /* clip ripple */
  isolation: isolate;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  will-change: transform;
}

.glass-btn:hover  { transform: scale(1.06) translateY(-1px); }
.glass-btn:active { transform: scale(0.95); }
.glass-btn--disabled { opacity: 0.4; cursor: not-allowed; pointer-events: none; }

/* Highlight ring */
.glass-btn::before {
  content: '';
  position: absolute; inset: 0;
  border-radius: inherit;
  box-shadow: var(--glass-ring-btn);
  background: rgba(255,255,255,0.10);
  pointer-events: none;
  z-index: 1;
}

/* Displacement filter backdrop */
.glass-btn::after {
  content: '';
  position: absolute; inset: 0;
  border-radius: inherit;
  backdrop-filter: blur(8px) saturate(160%);
  filter: url(#glass-btn);
  isolation: isolate;
  z-index: -1;
  pointer-events: none;
}

/* Content sits above filters */
.glass-btn__content {
  position: relative;
  z-index: 2;
  color: rgba(255,255,255,0.92);
  font-size: 0.9rem;
  font-weight: 500;
}

/* Click ripple */
.glass-ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba(255,255,255,0.3);
  width: 8px; height: 8px;
  transform: translate(-50%, -50%) scale(0);
  animation: glass-ripple 0.6s ease-out forwards;
  pointer-events: none;
  z-index: 3;
}

/* ── VARIANT: default (rounded rect) ── */
.glass-btn--default {
  padding: 12px 24px;
  border-radius: 14px;
}

/* ── VARIANT: pill (capsule) ── */
.glass-btn--pill {
  padding: 10px 22px;
  border-radius: 100px;
}

/* ── VARIANT: icon (circle) ── */
.glass-btn--icon {
  width: 52px; height: 52px;
  border-radius: 50%;
  padding: 0;
}
.glass-btn--icon .glass-btn__content {
  display: flex; align-items: center; justify-content: center;
  width: 100%; height: 100%;
}
.glass-btn--icon svg { width: 22px; height: 22px; stroke: rgba(255,255,255,0.9); }

/* ── VARIANT: ghost (no background, border only) ── */
.glass-btn--ghost::before {
  background: transparent;
  box-shadow: inset 0 0 0 1.5px rgba(255,255,255,0.30);
}
.glass-btn--ghost:hover::before {
  background: rgba(255,255,255,0.06);
}
```

---

## Pattern 2: GlassInput

```tsx
// app/components/glass/GlassInput.tsx
'use client';
import { InputHTMLAttributes } from 'react';

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
}

export default function GlassInput({ label, icon, ...props }: GlassInputProps) {
  return (
    <div className="glass-input-wrapper">
      {label && <label className="glass-input-label">{label}</label>}
      <div className="glass-input-field">
        {icon && <span className="glass-input-icon">{icon}</span>}
        <input className="glass-input" {...props} />
      </div>
    </div>
  );
}
```

```css
.glass-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.glass-input-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: rgba(255,255,255,0.55);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.glass-input-field {
  position: relative;
  border-radius: 14px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background: rgba(255,255,255,0.07);
  isolation: isolate;
  overflow: hidden;
  transition: background 0.2s;
}

/* Highlight ring */
.glass-input-field::before {
  content: '';
  position: absolute; inset: 0;
  border-radius: inherit;
  box-shadow: inset 1px 1px 0 -0.5px rgba(255,255,255,0.50),
              inset 0 0 0 1px rgba(255,255,255,0.12);
  pointer-events: none;
  z-index: 1;
  transition: box-shadow 0.2s;
}

.glass-input-field:focus-within {
  background: rgba(255,255,255,0.11);
}
.glass-input-field:focus-within::before {
  box-shadow: inset 1px 1px 0 -0.5px rgba(255,255,255,0.65),
              inset 0 0 0 1.5px rgba(124,106,255,0.50);
}

.glass-input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255,255,255,0.40);
  display: flex;
  pointer-events: none;
  z-index: 2;
}

.glass-input {
  width: 100%;
  padding: 13px 16px;
  padding-left: 42px; /* space for icon */
  background: transparent;
  border: none;
  outline: none;
  color: rgba(255,255,255,0.90);
  font-size: 0.9rem;
  position: relative;
  z-index: 2;
}
.glass-input::placeholder { color: rgba(255,255,255,0.28); }
```

---

## Pattern 3: GlassTag / Badge

```tsx
export function GlassTag({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <span className="glass-tag" style={color ? { '--tag-color': color } as any : {}}>
      {children}
    </span>
  );
}
```

```css
.glass-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 100px;
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  backdrop-filter: blur(8px);
  background: rgba(255,255,255,0.09);
  color: rgba(255,255,255,0.80);
  border: 1px solid rgba(255,255,255,0.15);
  white-space: nowrap;
}
/* Color accent variant */
.glass-tag[style*="--tag-color"] {
  background: color-mix(in srgb, var(--tag-color) 15%, transparent);
  border-color: color-mix(in srgb, var(--tag-color) 40%, transparent);
  color: var(--tag-color);
}
```

---

## Pattern 4: GlassTooltip

```tsx
'use client';
import { ReactNode, useState } from 'react';

export function GlassTooltip({ children, tip }: { children: ReactNode; tip: string }) {
  const [show, setShow] = useState(false);
  return (
    <div
      className="glass-tooltip-wrapper"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && <div className="glass-tooltip" role="tooltip">{tip}</div>}
    </div>
  );
}
```

```css
.glass-tooltip-wrapper {
  position: relative;
  display: inline-flex;
}

.glass-tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  padding: 7px 12px;
  border-radius: 10px;
  font-size: 0.75rem;
  color: rgba(255,255,255,0.90);
  backdrop-filter: blur(16px);
  background: rgba(255,255,255,0.10);
  border: 1px solid rgba(255,255,255,0.18);
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  animation: glass-enter 0.15s ease-out;
  pointer-events: none;
  z-index: 99;
}
```
