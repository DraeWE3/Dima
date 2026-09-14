import { useEffect } from "react";
import gsap from "gsap";

/**
 * Pattern: scaleY Panel Wipe Transition
 * Source: portfolio-prashant (transition.js)
 */

// 1. Call this immediately on page mount to reveal content
export const runPageTransition = (onComplete) => {
    // Set panels at full height, collapse from top
    gsap.set(".transition-panel", { scaleY: 1, transformOrigin: "top" });

    // Negative stagger makes them reveal in reverse order
    gsap.to(".transition-panel", {
        scaleY: 0,
        duration: 0.6,
        stagger: -0.1,
        ease: "power2.inOut",
        onComplete: onComplete
    });
};

// 2. Call this right before route change/navigation
export const triggerPageLeave = (onComplete) => {
    // Set panels to 0 height, expand from bottom
    gsap.set(".transition-panel", { scaleY: 0, transformOrigin: "bottom" });

    // Positive stagger makes them cover in normal order
    gsap.to(".transition-panel", {
        scaleY: 1,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.inOut",
        onComplete: onComplete
    });
};

// 3. Mount this component globally (e.g. in layout.jsx/tsx)
export default function PageTransitions() {
    
    // Automatically trigger reveal on initial mount
    useEffect(() => {
        runPageTransition();
    }, []);

    return (
        <>
            {/* Fixed overlays that cover the screen. Z-index ordering is critical. */}
            <div className="transition-panel fixed inset-0 z-[9999] bg-zinc-950 pointer-events-none will-change-transform" />
            <div className="transition-panel fixed inset-0 z-[9998] bg-zinc-900 pointer-events-none will-change-transform" />
            <div className="transition-panel fixed inset-0 z-[9997] bg-zinc-800 pointer-events-none will-change-transform" />
        </>
    );
}
