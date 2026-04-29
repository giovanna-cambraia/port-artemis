"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import "./AboutSection.css";
import Horizons from "./horizontal-scroll/Horizon";


/* ─── Types ─── */
interface MousePos {
  x: number;
  y: number;
}

/* ─── Constants for Hero Panel ─── */
const WORDS = ["CREATIVE", "IMMERSIVE", "KINETIC", "RADICAL", "FLUID"];
const SCRAMBLE_CHARS = "!<>-_\\/[]{}—=+*^?#░▒▓@$%&";

/* ─── Text Scramble Hook ─── */
function useScramble(target: string, trigger: boolean) {
  const [display, setDisplay] = useState(target);
  const raf = useRef<number>(0);

  useEffect(() => {
    if (!trigger) return;
    let iter = 0;
    const total = target.length * 3;
    cancelAnimationFrame(raf.current);

    const tick = () => {
      setDisplay(
        target
          .split("")
          .map((char, i) => {
            if (char === " ") return " ";
            if (i < iter / 3) return target[i];
            return SCRAMBLE_CHARS[
              Math.floor(Math.random() * SCRAMBLE_CHARS.length)
            ];
          })
          .join(""),
      );
      iter++;
      if (iter < total) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, trigger]);

  return display;
}

/* ─── Magnetic Hook for Buttons ─── */
function useMagnetic(strength = 0.35) {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * strength;
      const dy = (e.clientY - cy) * strength;
      el.style.transform = `translate(${dx}px, ${dy}px) scale(1.05)`;
    };
    const onLeave = () => {
      el.style.transform = "translate(0,0) scale(1)";
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [strength]);

  return ref;
}

/* ─── Custom Cursor Component ─── */
function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pos = useRef<MousePos>({ x: -100, y: -100 });
  const ring = useRef<MousePos>({ x: -100, y: -100 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove);

    let raf: number;
    const tick = () => {
      ring.current.x += (pos.current.x - ring.current.x) * 0.12;
      ring.current.y += (pos.current.y - ring.current.y) * 0.12;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ring.current.x}px, ${ring.current.y}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onEnter = (e: Event) => {
      const t = e.target as HTMLElement;
      if (t.closest("a, button, [data-hover]")) {
        dotRef.current?.classList.add("is-hover");
        ringRef.current?.classList.add("is-hover");
      }
    };
    const onLeave = () => {
      dotRef.current?.classList.remove("is-hover");
      ringRef.current?.classList.remove("is-hover");
    };
    document.addEventListener("mouseover", onEnter);
    document.addEventListener("mouseout", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onEnter);
      document.removeEventListener("mouseout", onLeave);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cur-dot" />
      <div ref={ringRef} className="cur-ring" />
    </>
  );
}

/* ─── Noise Canvas Component ─── */
function NoiseCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let raf: number;
    const W = 256,
      H = 256;
    canvas.width = W;
    canvas.height = H;
    const tick = () => {
      const img = ctx.createImageData(W, H);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() * 255;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 18;
      }
      ctx.putImageData(img, 0, 0);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="noise-canvas" />;
}

