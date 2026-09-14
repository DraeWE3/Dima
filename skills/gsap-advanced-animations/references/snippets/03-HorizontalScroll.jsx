import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

/**
 * Pattern: Pinned Horizontal Scroll with Dynamic Width
 * Source: spylt-milk (FlavorSection.tsx)
 */
export default function HorizontalScroll() {
    const sectionRef = useRef(null);
    const sliderRef = useRef(null);

    useGSAP(() => {
        const slider = sliderRef.current;
        if (!slider) return;

        // Calculate exactly how far to scroll horizontally
        // This makes the animation robust regardless of how many items are in the slider
        const scrollAmount = slider.scrollWidth - window.innerWidth;

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 0%",
                end: "+=4000", // Controls speed (higher = slower vertical-to-horizontal mapping)
                scrub: true,
                pin: true,     // Keeps section in viewport while scrubbing
            },
        });

        tl.to(slider, {
            x: `-${scrollAmount}px`,
            ease: "power1.inOut", // Slight ease prevents jarring start/stop
        });
    }, { scope: sectionRef });

    return (
        <section ref={sectionRef} className="h-screen w-full overflow-hidden bg-zinc-900">
            <div
                ref={sliderRef}
                className="flex h-full w-max items-center px-20 gap-20 will-change-transform"
            >
                {/* Mock Slides */}
                {[1, 2, 3, 4, 5].map((item) => (
                    <div key={item} className="w-[60vw] h-[60vh] bg-zinc-800 rounded-3xl shrink-0 flex items-center justify-center">
                        <h2 className="text-6xl text-white font-bold">Slide {item}</h2>
                    </div>
                ))}
            </div>
        </section>
    );
}
