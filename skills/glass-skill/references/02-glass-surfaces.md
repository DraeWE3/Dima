# Glass Surfaces — Cards, Panels, Modals, Sidebars

## The Universal Glass Surface Pattern

Every glass surface uses the same 3-layer system applied via CSS:

```css
/* Layer 1: Backdrop blur (frosted glass blur on background) */
backdrop-filter: blur(var(--glass-blur));

/* Layer 2: ::before — glass highlight ring (bright specular edge) */
::before → box-shadow: var(--glass-ring);

/* Layer 3: ::after — displacement warp (optional, adds realism) */
::after → filter: url(#glass-subtle); isolation: isolate;
```

---

## Pattern 1: GlassCard Component

```tsx
// app/components/glass/GlassCard.tsx
'use client';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  shimmer?: boolean;   // Adds a sweep highlight on hover
  onClick?: () => void;
}

export default function GlassCard({
  children, className = '', shimmer = false, onClick
}: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={`glass-card ${shimmer ? 'glass-card--shimmer' : ''} ${className}`}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {children}
    </div>
  );
}
```

```css
/* In globals.css */

.glass-card {
  position: relative;
  border-radius: 24px;
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  background: var(--glass-bg);
  isolation: isolate;
  overflow: hidden;
  animation: glass-enter 0.4s ease-out;
}

/* The glass highlight ring */
.glass-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: var(--glass-ring);
  pointer-events: none;
  z-index: 1;
}

/* Optional: subtle displacement warp on the border */
.glass-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  filter: url(#glass-subtle);
  isolation: isolate;
  pointer-events: none;
  z-index: 0;
}

/* Shimmer sweep on hover */
.glass-card--shimmer:hover::before {
  /* Shimmer layer added via content overlay */
}
.glass-card--shimmer::after {
  content: '';
  position: absolute;
  top: 0; left: 0;
  width: 60%;
  height: 100%;
  background: linear-gradient(
    105deg,
    transparent 20%,
    rgba(255,255,255,0.10) 50%,
    transparent 80%
  );
  animation: glass-shimmer 2.5s ease-in-out infinite;
  pointer-events: none;
  z-index: 2;
}

/* Hover lift */
.glass-card:hover {
  transform: translateY(-2px);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### Usage

```tsx
<GlassCard shimmer className="p-8 max-w-sm">
  <h2 className="text-xl font-semibold text-white mb-2">Glass Card</h2>
  <p className="text-white/60 text-sm">Any content here...</p>
</GlassCard>
```

---

## Pattern 2: GlassModal

The key difference from a card: the modal needs a **backdrop overlay** behind it and
should be rendered via a React Portal to avoid stacking context conflicts with the
SVG filter.

```tsx
// app/components/glass/GlassModal.tsx
'use client';
import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export default function GlassModal({ isOpen, onClose, children, title }: GlassModalProps) {
  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="glass-modal-overlay" onClick={onClose} role="dialog" aria-modal>
      <div
        className="glass-modal"
        onClick={e => e.stopPropagation()} // Prevent close on inner click
      >
        {/* Header */}
        {title && (
          <div className="glass-modal__header">
            <h2 className="glass-modal__title">{title}</h2>
            <button className="glass-modal__close" onClick={onClose} aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        )}
        <div className="glass-modal__body">{children}</div>
      </div>
    </div>,
    document.body
  );
}
```

```css
.glass-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.50);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.glass-modal {
  position: relative;
  width: 100%;
  max-width: 520px;
  border-radius: 28px;
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  background: rgba(255, 255, 255, 0.10);
  isolation: isolate;
  overflow: hidden;
  animation: glass-enter 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.glass-modal::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: var(--glass-ring);
  pointer-events: none;
  z-index: 1;
}

.glass-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 28px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.12);
}

.glass-modal__title {
  font-size: 1.1rem;
  font-weight: 600;
  color: rgba(255,255,255,0.95);
}

.glass-modal__close {
  width: 32px; height: 32px;
  background: rgba(255,255,255,0.08);
  border: none;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  color: rgba(255,255,255,0.7);
  transition: background 0.2s, transform 0.2s;
}
.glass-modal__close:hover {
  background: rgba(255,255,255,0.15);
  transform: scale(1.1);
}
.glass-modal__close svg { width: 16px; height: 16px; }

.glass-modal__body {
  padding: 20px 28px 28px;
  color: rgba(255,255,255,0.85);
  position: relative;
  z-index: 2;
}
```

---

## Pattern 3: Glass Hero / Full-Bleed Section

Glass panel that covers a full-bleed background image or gradient:

```tsx
// Usage in page.tsx
<div className="glass-hero">
  {/* Background — image, gradient, or video */}
  <div className="glass-hero__bg" />

  {/* Glass content panel */}
  <div className="glass-hero__panel">
    <h1>Welcome</h1>
    <p>Glass hero section content</p>
  </div>
</div>
```

```css
.glass-hero {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.glass-hero__bg {
  position: absolute;
  inset: 0;
  background: url('/your-bg.jpg') center/cover no-repeat;
  /* or: background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); */
}

/* The glass panel floating on the background */
.glass-hero__panel {
  position: relative;
  z-index: 2;
  max-width: 600px;
  margin: 0 auto;
  padding: 60px 48px;
  border-radius: 32px;
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
  background: rgba(255, 255, 255, 0.08);
  isolation: isolate;
}

.glass-hero__panel::before {
  content: '';
  position: absolute; inset: 0;
  border-radius: inherit;
  box-shadow: var(--glass-ring);
  pointer-events: none;
  z-index: 1;
}

/* The container displacement warp — most visible on the edges */
.glass-hero__panel::after {
  content: '';
  position: absolute; inset: 0;
  border-radius: inherit;
  filter: url(#glass-container);
  isolation: isolate;
  pointer-events: none;
  z-index: 0;
}
```

---

## Pattern 4: Glass Sidebar

```css
.glass-sidebar {
  position: fixed;
  top: 0; left: 0;
  height: 100vh;
  width: 280px;
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  background: rgba(255, 255, 255, 0.06);
  border-right: 1px solid rgba(255, 255, 255, 0.12);
  isolation: isolate;
  z-index: 100;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.glass-sidebar::before {
  content: '';
  position: absolute; inset: 0;
  /* Only right edge gets the bright ring — left is flush with screen edge */
  box-shadow: inset -2px 0 0 -1px rgba(255,255,255,0.30),
              inset 0 2px 0 -1px rgba(255,255,255,0.40);
  pointer-events: none;
}

/* Sidebar nav item */
.glass-sidebar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 12px;
  color: rgba(255,255,255,0.65);
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  text-decoration: none;
}
.glass-sidebar-item:hover {
  background: rgba(255,255,255,0.10);
  color: rgba(255,255,255,0.95);
}
.glass-sidebar-item.active {
  background: rgba(255,255,255,0.14);
  color: #fff;
  font-weight: 500;
}
```
