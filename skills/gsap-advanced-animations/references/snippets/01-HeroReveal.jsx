import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

/**
 * Pattern: Hero Reveal with SplitText & ClipPath
 * Source: spylt-milk (HeroSection.tsx), hetari-portfolio
 */
export default function HeroReveal() {
    useGSAP(() => {
        // MUST wait for fonts to load before splitting text
        document.fonts.ready.then(() => {
            const titleSplit = new SplitText(".hero-title", { type: "chars" });
            gsap.set(titleSplit.chars, { force3D: true });

            const tl = gsap.timeline({ delay: 0.2 });

            // 1. Reveal wrapper
            tl.to(".hero-wrapper", { opacity: 1, duration: 0.1 })
            // 2. Clip path reveal for subtitle (blind opening effect)
            .to(".clip-reveal", {
                duration: 1,
                clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
                ease: "circ.out"
            })
            // 3. Stagger chars up
            .from(titleSplit.chars, {
                yPercent: 110,
                stagger: 0.02,
                duration: 1,
                ease: "power4.out" // Awwwards standard "snap" ease
            }, "-=0.5");

            // Scroll exit: tilt and shrink as user scrolls past hero
            gsap.to(".hero-container", {
                rotate: 7,
                scale: 0.9,
                yPercent: 30,
                ease: "power1.inOut",
                scrollTrigger: {
                    trigger: ".hero-container",
                    start: "1% top",
                    end: "bottom top",
                    scrub: true,
                }
            });
        });
    });

    return (
        <div className="hero-container h-screen flex items-center justify-center bg-zinc-900 text-white overflow-hidden">
            <div className="hero-wrapper opacity-0 text-center">
                {/* Requires initial CSS: clip-path: polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%) */}
                <div className="clip-reveal overflow-hidden" style={{ clipPath: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)' }}>
                    <p className="text-xl tracking-widest uppercase mb-4">Premium Quality</p>
                </div>
                <div className="overflow-hidden">
                    <h1 className="hero-title text-8xl font-bold uppercase leading-none">Awwwards</h1>
                </div>
            </div>
        </div>
    );
}
