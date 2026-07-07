"use client";

import { useEffect, useRef, useState } from "react";
import { GridScan } from "../../react-components/grid-scan/GridScan"; 
import "./Immersive.css";
import styles from "../immersive-section/about-header/AboutHeader.module.css";

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
      setProgress(Math.max(0, Math.min(1, scrolled / scrollHeight)));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function phase(start: number, end: number) {
    return Math.max(0, Math.min(1, (progress - start) / (end - start)));
  }

  // W zoom occupies the first ~55% of scroll
  const zoomPhase = phase(0, 0.5);
  const wFadeOut = phase(0.4, 0.55);

  // About content arrives in the remaining scroll, with parallax offsets
  const aboutReveal = phase(0.45, 0.65);
  const leftParallax = phase(0.45, 1);
  const rightParallax = phase(0.45, 1);

  const scale = 1 + zoomPhase * 49;
  const letterOpacity = 1 - Math.min(1, wFadeOut * 1.5);

  return (
    <section
      ref={containerRef}
      className="immersive-section"
      style={{ height: "250vh" }} // longer track: W beat + about beat
    >
      <div className="sticky-container">
        {/* Background grid — present throughout, more visible as W fades */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.3 + aboutReveal * 0.7,
            transition: "opacity 0.1s linear",
          }}
        >
          <GridScan
            sensitivity={0.55}
            lineThickness={1}
            linesColor="#ffffff"
            gridScale={0.1}
            scanColor="#ebebeb"
            scanOpacity={0.4}
            enablePost
            bloomIntensity={0.6}
            chromaticAberration={0.002}
            noiseIntensity={0.01}
            lineJitter={0.1}
            scanGlow={0.5}
            scanSoftness={2}
            enableWebcam={false}
            showPreview={false}
          />
        </div>

        {/* W letter zoom */}
        <div
          className="zoom-layer"
          style={{ opacity: 1 - wFadeOut, zIndex: 5 }}
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

        {/* About content — fades/parallaxes in as W dissolves */}
        <div
          className={styles.content}
          style={{
            opacity: aboutReveal,
            zIndex: 4,
            pointerEvents: aboutReveal > 0.8 ? "auto" : "none",
          }}
        >
          <div
            className={styles.left}
            style={{
              transform: `translateX(${(1 - leftParallax) * -60}px)`,
            }}
          >
            <p className={styles.hey}>HEY</p>
            <h1 className={styles.name}>I&apos;m Artem</h1>
          </div>

          <div
            className={styles.center}
            style={{
              transform: `rotate(-1.5deg) translateY(${
                (1 - aboutReveal) * 40
              }px)`,
            }}
          />

          <div
            className={styles.right}
            style={{
              transform: `translateX(${(1 - rightParallax) * 60}px)`,
            }}
          >
            <p className={styles.bio}>
              Director & Creative Lead. Founder of{" "}
              <strong>ZHEESHEE studio</strong>. I mix live action with CG —
              building worlds, inventing characters, making things that
              shouldn&apos;t exist look real. Or unreal. As long as you
              can&apos;t stop looking at it.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}