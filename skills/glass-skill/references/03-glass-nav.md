# Glass Navigation — Navbar, Floating Nav, Tabs

## Pattern 1: GlassNav (Sticky Header Navbar)

```tsx
// app/components/glass/GlassNav.tsx
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const links = [
  { href: '/', label: 'Home' },
  { href: '/work', label: 'Work' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export default function GlassNav() {
  const [scrolled, setScrolled] = useState(false);

  // Glass becomes MORE opaque / blurred as user scrolls
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`glass-nav ${scrolled ? 'glass-nav--scrolled' : ''}`}>
      <div className="glass-nav__inner">
        {/* Logo */}
        <Link href="/" className="glass-nav__logo">Brand</Link>

        {/* Links */}
        <nav className="glass-nav__links">
          {links.map(link => (
            <Link key={link.href} href={link.href} className="glass-nav__link">
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA pill */}
        <button className="glass-nav__cta">Get Started</button>
      </div>
    </header>
  );
}
```

```css
.glass-nav {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 999;
  padding: 12px 24px;
  transition: background 0.3s, backdrop-filter 0.3s, box-shadow 0.3s;
}

.glass-nav--scrolled {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid rgba(255,255,255,0.10);
  box-shadow: 0 1px 40px rgba(0,0,0,0.25);
}

.glass-nav__inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.glass-nav__logo {
  font-size: 1.2rem;
  font-weight: 700;
  color: rgba(255,255,255,0.95);
  text-decoration: none;
  letter-spacing: -0.03em;
}

.glass-nav__links {
  display: flex;
  gap: 4px;
  align-items: center;
}

.glass-nav__link {
  padding: 8px 14px;
  border-radius: 100px;
  color: rgba(255,255,255,0.65);
  font-size: 0.875rem;
  text-decoration: none;
  transition: background 0.2s, color 0.2s;
}
.glass-nav__link:hover {
  background: rgba(255,255,255,0.10);
  color: rgba(255,255,255,0.95);
}

/* CTA Button — glass pill with inset ring */
.glass-nav__cta {
  position: relative;
  padding: 9px 20px;
  background: rgba(255,255,255,0.12);
  border: none;
  border-radius: 100px;
  color: rgba(255,255,255,0.90);
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
  isolation: isolate;
}
.glass-nav__cta::before {
  content: '';
  position: absolute; inset: 0;
  border-radius: 100px;
  box-shadow: var(--glass-ring-btn);
  pointer-events: none;
}
.glass-nav__cta::after {
  content: '';
  position: absolute; inset: 0;
  border-radius: 100px;
  backdrop-filter: blur(8px);
  filter: url(#glass-btn);
  isolation: isolate;
  z-index: -1;
  pointer-events: none;
}
.glass-nav__cta:hover {
  background: rgba(255,255,255,0.20);
  transform: scale(1.04);
}
```

---

## Pattern 2: Floating Glass Tab Bar (Bottom or Top)

A macOS-style floating dock:

```tsx
export function GlassTabBar({ tabs, activeTab, onChange }: {
  tabs: { id: string; label: string; icon?: ReactNode }[];
  activeTab: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="glass-tabbar">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`glass-tabbar__item ${tab.id === activeTab ? 'active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon && <span className="glass-tabbar__icon">{tab.icon}</span>}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
```

```css
.glass-tabbar {
  display: inline-flex;
  gap: 4px;
  padding: 6px;
  border-radius: 100px;
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  background: rgba(255,255,255,0.08);
  position: relative;
  isolation: isolate;
}

.glass-tabbar::before {
  content: '';
  position: absolute; inset: 0;
  border-radius: 100px;
  box-shadow: var(--glass-ring);
  pointer-events: none;
}

.glass-tabbar__item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border: none;
  border-radius: 100px;
  background: transparent;
  color: rgba(255,255,255,0.55);
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  position: relative;
  z-index: 1;
}

.glass-tabbar__item.active {
  background: rgba(255,255,255,0.16);
  color: rgba(255,255,255,0.95);
  box-shadow: var(--glass-ring-btn);
}

.glass-tabbar__item:hover:not(.active) {
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.75);
}
```

---

## Pattern 3: Glass Breadcrumb

```tsx
export function GlassBreadcrumb({ crumbs }: { crumbs: { label: string; href?: string }[] }) {
  return (
    <nav className="glass-breadcrumb" aria-label="Breadcrumb">
      {crumbs.map((crumb, i) => (
        <span key={i} className="glass-breadcrumb__item">
          {crumb.href
            ? <a href={crumb.href}>{crumb.label}</a>
            : <span>{crumb.label}</span>
          }
          {i < crumbs.length - 1 && <span className="glass-breadcrumb__sep">/</span>}
        </span>
      ))}
    </nav>
  );
}
```

```css
.glass-breadcrumb {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  border-radius: 100px;
  background: rgba(255,255,255,0.06);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.12);
  font-size: 0.8rem;
}

.glass-breadcrumb a {
  color: rgba(255,255,255,0.60);
  text-decoration: none;
  transition: color 0.2s;
}
.glass-breadcrumb a:hover { color: rgba(255,255,255,0.90); }

.glass-breadcrumb__item:last-child span {
  color: rgba(255,255,255,0.90);
  font-weight: 500;
}

.glass-breadcrumb__sep {
  color: rgba(255,255,255,0.20);
  margin: 0 4px;
}
```