/* ─── Image Distortion Component ─── */
function DistortImage({ src }: { src?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: 0.5, y: 0.5, vx: 0, vy: 0 });
  const revealed = useRef(false);
  const progress = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    canvas.width = 420;
    canvas.height = 560;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onerror = () => {
      revealed.current = true;
    };
    img.onload = () => {
      revealed.current = true;
    };
    img.src = src || "";

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current.x = (e.clientX - rect.left) / rect.width;
      mouse.current.y = (e.clientY - rect.top) / rect.height;
    };
    canvas.addEventListener("mousemove", onMove);

    let raf: number;
    const tick = () => {
      ctx.clearRect(0, 0, 420, 560);

      if (revealed.current && progress.current < 1) {
        progress.current = Math.min(1, progress.current + 0.015);
      }

      mouse.current.vx += (mouse.current.x - 0.5) * 0.04;
      mouse.current.vy += (mouse.current.y - 0.5) * 0.04;
      mouse.current.vx *= 0.85;
      mouse.current.vy *= 0.85;

      const SLICES = 20;
      const sliceH = 560 / SLICES;

      for (let i = 0; i < SLICES; i++) {
        const t = i / SLICES;
        const delay = t * 0.4;
        const p = Math.max(0, Math.min(1, (progress.current - delay) / 0.6));
        const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

        const wave =
          Math.sin(t * Math.PI * 3 + Date.now() * 0.001) * (1 - ease) * 60;
        const distX = mouse.current.vx * Math.sin(t * Math.PI) * 30;

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, i * sliceH, 420, sliceH + 1);
        ctx.clip();

        if (img.complete && img.naturalWidth > 0) {
          ctx.globalAlpha = ease;
          ctx.drawImage(img, wave + distX, 0, 420, 560);
        } else {
          const hue = (i * 15 + Date.now() * 0.05) % 360;
          ctx.globalAlpha = ease * 0.7;
          ctx.fillStyle = `hsl(${hue}, 60%, ${10 + i * 2}%)`;
          ctx.fillRect(wave + distX, 0, 420, 560);
        }

        ctx.globalAlpha = 0.03;
        ctx.fillStyle = i % 2 === 0 ? "#000" : "#fff";
        ctx.fillRect(0, i * sliceH, 420, sliceH);

        ctx.restore();
      }

      const wipeY = 560 * (1 - Math.min(1, progress.current * 1.5));
      if (wipeY > 0) {
        ctx.fillStyle = "#ff0000";
        ctx.fillRect(0, wipeY, 420, 560 - wipeY);
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousemove", onMove);
    };
  }, [src]);

  return <canvas ref={canvasRef} className="distort-canvas" />;
}

/* ─── Word Cycler with Scramble ─── */
function WordCycler() {
  const [idx, setIdx] = useState(0);
  const [trigger, setTrigger] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % WORDS.length);
      setTrigger(false);
      requestAnimationFrame(() => setTrigger(true));
    }, 2800);
    return () => clearInterval(t);
  }, []);

  const scrambled = useScramble(WORDS[idx], trigger);

  return <span className="word-cycler">{scrambled}</span>;
}

/* ─── Counter Component ─── */
function Counter({ to, suffix = "+" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        obs.disconnect();
        const start = performance.now();
        const dur = 1800;
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / dur);
          const ease = 1 - Math.pow(1 - t, 4);
          setVal(Math.round(ease * to));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.3 },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);

  return (
    <span ref={ref}>
      {val}
      {suffix}
    </span>
  );
}

