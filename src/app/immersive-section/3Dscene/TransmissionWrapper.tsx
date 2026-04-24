// TransmissionWrapper.tsx
"use client";

import { Canvas } from "@react-three/fiber";
import Scene from "./Scene";
import { useEffect, useRef } from "react";


const DIVE_END = 0.5;
const TOTAL_HEIGHT = "600vh";
export default function TransmissionWrapper() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const scrollHeight = section.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / scrollHeight));

      // Fade in the overlay when dive is done
      if (overlayRef.current) {
        const overlayOpacity = Math.max(
          0,
          Math.min(1, (progress - DIVE_END + 0.03) / 0.04),
        );
        overlayRef.current.style.opacity = String(overlayOpacity);
        overlayRef.current.style.pointerEvents =
          overlayOpacity > 0.1 ? "auto" : "none";
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{ height: TOTAL_HEIGHT, position: "relative" }}
      className="immersive-section"
    >
      {/* 3D Canvas — always fixed behind everything */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100vh",
          zIndex: 0,
        }}
      >
        <Canvas
          shadows
          camera={{ fov: 45, position: [0, 6, 6], near: 0.1, far: 100 }}
          style={{ background: "#000000" }}
        >
          <Scene />
        </Canvas>
      </div>

      {/* Scroll hint */}
      <div
        style={{
          position: "fixed",
          bottom: "2rem",
          left: "50%",
          transform: "translateX(-50%)",
          color: "#e8180c",
          fontFamily: "'Space Mono', monospace",
          fontSize: "10px",
          letterSpacing: "0.1em",
          opacity: 0.5,
          transition: "opacity 0.4s ease",
          pointerEvents: "none",
          zIndex: 5,
        }}
        ref={hintRef}
      >
        SCROLL TO DIVE ↓
      </div>
    </section>
  );
}
