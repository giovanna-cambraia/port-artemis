"use client";

import { useEffect, useRef, useState } from "react";
import "./Immersive.css";

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
  // 0.25-0.75: Inside the portal scene
  // 0.75-1: Exit the scene

  const zoomPhase = Math.min(1, progress / 0.25);
  const insidePhase = Math.max(0, Math.min(1, (progress - 0.25) / 0.5));
  const exitPhase = Math.max(0, (progress - 0.75) / 0.25);

  const scale = 1 + zoomPhase * 49;
  const letterOpacity = 1 - Math.min(1, zoomPhase * 1.5);
  const sceneOpacity =
    zoomPhase > 0.6 ? Math.min(1, (zoomPhase - 0.6) / 0.4) : 0;

  return (
    <section
      ref={containerRef}
      className="immersive-section"
      style={{ height: "400vh" }}
    >
      {/* Sticky Container */}
      <div className="sticky-container">
        {/* The zoom layer with perspective */}
        <div className="zoom-layer">
          {/* The W letter that we zoom into */}
          <div
            className="w-letter-container"
            style={{
              transform: `scale(${scale}) translateZ(${zoomPhase * 500}px)`,
              opacity: letterOpacity,
            }}
          >
            {/* The phrase with the W as portal */}
            <h2 className="portal-phrase">
              <span className="phrase-prefix">THE </span>
              <span className="w-letter-wrapper">
                <span className="w-letter">W</span>
                {/* The portal hole inside W */}
                <div className="portal-hole" />
              </span>
              <span className="phrase-suffix">AY</span>
            </h2>
          </div>
        </div>

        {/* The inner scene (revealed after zooming through W) */}
        <div
          className="inner-scene"
          style={{
            opacity: sceneOpacity,
            transform: `translateY(${(1 - insidePhase) * 50}px)`,
          }}
        >
          {/* Background elements */}
          <div className="scene-background">
            {/* Floating particles */}
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="floating-particle"
                style={{
                  left: `${10 + ((i * 4.2) % 80)}%`,
                  top: `${10 + ((i * 3.7) % 80)}%`,
                  transform: `translateY(${Math.sin(insidePhase * Math.PI * 2 + i) * 20}px)`,
                  opacity: 0.3 + insidePhase * 0.4,
                }}
              />
            ))}

            {/* Radial gradient */}
            <div
              className="radial-gradient"
              style={{
                background: `radial-gradient(circle at 50% 50%, rgba(125, 159, 122, ${0.1 + insidePhase * 0.1}) 0%, transparent 60%)`,
              }}
            />
          </div>

          {/* Content inside the portal */}
          <div
            className="portal-content"
            style={{
              opacity: Math.min(1, insidePhase * 2),
              transform: `translateY(${(1 - Math.min(1, insidePhase * 2)) * 30}px)`,
            }}
          >
            <p className="portal-badge">Inside The Process</p>
            <h3 className="portal-title">
              Where Ideas
              <br />
              <span className="portal-title-accent">Come Alive</span>
            </h3>
            <p className="portal-description">
              Every project is a journey. From the first spark of an idea to the
              final pixel, I craft digital experiences that resonate, perform,
              and inspire.
            </p>
          </div>

          {/* Stats that appear as you scroll inside */}
          <div
            className="portal-stats"
            style={{
              opacity: Math.max(0, (insidePhase - 0.3) / 0.4),
              transform: `translateY(${Math.max(0, (0.7 - insidePhase) * 50)}px)`,
            }}
          >
            {[
              { value: "100%", label: "Dedication" },
              { value: "24/7", label: "Support" },
              { value: "∞", label: "Possibilities" },
            ].map((stat, i) => (
              <div key={i} className="stat-item">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Exit hint */}
          <div
            className="exit-hint"
            style={{
              opacity: insidePhase > 0.5 && exitPhase < 0.5 ? 0.5 : 0,
            }}
          >
            <span className="exit-hint-text">Keep scrolling to exit</span>
            <div className="exit-hint-line" />
          </div>
        </div>

        {/* Exit transition - zoom out effect */}
        <div
          className="exit-transition"
          style={{
            opacity: exitPhase,
          }}
        />

        {/* Corner frames */}
        <div
          className="corner-frame top-left"
          style={{
            opacity: sceneOpacity,
            transform: `scale(${0.5 + sceneOpacity * 0.5})`,
          }}
        />
        <div
          className="corner-frame top-right"
          style={{
            opacity: sceneOpacity,
            transform: `scale(${0.5 + sceneOpacity * 0.5})`,
          }}
        />
        <div
          className="corner-frame bottom-left"
          style={{
            opacity: sceneOpacity,
            transform: `scale(${0.5 + sceneOpacity * 0.5})`,
          }}
        />
        <div
          className="corner-frame bottom-right"
          style={{
            opacity: sceneOpacity,
            transform: `scale(${0.5 + sceneOpacity * 0.5})`,
          }}
        />

        {/* Progress indicator */}
        <div className="progress-indicator" style={{ opacity: sceneOpacity }}>
          <div
            className="progress-indicator-fill"
            style={{ height: `${insidePhase * 100}%` }}
          />
        </div>
      </div>
    </section>
  );
}
