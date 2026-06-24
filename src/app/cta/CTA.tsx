"use client";

import { useEffect, useRef } from "react";
import "../about-section/AboutSection.css"; 

/**
 * CtaSection
 * -----------
 * Extracted out of AboutSection.tsx. Previously this was "PANEL 5 — CTA"
 * rendered inline at the end of the long scroll. Per the decision to keep
 * everything else as one continuous scroll but break the CTA onto its own
 * page (a deliberate "cut" after the black hole payoff), this now lives
 * standalone and should be rendered on its own route.
 *
 * NOTE ON CSS: all `.cta-*` / `.about-panel--cta` rules currently live in
 * AboutSection.css. This works (importing AboutSection.css here pulls them
 * in) but it's a smell — those styles are coupled to a file this component
 * no longer lives next to. Worth eventually moving the `.cta-*` block into
 * its own CtaSection.css and deleting it from AboutSection.css. Not done
 * here automatically since AboutSection.css wasn't in hand to safely split
 * without risking breaking other selectors that might share specificity.
 */
export default function CtaSection() {
  const ctaInnerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctaObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (ctaInnerRef.current)
              ctaInnerRef.current.classList.add("revealed");

            const handleMouseMove = (e: MouseEvent) => {
              if (!ctaInnerRef.current) return;
              const rect = ctaInnerRef.current.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
              const y = ((e.clientY - rect.top) / rect.height - 0.5) * 20;
              ctaInnerRef.current.style.transform = `rotateY(${x}deg) rotateX(${-y}deg)`;
            };

            window.addEventListener("mousemove", handleMouseMove);
            return () =>
              window.removeEventListener("mousemove", handleMouseMove);
          }
        });
      },
      { threshold: 0.3 },
    );

    if (ctaInnerRef.current) ctaObserver.observe(ctaInnerRef.current);

    return () => ctaObserver.disconnect();
  }, []);

  return (
    <div className="about-panel about-panel--cta">
      <canvas className="cta-particles" aria-hidden="true" />

      <div className="cta-bg-text" aria-hidden="true">
        <span className="cta-bg-line cta-bg-line--1">LET'S</span>
        <span className="cta-bg-line cta-bg-line--2">WORK</span>
      </div>

      <div className="cta-inner" ref={ctaInnerRef}>
        <div className="cta-status">
          <span className="cta-status-dot" />
          <span className="cta-status-label">Available for projects</span>
        </div>

        <h2 className="cta-headline">
          <span className="cta-hl-row">
            <span className="cta-hl-word">Got a</span>
            <span className="cta-hl-glitch" data-text="vision?">
              vision?
            </span>
          </span>
          <span className="cta-hl-row cta-hl-row--muted">Let's make it</span>
          <span className="cta-hl-row cta-hl-accent">real.</span>
        </h2>

        <p className="cta-descriptor">
          From first sketch to final pixel — I build things that matter.
        </p>

        <div className="cta-footer">
          <span className="cta-footer-line" />
          <span className="cta-footer-text">
            Response within 24h · Remote worldwide
          </span>
          <span className="cta-footer-line" />
        </div>
      </div>

      <div className="cta-coords cta-coords--tl" aria-hidden="true">
        <span>LAT 48°51'N</span>
        <span>LNG 002°21'E</span>
      </div>
      <div className="cta-coords cta-coords--br" aria-hidden="true">
        <span>EST. MMXXV</span>
        <span>v3.0.0</span>
      </div>
    </div>
  );
}