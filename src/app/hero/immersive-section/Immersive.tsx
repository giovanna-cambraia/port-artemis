"use client";

import { useEffect, useRef, useState } from "react";
import "./Immersive.css";
import TransmissionWrapper from "./troika-text/TransmissionWrapper";

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

  // 0.00 – 0.25  W zooms in
  // 0.25 – 0.50  3D circle appears
  // 0.50 – 0.75  text fades in below circle
  // 0.75 – 1.00  everything fades out, ready for cards

  function phase(start: number, end: number) {
    return Math.max(0, Math.min(1, (progress - start) / (end - start)));
  }

  const zoomPhase = phase(0, 0.25);
  const circlePhase = phase(0.25, 0.5);
  const textPhase = phase(0.5, 0.75);
  const exitPhase = phase(0.75, 1.0);

  const scale = 1 + zoomPhase * 49;
  const letterOpacity = 1 - Math.min(1, zoomPhase * 1.5);
  const circleOpacity = circlePhase * (1 - exitPhase);
  const textOpacity = textPhase * (1 - exitPhase);
  const textY = (1 - textPhase) * 32; // slides up as it enters

  return (
    <section
      ref={containerRef}
      className="immersive-section"
      style={{ height: "400vh" }}
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

        {/* 3D Circle */}
        <div
          className="circle-layer"
          style={{
            opacity: circleOpacity,
            pointerEvents: circleOpacity > 0 ? "auto" : "none",
          }}
        >
          <TransmissionWrapper />
        </div>

        {/* Progress indicator */}
        <div className="progress-indicator">
          <div
            className="progress-indicator-fill"
            style={{ height: `${progress * 100}%` }}
          />
        </div>
      </div>

    </section>
  );
}
