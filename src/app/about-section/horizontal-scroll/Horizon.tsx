"use client";
import React, { useEffect, useRef } from "react";
import "./Horizon.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const Horizons: React.FC = () => {
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLHeadingElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const scroller = scrollerRef.current;
    if (!track || !scroller) return;

    const slides = Array.from(
      scroller.querySelectorAll<HTMLElement>(".horizon-slide"),
    );

    const totalWidth = slides.reduce((a, s) => a + s.offsetWidth, 0);
    const moveDistance = totalWidth - window.innerWidth;

    const ctx = gsap.context(() => {
      gsap.to(scroller, {
        x: -moveDistance,
        ease: "none",
        scrollTrigger: {
          trigger: track,
          start: "top top",
          end: () => `+=${moveDistance * 0.7}`,
          pin: true,
          scrub: 0.7,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const pct = Math.round(self.progress * 100);
            if (counterRef.current)
              counterRef.current.textContent = String(pct);
            if (progressRef.current)
              progressRef.current.style.transform = `scaleX(${self.progress})`;
          },
        },
      });
    }, track);

    return () => ctx.revert();
  }, []);

  // Custom cursor
  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;
    const move = (e: MouseEvent) => {
      cursor.style.left = e.clientX + "px";
      cursor.style.top = e.clientY + "px";
    };
    const enter = () => cursor.classList.add("hover");
    const leave = () => cursor.classList.remove("hover");
    document.addEventListener("mousemove", move);
    const els = document.querySelectorAll(
      ".horizons-root section, .horizons-root h1, .horizons-root .social-links span",
    );
    els.forEach((el) => {
      el.addEventListener("mouseenter", enter);
      el.addEventListener("mouseleave", leave);
    });
    return () => {
      document.removeEventListener("mousemove", move);
      els.forEach((el) => {
        el.removeEventListener("mouseenter", enter);
        el.removeEventListener("mouseleave", leave);
      });
    };
  }, []);

  return (
    <div className="horizons-root" ref={trackRef}>
      <div className="horizons-sticky">
        <div className="horizons-container">
          <div className="horizons-cursor" ref={cursorRef} />
          <div id="scroller" className="horizons-scroller" ref={scrollerRef}>
            {/* Slide 1 - Hero Dimensions */}
            <section className="horizon-slide hero-img">
              <div className="geometric-bg" />
              <div className="hero-content">
                <div className="abstract-shapes">
                  <div className="shape shape-1" />
                  <div className="shape shape-2" />
                  <div className="shape shape-3" />
                  <div className="shape shape-4" />
                </div>
                <div className="hero-text">
                  <span className="hero-glitch" data-text="DIMENSIONS">
                    DIMENSIONS
                  </span>
                </div>
              </div>
              <div className="section-label">01</div>
            </section>

            {/* Slide 2 - Infinity */}
            <section className="horizon-slide hero-img">
              <div className="grid-bg" />
              <div className="pulse-ring" />
              <div className="hero-content">
                <div className="neon-text">INFINITY</div>
                <div className="dot-matrix" />
              </div>
              <div className="section-label">02</div>
            </section>

            {/* Slide 3 - Main Quote */}
            <section className="horizon-slide header">
              <div className="glitch-wrapper">
                <h1
                  className="glitch-text"
                  data-text="Traversing the frontier of digital evolution, crafting the future."
                >
                  Traversing the frontier of digital evolution, crafting the
                  future.
                </h1>
              </div>
              <div className="scroll-indicator" />
            </section>

            {/* Slide 4 - About / Manifesto */}
            <section className="horizon-slide about">
              <div className="about-bg-pattern" />
              <div className="row">
                <div className="copy">
                  <span className="eyebrow">MANIFESTO</span>
                  <p>
                    In a world shaped by velocity and precision, we engineer the
                    next generation of experiences.
                  </p>
                  <p>
                    Propelled by data, intuition, and creativity, we build
                    ecosystems where the digital and physical seamlessly
                    converge.
                  </p>
                  <div className="accent-line" />
                </div>
                <div className="img">
                  <div className="abstract-art">
                    <div className="art-layer" />
                    <div className="art-layer" />
                    <div className="art-layer" />
                  </div>
                </div>
              </div>
              <h1>Future Architectonics</h1>
            </section>

            {/* Slide 5 - Banner (Final Slide) */}
            <section className="horizon-slide banner-img">
              <div className="wave-bg" />
              <div className="banner-content">
                <div className="gradient-orb" />
                <div className="banner-caption">
                  <span>WHERE</span>
                  <span className="banner-main">VISIONS</span>
                  <span>IGNITE</span>
                </div>
              </div>
              <div className="particles" />
              <div className="section-label">05</div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Horizons;
