import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

/**
 * Pattern: Scroll-Direction-Aware Marquee
 * Source: capsule (MarqueeText.jsx)
 */
export default function ScrollMarquee({ text = "Premium Quality *" }) {
    const animRef = useRef(null);
    const directionRef = useRef("forward");

    useGSAP(() => {
        const startMarquee = (direction = "forward") => {
            if (animRef.current) animRef.current.kill();

            animRef.current = gsap.to(".marquee-track", {
                x: direction === "forward" ? "-50%" : "0%",
                duration: 10,
                repeat: -1,
                ease: "none", // Must be linear for seamless loop
                modifiers: {
                    // Modulo keeps x mapped to 0-50% for seamless loop since content is duplicated
                    // gsap.utils.unitize maintains the '%' unit
                    x: gsap.utils.unitize(x => parseFloat(x) % 50),
                }
            });

            // Revolve the separator icon smoothly when direction flips
            gsap.to(".marquee-icon", {
                rotation: direction === "forward" ? "+=110" : "-=110",
                duration: 0.5,
                ease: "power2.out",
            });
        };

        // Start default animation
        startMarquee("forward");

        // Listen for wheel direction changes
        const onWheel = (e) => {
            const newDir = e.deltaY > 0 ? "forward" : "reverse";
            if (newDir !== directionRef.current) {
                directionRef.current = newDir;
                startMarquee(newDir);
            }
        };

        window.addEventListener("wheel", onWheel);
        return () => window.removeEventListener("wheel", onWheel);
    });

    const items = Array(6).fill(text);

    return (
        <div className="overflow-hidden w-full bg-zinc-950 py-10">
            <div className="marquee-track flex w-max will-change-transform">
                {/* Double the items for seamless looping */}
                {[...items, ...items].map((item, i) => (
                    <div key={i} className="flex-shrink-0 px-8 flex items-center text-8xl font-black text-white uppercase">
                        {item.replace("*", "")}
                        {item.includes("*") && <span className="marquee-icon ml-8 text-amber-500">*</span>}
                    </div>
                ))}
            </div>
        </div>
    );
}
