"use client";

import { useEffect, useRef, useState } from "react";
import "./Immersive.css";
import TransmissionWrapper from "./transmission/TransmissionWrapper";

export function ImmersiveSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const scrollHeight =
        containerRef.current.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;

      const newProgress = Math.max(0, Math.min(1, scrolled / scrollHeight));
      setProgress(newProgress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Phase breakdown:
  // 0-0.25: Zoom into the W
  // 0.25-0.5: 3D Circle appears
  // 0.5-1: Distorted text scrolls into view below circle

  const zoomPhase = Math.min(1, progress / 0.25);
  const circlePhase = Math.max(0, Math.min(1, (progress - 0.25) / 0.25));
  const textRevealPhase = Math.max(0, Math.min(1, (progress - 0.5) / 0.5));

  const scale = 1 + zoomPhase * 49;
  const letterOpacity = 1 - Math.min(1, zoomPhase * 1.5);
  const sceneOpacity =
    zoomPhase > 0.6 ? Math.min(1, (zoomPhase - 0.6) / 0.4) : 0;
  const circleOpacity = circlePhase;

  return (
    <>
      <section
        ref={containerRef}
        className="immersive-section"
        style={{ height: "500vh" }}
      >
        {/* Sticky Container - holds W zoom and 3D circle */}
        <div className="sticky-container">
          {/* The zoom layer with perspective - YOUR ORIGINAL W ZOOM */}
          <div
            className="zoom-layer"
            style={{
              opacity: 1 - circleOpacity,
            }}
          >
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

          {/* 3D Circle - Appears after W zoom */}
          <div
            className="circle-layer"
            style={{
              opacity: circleOpacity,
              pointerEvents: circleOpacity > 0 ? "auto" : "none",
            }}
          >
            <TransmissionWrapper />
          </div>

          {/* Corner frames - YOUR ORIGINAL CORNER FRAMES */}
          <div
            className="corner-frame top-left"
            style={{
              opacity: sceneOpacity * (1 - circleOpacity),
              transform: `scale(${0.5 + sceneOpacity * 0.5})`,
            }}
          />
          <div
            className="corner-frame top-right"
            style={{
              opacity: sceneOpacity * (1 - circleOpacity),
              transform: `scale(${0.5 + sceneOpacity * 0.5})`,
            }}
          />
          <div
            className="corner-frame bottom-left"
            style={{
              opacity: sceneOpacity * (1 - circleOpacity),
              transform: `scale(${0.5 + sceneOpacity * 0.5})`,
            }}
          />
          <div
            className="corner-frame bottom-right"
            style={{
              opacity: sceneOpacity * (1 - circleOpacity),
              transform: `scale(${0.5 + sceneOpacity * 0.5})`,
            }}
          />
        </div>
      </section>
    </>
  );
}
