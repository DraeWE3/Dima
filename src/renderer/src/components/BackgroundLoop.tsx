import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import bg1 from '../assets/bg1.mp4';
import bg2 from '../assets/bg2.mp4';
import bg3 from '../assets/bg3.mp4';

const VIDEOS = [bg1, bg2, bg3];

export function BackgroundLoop() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % VIDEOS.length);
    }, 10000); // 10s
    return () => clearInterval(interval);
  }, []);

  useGSAP(() => {
    if (!containerRef.current) return;
    const videos = containerRef.current.querySelectorAll("video");
    videos.forEach((vid, index) => {
      if (index === currentIndex) {
        gsap.to(vid, {
          opacity: 1,
          duration: 2,
          ease: "power2.inOut",
        });
      } else {
        gsap.to(vid, {
          opacity: 0,
          duration: 2,
          ease: "power2.inOut",
        });
      }
    });
  }, { dependencies: [currentIndex], scope: containerRef });

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-black">
      {VIDEOS.map((src, idx) => (
        <video
          key={src}
          src={src}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: idx === 0 ? 1 : 0 }}
        />
      ))}
    </div>
  );
}
