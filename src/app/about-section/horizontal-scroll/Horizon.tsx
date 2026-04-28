import React, { useEffect, useRef } from "react";
import "./Horizon.css";

const Horizons: React.FC = () => {
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLHeadingElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const scroller = scrollerRef.current;
    const counter = counterRef.current;
    const bar = progressRef.current;
    if (!track || !scroller) return;

    const slides = Array.from(
      scroller.querySelectorAll<HTMLElement>(".horizon-slide"),
    );
    const getMax = () =>
      slides.reduce((a, s) => a + s.offsetWidth, 0) - window.innerWidth;

    // ── UI update ──────────────────────────────────────────────────
    const updateUI = (x: number) => {
      const max = getMax();
      scroller.style.transform = `translateX(-${x}px)`;
      const pct = max > 0 ? Math.round((x / max) * 100) : 0;
      if (counter) counter.textContent = String(Math.min(pct, 100));
      if (bar) bar.style.transform = `scaleX(${Math.min(pct / 100, 1)})`;
    };

    // ── lerp state ─────────────────────────────────────────────────
    let currentX = 0;
    let targetX = 0;
    let rafId: number | null = null;
    let locked = false;
    let progress = 0;

    // Captured at lock time — document-level position of the track
    let trackDocTop = 0;

    // ── lock ───────────────────────────────────────────────────────
    const lock = () => {
      if (locked) return;
      console.trace("LOCK called");
      locked = true;
      trackDocTop = track.getBoundingClientRect().top + window.scrollY;
      const y = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${y}px`;
      document.body.style.width = "100%";
      document.body.style.overflowY = "scroll";
    };

    // ── unlock ─────────────────────────────────────────────────────

    let unlockCooldown = false;

    const unlock = (jumpTo: "after" | "before") => {
      if (!locked) return;
      console.trace("UNLOCK called", jumpTo);
      locked = false;
      unlockCooldown = true;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflowY = "";

      if (jumpTo === "after") {
        const max = getMax();
        targetX = max;
        currentX = max;
        progress = 1;
        updateUI(currentX);
        window.scrollTo(0, trackDocTop + window.innerHeight);
      } else {
        targetX = 0;
        currentX = 0;
        progress = 0;
        updateUI(0);
        window.scrollTo(0, Math.max(0, trackDocTop - 1));
      }

      setTimeout(() => {
        unlockCooldown = false;
      }, 800);
    };
    // ── animation loop ─────────────────────────────────────────────
    const animate = () => {
      const max = getMax();
      currentX = currentX + (targetX - currentX) * 0.08;
      updateUI(currentX);
      progress = max > 0 ? currentX / max : 0;

      const stillMoving = Math.abs(targetX - currentX) > 0.2;

      if (stillMoving) {
        rafId = requestAnimationFrame(animate);
      } else {
        currentX = targetX;
        updateUI(currentX);
        rafId = null;

        // reached the end → unlock forward
        if (locked && targetX >= max - 1) {
          unlock("after");
        }
        // reached the start → unlock backward
        if (locked && targetX <= 1) {
          unlock("before");
        }
      }
    };

    const startAnim = () => {
      if (!rafId) rafId = requestAnimationFrame(animate);
    };

    // ── wheel handler ──────────────────────────────────────────────
    const handleWheel = (e: WheelEvent) => {
      if (unlockCooldown) return;

      const rect = track.getBoundingClientRect();
      const max = getMax();
      const atStart = currentX <= 0;
      const atEnd = currentX >= max;

      const insideScrollZone = rect.top <= 0 && rect.bottom > 0;

      if (!locked) {
        if (e.deltaY > 0 && insideScrollZone && atStart) lock();
        if (e.deltaY < 0 && insideScrollZone && atEnd) lock();
      }

      if (!locked) return;

      e.preventDefault();
      const next = targetX + e.deltaY * 1.2;
      targetX = Math.min(Math.max(next, 0), max);
      startAnim();
    };

    const handleScroll = () => {
      if (locked) return;
      const rect = track.getBoundingClientRect();
      const max = getMax();

      if (rect.bottom < 0) {
        // Scrolled completely past — keep at end
        targetX = max;
        currentX = max;
        progress = 1;
        updateUI(currentX);
      }
      if (rect.top > window.innerHeight) {
        // Scrolled completely above — keep at start
        targetX = 0;
        currentX = 0;
        progress = 0;
        updateUI(0);
      }
    };

    // ── touch ──────────────────────────────────────────────────────
    let touchY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (!locked) return;
      e.preventDefault();
      const dy = touchY - e.touches[0].clientY;
      touchY = e.touches[0].clientY;
      const max = getMax();
      targetX = Math.min(Math.max(targetX + dy * 1.5, 0), max);
      startAnim();
    };

    // ── resize ─────────────────────────────────────────────────────
    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        targetX = progress * getMax();
        currentX = targetX;
        updateUI(currentX);
      }, 100);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("resize", handleResize);

    return () => {
      // always restore scroll on unmount
      if (locked) {
        const y = Math.abs(parseInt(document.body.style.top || "0", 10));
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflowY = "";
        window.scrollTo(0, y);
      }
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("resize", handleResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // ── custom cursor ──────────────────────────────────────────────
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
    <div
      className="horizons-root"
      ref={trackRef}
      style={{ position: "relative", height: "500vh" }}
    >
      <div
        className="horizons-sticky"
        style={{
          position: "sticky",
          top: 0,
          height: "140vh",
          overflow: "hidden",
        }}
      >
        <div className="horizons-container">
          {/* <div className="horizons-progress-bar" ref={progressRef} />
          <div className="horizons-progress-counter">
            <span>JOURNEY</span>
            <h1 ref={counterRef}>0</h1>
            <span>%</span>
          </div> */}
          <div className="horizons-cursor" ref={cursorRef} />

          <div id="scroller" className="horizons-scroller" ref={scrollerRef}>
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

            <section className="horizon-slide hero-img">
              <div className="grid-bg" />
              <div className="pulse-ring" />
              <div className="hero-content">
                <div className="neon-text">INFINITY</div>
                <div className="dot-matrix" />
              </div>
              <div className="section-label">02</div>
            </section>

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
            </section>

            <section className="horizon-slide story">
              <div className="story-grid">
                <h1 data-speed="slow">Digital Alchemy</h1>
                <div className="story-divider" />
                <h1 data-speed="medium">Neoteric Identities</h1>
                <div className="story-divider" />
                <h1 data-speed="fast">Cinematic Realities</h1>
                <div className="story-divider" />
                <h1 data-speed="slowest">Symphonics</h1>
              </div>
              <div className="story-accent" />
            </section>

            <section className="horizon-slide concept-img">
              <div className="vortex-bg" />
              <div className="concept-content">
                <div className="ring-container">
                  <div className="ring" />
                  <div className="ring" />
                  <div className="ring" />
                </div>
                <div className="concept-quote">
                  <span className="quote-line">"Where imagination</span>
                  <span className="quote-line">meets innovation"</span>
                </div>
              </div>
              <div className="section-label">07</div>
            </section>

            <section className="horizon-slide outro">
              <div className="outro-content">
                <div className="outro-glow" />
                <h1>horizons.com</h1>
                <div className="outro-line" />
                <p>© 2024 — Beyond boundaries</p>
                <div className="social-links">
                  <span>⟡</span>
                  <span>⟡</span>
                  <span>⟡</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Horizons;
