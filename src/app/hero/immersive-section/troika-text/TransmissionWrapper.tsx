// TransmissionWrapper.tsx
"use client";

import { Canvas } from "@react-three/fiber";
import Scene from "./Scene";
import ProjectCard from "../cards/Cards";
import { useEffect, useRef } from "react";

const CARDS = [
  {
    title: "MASKED.\nMARKED.\nWATCHED.",
    coordinates: "35.6762° N / 139.6503° E",
    tag: "JAPAN",
    description:
      "Holographic billboards light up the towering skyline, while traditional temples are reduced to relics.",
    ctaLabel: "_EXECUTE",
    onCta: () => window.open("https://example.com", "_blank"),
    stats: [
      { value: "24/7", label: "MONITOR" },
      { value: "∞", label: "RECORD" },
      { value: "99.9%", label: "ACCURACY" },
    ],
    subTag: "THREE.JS / WEBGL",
    subTitle: "FREEDOM TRADED\nFOR SECURITY.",
    version: "VER: 2.0.0-RC.1",
    badge: "FEATURED",
    progress: 78,
    status: "active" as const,
    metrics: [
      { label: "LATENCY", value: "0.2ms", trend: "down" as const },
      { label: "BANDWIDTH", value: "1.4TB/s", trend: "up" as const },
      { label: "UPTIME", value: "99.99%", trend: "stable" as const },
    ],
  },
  {
    title: "TRACE.\nTRACK.\nCONTROL.",
    coordinates: "51.5074° N / 0.1278° W",
    tag: "LONDON",
    description:
      "A city blanketed in surveillance infrastructure, where every movement is catalogued and scored.",
    ctaLabel: "_EXECUTE",
    onCta: () => window.open("https://example.com", "_blank"),
    stats: [
      { value: "6M+", label: "CAMERAS" },
      { value: "0.3s", label: "ID TIME" },
      { value: "100%", label: "COVERAGE" },
    ],
    subTag: "THREE.JS / WEBGL",
    subTitle: "NOWHERE\nTO HIDE.",
    version: "VER: 2.0.0-RC.2",
    badge: "CLASSIFIED",
    progress: 91,
    status: "active" as const,
    metrics: [
      { label: "LATENCY", value: "0.3ms", trend: "stable" as const },
      { label: "FACES/HR", value: "2.1M", trend: "up" as const },
      { label: "UPTIME", value: "99.97%", trend: "stable" as const },
    ],
  },
  {
    title: "SCORE.\nRANK.\nEXCLUDE.",
    coordinates: "39.9042° N / 116.4074° E",
    tag: "BEIJING",
    description:
      "Social credit infrastructure rewards compliance and punishes dissent at algorithmic scale.",
    ctaLabel: "_EXECUTE",
    onCta: () => window.open("https://example.com", "_blank"),
    stats: [
      { value: "1.4B", label: "PROFILED" },
      { value: "A–F", label: "SCORING" },
      { value: "∞", label: "MEMORY" },
    ],
    subTag: "THREE.JS / WEBGL",
    subTitle: "OBEY OR\nDISAPPEAR.",
    version: "VER: 2.0.0-RC.3",
    badge: "RESTRICTED",
    progress: 99,
    status: "completed" as const,
    metrics: [
      { label: "LATENCY", value: "0.1ms", trend: "down" as const },
      { label: "COMPLIANCE", value: "98.2%", trend: "up" as const },
      { label: "UPTIME", value: "100%", trend: "stable" as const },
    ],
  },
];

const DIVE_END = 0.57; // progress at which 3D dive is complete
const CARDS_START = 0.57; // when horizontal scroll begins
const TOTAL_HEIGHT = "700vh"; // 400vh dive + 300vh cards (100vh each)

export default function TransmissionWrapper() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const hintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const scrollHeight = section.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / scrollHeight));

      // How far we are into the card phase (0 → 1 across all 3 cards)
      const cardPhaseProgress = Math.max(
        0,
        Math.min(1, (progress - CARDS_START) / (1 - CARDS_START)),
      );

      // Continuous card index (0 → 3)
      const cardContinuous = cardPhaseProgress * CARDS.length;
      const activeCard = Math.min(Math.floor(cardContinuous), CARDS.length - 1);

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

      // Animate each card
      cardRefs.current.forEach((card, i) => {
        if (!card) return;

        // offset: 0 = centered, negative = left (gone), positive = right (incoming)
        const offset = i - cardContinuous;

        // Clamp so cards far away don't render off in space
        const clampedOffset = Math.max(-1.5, Math.min(1.5, offset));

        const translateX = clampedOffset * 110; // 110% per card
        const opacity =
          Math.abs(clampedOffset) < 0.5
            ? 1
            : Math.max(0, 1 - (Math.abs(clampedOffset) - 0.5) * 3);
        const scale = 1 - Math.abs(clampedOffset) * 0.08;

        card.style.transform = `translateX(${translateX}%) scale(${scale})`;
        card.style.opacity = String(opacity);
      });

      // Update dots
      dotRefs.current.forEach((dot, i) => {
        if (!dot) return;
        dot.style.opacity = i === activeCard ? "1" : "0.3";
        dot.style.transform = i === activeCard ? "scale(1.4)" : "scale(1)";
      });

      // Hide scroll hint after first card is fully in view
      if (hintRef.current) {
        hintRef.current.style.opacity = cardPhaseProgress > 0.08 ? "0" : "0.5";
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

      {/* Horizontal card carousel overlay */}
      <div
        ref={overlayRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: 0,
          pointerEvents: "none",
          zIndex: 10,
          overflow: "hidden",
        }}
      >
        {/* Cards track */}
        <div
          style={{
            position: "relative",
            width: "min(720px, 90vw)",
            height: "100%",
            display: "flex",
            alignItems: "center",
          }}
        >
          {CARDS.map((card, i) => (
            <div
              key={i}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              style={{
                position: "absolute",
                width: "100%",
                paddingTop: "20px",
                willChange: "transform, opacity",
                // cards start stacked to the right, slide left as you scroll
                transform: `translateX(${i * 110}%) scale(1)`,
                opacity: i === 0 ? 1 : 0,
                transition: "none", // scroll-jacked — no CSS easing
              }}
            >
              <ProjectCard {...card} />
            </div>
          ))}
        </div>

        {/* Dot indicators */}
        <div
          ref={indicatorRef}
          style={{
            position: "absolute",
            bottom: "3rem",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "10px",
            alignItems: "center",
          }}
        >
          {CARDS.map((_, i) => (
            <span
              key={i}
              ref={(el) => {
                dotRefs.current[i] = el;
              }}
              style={{
                display: "block",
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#e8180c",
                opacity: i === 0 ? 1 : 0.3,
                transform: i === 0 ? "scale(1.4)" : "scale(1)",
                transition: "opacity 0.2s ease, transform 0.2s ease",
              }}
            />
          ))}
        </div>

        {/* Card counter */}
        <div
          style={{
            position: "absolute",
            top: "2rem",
            right: "2rem",
            fontFamily: "'Space Mono', monospace",
            fontSize: "10px",
            color: "#e8180c",
            opacity: 0.5,
            letterSpacing: "0.1em",
          }}
        >
          SCROLL →
        </div>
      </div>
    </section>
  );
}