const AboutSection = () => {
  // Refs for all sections
  const heroRef = useRef<HTMLDivElement>(null);
  const manifestoRef = useRef<HTMLDivElement>(null);
  const galleryHeaderRef = useRef<HTMLDivElement>(null);
  const skillsHeaderRef = useRef<HTMLDivElement>(null);
  const skillsFooterRef = useRef<HTMLDivElement>(null);
  const ctaInnerRef = useRef<HTMLDivElement>(null);

  // Hero panel state
  const [heroVisible, setHeroVisible] = useState(false);
  const tiltRef = useRef<HTMLDivElement>(null);
  const btn1 = useMagnetic();
  const btn2 = useMagnetic();

  const [countedValues, setCountedValues] = useState({
    projects: 0,
    clients: 0,
    years: 0,
  });

  // Image URL
  const heroImage =
    "https://images.unsplash.com/photo-1549692520-acc6669e2f0c?w=800&h=1000&fit=crop";

  // Hero reveal on mount
  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Parallax tilt effect for hero image
  useEffect(() => {
    const el = tiltRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const rx = ((e.clientY - cy) / cy) * -8;
      const ry = ((e.clientX - cx) / cx) * 8;
      el.style.transform = `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    };
    const onLeave = () => {
      el.style.transform = "perspective(1200px) rotateX(0) rotateY(0)";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  // Number counter animation
  const startCounter = () => {
    const targets = [87, 124, 12];
    const durations = [2000, 2000, 1500];

    targets.forEach((target, index) => {
      let start = 0;
      const duration = durations[index];
      const increment = target / (duration / 16);

      const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
          start = target;
          clearInterval(timer);
        }

        setCountedValues((prev) => {
          if (index === 0) return { ...prev, projects: Math.floor(start) };
          if (index === 1) return { ...prev, clients: Math.floor(start) };
          return { ...prev, years: Math.floor(start) };
        });
      }, 16);
    });
  };

  // Intersection Observer for scroll animations
  useEffect(() => {
    // Hero observer
    const heroObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Already handled by mount animation
          }
        });
      },
      { threshold: 0.2 },
    );

    if (heroRef.current) heroObserver.observe(heroRef.current);

    // Manifesto observer
    const manifestoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            startCounter();
            const statItems = document.querySelectorAll(".manifesto-stat");
            statItems.forEach((item, idx) => {
              setTimeout(() => {
                item.classList.add("revealed");
              }, idx * 150);
            });
          }
        });
      },
      { threshold: 0.3 },
    );

    if (manifestoRef.current) manifestoObserver.observe(manifestoRef.current);

    // Gallery header observer
    const galleryObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (galleryHeaderRef.current)
              galleryHeaderRef.current.classList.add("revealed");
            const imageCards = document.querySelectorAll(".image-card");
            imageCards.forEach((card, idx) => {
              setTimeout(() => {
                card.classList.add("revealed");
              }, idx * 150);
            });
          }
        });
      },
      { threshold: 0.2 },
    );

    if (galleryHeaderRef.current)
      galleryObserver.observe(galleryHeaderRef.current);

    // Skills observer
    const skillsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (skillsHeaderRef.current)
              skillsHeaderRef.current.classList.add("revealed");
            if (skillsFooterRef.current)
              skillsFooterRef.current.classList.add("revealed");

            const skillCols = document.querySelectorAll(".skills-col");
            skillCols.forEach((col, idx) => {
              setTimeout(() => {
                col.classList.add("revealed");
              }, idx * 100);
            });

            const skillItems = document.querySelectorAll(".skill-item");
            skillItems.forEach((item, idx) => {
              setTimeout(() => {
                item.classList.add("revealed");
                const progressBar = item.querySelector(".skill-progress-bar");
                if (progressBar) {
                  const progress = progressBar.getAttribute("data-progress");
                  setTimeout(() => {
                    (progressBar as HTMLElement).style.width = progress || "0%";
                  }, 50);
                }
              }, idx * 80);
            });
          }
        });
      },
      { threshold: 0.2 },
    );

    if (skillsHeaderRef.current)
      skillsObserver.observe(skillsHeaderRef.current);
    if (skillsFooterRef.current)
      skillsObserver.observe(skillsFooterRef.current);

    // CTA observer with 3D tilt
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

    return () => {
      heroObserver.disconnect();
      manifestoObserver.disconnect();
      galleryObserver.disconnect();
      skillsObserver.disconnect();
      ctaObserver.disconnect();
    };
  }, []);

  return (
    <div className="about-section">
      {/* PANEL 1 — ENHANCED HERO */}
      <CustomCursor />
      <section className="about-panel about-panel--hero hero" ref={heroRef}>
        <NoiseCanvas />

        {/* Floating grid lines */}
        <div className="hero-grid" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="hero-grid-line"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>

        <div className={`hero-layout ${heroVisible ? "is-visible" : ""}`}>
          {/* Left Content */}
          <div className="hero-content">
            <div className="eyebrow">
              <span className="eyebrow-line" />
              <span className="eyebrow-text">
                <span className="eyebrow-accent">
                  <span className="special-letter">M</span>
                </span>
                OTION DESIGNER &amp; DEVELOPER
              </span>
            </div>

            <h1 className="headline">
              <span className="hl-row hl-row--1">
                <WordCycler />
              </span>
              <span className="hl-row hl-row--2">WITH EDGE</span>
              <span className="hl-row hl-row--3">&amp; PRECISION</span>
            </h1>

            <p className="hero-sub">
              Crafting immersive digital experiences that push boundaries and
              redefine possibilities. Where <em>motion meets meaning</em>, and
              code becomes art.
            </p>

            <div className="hero-stats">
              {[
                { val: 2, label: "Years exp." },
                { val: 30, label: "Projects" },
              ].map(({ val, label }) => (
                <div key={label} className="hero-stat">
                  <span className="hero-stat-val">
                    <Counter to={val} />
                  </span>
                  <span className="hero-stat-label">{label}</span>
                </div>
              ))}
            </div>

            <div className="hero-cta-row">
              <a
                ref={btn1}
                href="#work"
                className="mag-btn mag-btn--primary"
                data-hover
              >
                <span>View Work</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3 8h10M9 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
              <a ref={btn2} href="#contact" className="mag-btn" data-hover>
                Contact Me
              </a>
            </div>

            <div className="scroll-hint">
              <div className="scroll-hint-line" />
              <span>Scroll to explore</span>
            </div>
          </div>

        </div>
      </section>

      <div>
        <Horizons />
      </div>

      {/* PANEL 3 — JOURNEY / MILESTONES */}
      <div className="about-panel about-panel--journey">
        <div className="journey-header" ref={galleryHeaderRef}>
          <div className="journey-label">Personal Journey</div>
          <div className="journey-title">
            Career
            <br />
            Milestones
          </div>
        </div>

        <div className="journey-timeline">
          <div className="timeline-line"></div>

          <div className="milestone-card milestone-card--1">
            <div className="milestone-year">2024</div>
            <div className="milestone-content">
              <div className="milestone-title">Lead Innovation</div>
              <div className="milestone-desc">
                Spearheaded AI integration at global design firm,
                revolutionizing workflow efficiency by 150%
              </div>
              <div className="milestone-tag">Current Role</div>
            </div>
          </div>

          <div className="milestone-card milestone-card--2">
            <div className="milestone-year">2022</div>
            <div className="milestone-content">
              <div className="milestone-title">Award Recognition</div>
              <div className="milestone-desc">
                Received Awwwards Site of the Day for immersive brand experience
                platform
              </div>
              <div className="milestone-tag">Achievement</div>
            </div>
          </div>

          <div className="milestone-card milestone-card--3">
            <div className="milestone-year">2020</div>
            <div className="milestone-content">
              <div className="milestone-title">Master's Degree</div>
              <div className="milestone-desc">
                Completed MSc in Interactive Media with focus on emerging
                technologies
              </div>
              <div className="milestone-tag">Education</div>
            </div>
          </div>

          <div className="milestone-card milestone-card--4">
            <div className="milestone-year">2018</div>
            <div className="milestone-content">
              <div className="milestone-title">Studio Launch</div>
              <div className="milestone-desc">
                Founded creative studio working with Fortune 500 clients
                globally
              </div>
              <div className="milestone-tag">Entrepreneurship</div>
            </div>
          </div>
        </div>
      </div>

      {/* PANEL 4 — SKILLS */}
      <div className="about-panel about-panel--skills">
        <div className="skills-header" ref={skillsHeaderRef}>
          <div className="skills-label">Expertise</div>
          <div className="skills-title">
            Core
            <br />
            Competencies
          </div>
        </div>

        <div className="skills-columns">
          <div className="skills-col">
            <div className="skills-col-heading">Development</div>
            <div className="skill-item">
              <div className="skill-info">
                <div className="skill-name">
                  <span className="skill-dot"></span>
                  <span>React / Next.js</span>
                </div>
                <span className="skill-percent">95%</span>
              </div>
              <div className="skill-progress">
                <div className="skill-progress-bar" data-progress="95%"></div>
              </div>
            </div>
            <div className="skill-item">
              <div className="skill-info">
                <div className="skill-name">
                  <span className="skill-dot"></span>
                  <span>TypeScript</span>
                </div>
                <span className="skill-percent">90%</span>
              </div>
              <div className="skill-progress">
                <div className="skill-progress-bar" data-progress="90%"></div>
              </div>
            </div>
            <div className="skill-item">
              <div className="skill-info">
                <div className="skill-name">
                  <span className="skill-dot"></span>
                  <span>Node.js</span>
                </div>
                <span className="skill-percent">85%</span>
              </div>
              <div className="skill-progress">
                <div className="skill-progress-bar" data-progress="85%"></div>
              </div>
            </div>
            <div className="skill-item">
              <div className="skill-info">
                <div className="skill-name">
                  <span className="skill-dot"></span>
                  <span>Python</span>
                </div>
                <span className="skill-percent">80%</span>
              </div>
              <div className="skill-progress">
                <div className="skill-progress-bar" data-progress="80%"></div>
              </div>
            </div>
          </div>

          <div className="skills-col">
            <div className="skills-col-heading">Design</div>
            <div className="skill-item">
              <div className="skill-info">
                <div className="skill-name">
                  <span className="skill-dot"></span>
                  <span>Figma</span>
                </div>
                <span className="skill-percent">90%</span>
              </div>
              <div className="skill-progress">
                <div className="skill-progress-bar" data-progress="90%"></div>
              </div>
            </div>
            <div className="skill-item">
              <div className="skill-info">
                <div className="skill-name">
                  <span className="skill-dot"></span>
                  <span>Adobe Creative</span>
                </div>
                <span className="skill-percent">85%</span>
              </div>
              <div className="skill-progress">
                <div className="skill-progress-bar" data-progress="85%"></div>
              </div>
            </div>
            <div className="skill-item">
              <div className="skill-info">
                <div className="skill-name">
                  <span className="skill-dot"></span>
                  <span>Motion Design</span>
                </div>
                <span className="skill-percent">95%</span>
              </div>
              <div className="skill-progress">
                <div className="skill-progress-bar" data-progress="95%"></div>
              </div>
            </div>
            <div className="skill-item">
              <div className="skill-info">
                <div className="skill-name">
                  <span className="skill-dot"></span>
                  <span>UI/UX</span>
                </div>
                <span className="skill-percent">88%</span>
              </div>
              <div className="skill-progress">
                <div className="skill-progress-bar" data-progress="88%"></div>
              </div>
            </div>
          </div>

          <div className="skills-col">
            <div className="skills-col-heading">Tools</div>
            <div className="skill-item">
              <div className="skill-info">
                <div className="skill-name">
                  <span className="skill-dot"></span>
                  <span>Git / GitHub</span>
                </div>
                <span className="skill-percent">88%</span>
              </div>
              <div className="skill-progress">
                <div className="skill-progress-bar" data-progress="88%"></div>
              </div>
            </div>
            <div className="skill-item">
              <div className="skill-info">
                <div className="skill-name">
                  <span className="skill-dot"></span>
                  <span>VSCode</span>
                </div>
                <span className="skill-percent">85%</span>
              </div>
              <div className="skill-progress">
                <div className="skill-progress-bar" data-progress="85%"></div>
              </div>
            </div>
            <div className="skill-item">
              <div className="skill-info">
                <div className="skill-name">
                  <span className="skill-dot"></span>
                  <span>Webpack / Vite</span>
                </div>
                <span className="skill-percent">82%</span>
              </div>
              <div className="skill-progress">
                <div className="skill-progress-bar" data-progress="82%"></div>
              </div>
            </div>
            <div className="skill-item">
              <div className="skill-info">
                <div className="skill-name">
                  <span className="skill-dot"></span>
                  <span>Docker</span>
                </div>
                <span className="skill-percent">75%</span>
              </div>
              <div className="skill-progress">
                <div className="skill-progress-bar" data-progress="75%"></div>
              </div>
            </div>
          </div>
        </div>

      
      </div>

      {/* PANEL 5 — CTA */}
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
    </div>
  );
};

export default AboutSection;
