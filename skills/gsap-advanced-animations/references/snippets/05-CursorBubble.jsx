import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

/**
 * Pattern: Elastic Cursor Follower
 * Source: truus-awwward (CursorBubble.jsx & VimeoHero.jsx)
 */
export default function CursorBubble() {
    const cursorRef = useRef(null);

    useGSAP(() => {
        const cursor = cursorRef.current;
        if (!cursor) return;

        // 1. Create quickTo setters (vital for avoiding thousands of GC tweens)
        const xTo = gsap.quickTo(cursor, "x", { duration: 0.5, ease: "power3" });
        const yTo = gsap.quickTo(cursor, "y", { duration: 0.5, ease: "power3" });

        // 2. Initial state: tilted and hidden
        gsap.set(cursor, { rotation: -30, scale: 0, opacity: 0 });

        const onMouseMove = (e) => {
            xTo(e.clientX);
            yTo(e.clientY);
        };

        // 3. Hover detection - checks if hovering over clickable elements
        const onMouseOver = (e) => {
            const interactiveEl = e.target.closest("a, button, [data-cursor]");
            if (interactiveEl) {
                gsap.killTweensOf(cursor, "opacity,scale,rotation"); // Prevent conflict
                gsap.to(cursor, {
                    opacity: 1,
                    scale: 1,
                    rotation: 0, // Straighten up
                    duration: 1.7,
                    delay: 0.05,
                    ease: "elastic.out(1, 0.4)", // Playful bounce
                });
            }
        };

        const onMouseOut = () => {
            gsap.killTweensOf(cursor, "opacity,scale,rotation");
            gsap.to(cursor, {
                opacity: 0,
                scale: 0,
                rotation: -30, // Tilt back
                duration: 0.3,
                ease: "sine.inOut", // Soft disappear
            });
        };

        window.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseover", onMouseOver);
        document.addEventListener("mouseout", onMouseOut);

        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseover", onMouseOver);
            document.removeEventListener("mouseout", onMouseOut);
        };
    });

    return (
        <div
            ref={cursorRef}
            className="fixed top-0 left-0 w-16 h-16 bg-white text-black rounded-full flex items-center justify-center text-xs font-bold pointer-events-none z-[9999] mix-blend-difference will-change-transform"
            style={{ transform: "translate(-50%, -50%)" }} // Center hotspot over actual mouse coordinates
        >
            View
        </div>
    );
}
