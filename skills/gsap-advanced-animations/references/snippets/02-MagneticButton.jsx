import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

/**
 * Pattern: Magnetic Button with `quickTo`
 * Source: hetari-portfolio (activateMagneto)
 */
export default function MagneticButton({ children, strength = 40, textStrength = 60 }) {
    const btnRef = useRef(null);
    const textRef = useRef(null);

    useGSAP(() => {
        const btn = btnRef.current;
        const text = textRef.current;
        if (!btn || !text) return;

        // Create quickTo setters ONCE for performance (prevents tween buildup)
        const xBtn = gsap.quickTo(btn, "x", { duration: 1, ease: "elastic.out(1, 0.3)" });
        const yBtn = gsap.quickTo(btn, "y", { duration: 1, ease: "elastic.out(1, 0.3)" });
        const xText = gsap.quickTo(text, "x", { duration: 1, ease: "elastic.out(1, 0.3)" });
        const yText = gsap.quickTo(text, "y", { duration: 1, ease: "elastic.out(1, 0.3)" });

        const onMouseMove = (e) => {
            const { width, height, left, top } = btn.getBoundingClientRect();
            
            // Normalize distance from center (-0.5 to 0.5)
            const newX = ((e.clientX - left) / width - 0.5);
            const newY = ((e.clientY - top) / height - 0.5);

            // Container moves standard amount, text moves MORE to create depth
            xBtn(newX * strength);
            yBtn(newY * strength);
            xText(newX * textStrength);
            yText(newY * textStrength);
        };

        const onMouseLeave = () => {
            // Elastic spring back to center
            xBtn(0); yBtn(0); xText(0); yText(0);
        };

        btn.addEventListener("mousemove", onMouseMove);
        btn.addEventListener("mouseleave", onMouseLeave);

        return () => {
            btn.removeEventListener("mousemove", onMouseMove);
            btn.removeEventListener("mouseleave", onMouseLeave);
        };
    }, { scope: btnRef }); // Scope cleanup to component

    return (
        <button
            ref={btnRef}
            className="relative px-8 py-4 bg-white text-black rounded-full cursor-pointer flex items-center justify-center will-change-transform"
        >
            <span ref={textRef} className="block pointer-events-none font-medium will-change-transform">
                {children}
            </span>
        </button>
    );
}
