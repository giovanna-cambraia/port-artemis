"use client";

import { useEffect, useRef, useState } from "react";
import "./Immersive.css";
import TransmissionWrapper from "./3Dscene/TransmissionWrapper";
import ProjectsSection from "../about-section/AboutSection";

export function ImmersiveSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [showWebGLText, setShowWebGLText] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scrollHeight =
        containerRef.current.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      const newProgress = Math.max(0, Math.min(1, scrolled / scrollHeight));
      setProgress(newProgress);

      if (newProgress >= 0.5 && !showWebGLText) {
        setShowWebGLText(true);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [showWebGLText]);



  function phase(start: number, end: number) {
    return Math.max(0, Math.min(1, (progress - start) / (end - start)));
  }

  const zoomPhase = phase(0, 0.85);
  const circlePhase = phase(0.90, 1);


  const scale = 1 + zoomPhase * 49;
  const letterOpacity = 1 - Math.min(1, zoomPhase * 1.5);


  return (
    <section
      ref={containerRef}
      className="immersive-section"
      style={{ height: "150vh" }}
    >
      <div className="sticky-container">
        {/* W letter zoom */}
        <div className="zoom-layer" style={{ opacity: 1 - circlePhase }}>
          <div
            className="w-letter-container"
            style={{
              transform: `scale(${scale}) translateZ(${zoomPhase * 500}px)`,
              opacity: letterOpacity,
            }}
          >
            <h2 className="portal-phrase">
              <span className="phrase-prefix">THE </span>
              <span className="w-letter-wrapper">
                <span className="w-letter">W</span>
                <div className="portal-hole" />
              </span>
              <span className="phrase-suffix">AY</span>
            </h2>
          </div>
        </div>
    
      </div>
    </section>
  );
}
