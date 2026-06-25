"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import styles from "./AboutHeader.module.css";

const STACK = [
  { label: "TYPESCRIPT", category: "LANGUAGE" },
  { label: "C", category: "LANGUAGE" },
  { label: "ADA", category: "LANGUAGE" },
  { label: "THREE.JS", category: "LIBRARY" },
  { label: "GSAP", category: "LIBRARY" },
  { label: "NESTJS", category: "FRAMEWORK" },
  { label: "REACT", category: "FRAMEWORK" },
  { label: "NEXT.JS", category: "FRAMEWORK" },
  { label: "ARM", category: "HARDWARE" },
];

const STATS = [
  { value: "2", label: "YRS EXP" },
  { value: "15+", label: "PROJECTS" },
  { value: "9", label: "TOOLS" },
];

export default function AboutHeader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  const [activeIdx, setActiveIdx] = useState(0);
  const [glitching, setGlitching] = useState(false);

  // ── CYCLE STACK ───────────────────────────────────────────────
  useEffect(() => {
    const cycle = () => {
      setGlitching(true);
      setTimeout(() => {
        setActiveIdx((i) => (i + 1) % STACK.length);
        setGlitching(false);
      }, 320);
    };
    const id = setInterval(cycle, 2200);
    return () => clearInterval(id);
  }, []);

  // ── TV STATIC CANVAS ──────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    let rafId: number;
    let frame = 0;

    // pre-generate a few noise buffers to alternate
    const buffers: ImageData[] = [];
    const BUFS = 6;
    for (let b = 0; b < BUFS; b++) {
      const img = ctx.createImageData(W, H);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        d[i] = v;
        d[i + 1] = v;
        d[i + 2] = v;
        d[i + 3] = Math.random() < 0.06 ? 180 : (Math.random() * 28) | 0;
      }
      buffers.push(img);
    }

    const draw = () => {
      rafId = requestAnimationFrame(draw);
      frame++;

      ctx.clearRect(0, 0, W, H);

      // base static — cycle buffers
      ctx.putImageData(buffers[frame % BUFS], 0, 0);

      // scanlines
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      for (let y = 0; y < H; y += 3) {
        ctx.fillRect(0, y, W, 1);
      }

      // occasional horizontal glitch tear
      if (frame % 40 < 3) {
        const tearY = Math.random() * H;
        const tearH = Math.random() * 6 + 2;
        const shift = (Math.random() - 0.5) * 30;
        ctx.save();
        ctx.drawImage(canvas, 0, tearY, W, tearH, shift, tearY, W, tearH);
        ctx.restore();
      }

      // vignette
      const vig = ctx.createRadialGradient(
        W / 2,
        H / 2,
        H * 0.2,
        W / 2,
        H / 2,
        H * 0.85,
      );
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, "rgba(0,0,0,0.88)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      // red chromatic fringe — very subtle
      if (frame % 7 === 0) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle = "rgba(224,48,48,0.018)";
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
    };

    draw();

    // ── GSAP INTRO ──────────────────────────────────────────────
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(canvas, { opacity: 0 }, { opacity: 1, duration: 0.8 }, 0)
      .fromTo(
        nameRef.current,
        { opacity: 0, x: -60, filter: "blur(16px)" },
        { opacity: 1, x: 0, filter: "blur(0px)", duration: 1.1 },
        0.6,
      )
      .fromTo(
        rightRef.current,
        { opacity: 0, x: 40 },
        { opacity: 1, x: 0, duration: 0.9 },
        0.9,
      )
      .fromTo(
        statsRef.current?.querySelectorAll(`.${styles.stat}`) ?? [],
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 },
        1.3,
      );

    const onResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      tl.kill();
    };
  }, []);

  const active = STACK[activeIdx];

  return (
    <section className={styles.hero}>
      <canvas ref={canvasRef} className={styles.canvas} />

      <div ref={overlayRef} className={styles.overlay}>
        {/* Top bar */}
        <div className={styles.topBar}>
          <span className={styles.topLeft}>
            <span className={styles.liveDot} />
            BROADCAST · LIVE
          </span>
          <span className={styles.topCenter}>V_1.0.0</span>
          <span className={styles.topRight}>
            SIGNAL_GC // {new Date().getFullYear()}
          </span>
        </div>

        {/* Main split */}
        <div className={styles.main}>
          {/* LEFT — name + stats */}
          <div className={styles.left}>
            <p className={styles.sub}>CREATIVE DEVELOPER · SYSTEMS ENGINEER</p>

            <h1 ref={nameRef} className={styles.name} style={{ opacity: 0 }}>
              <span className={styles.nameFirst}>GIOVANNA</span>
              <span className={styles.nameLast}>CAMBRAIA</span>
            </h1>

            <div ref={statsRef} className={styles.stats}>
              {STATS.map((s, i) => (
                <div key={i} className={styles.stat} style={{ opacity: 0 }}>
                  <span className={styles.statValue}>{s.value}</span>
                  <span className={styles.statLabel}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — skill display */}
          <div ref={rightRef} className={styles.right} style={{ opacity: 0 }}>
            <div className={styles.skillBox}>
              {/* corner brackets */}
              <span className={`${styles.corner} ${styles.cornerTL}`} />
              <span className={`${styles.corner} ${styles.cornerTR}`} />
              <span className={`${styles.corner} ${styles.cornerBL}`} />
              <span className={`${styles.corner} ${styles.cornerBR}`} />

              {/* top label */}
              <div className={styles.skillHeader}>
                <span className={styles.skillHeaderDash}>——</span>
                <span className={styles.skillHeaderLabel}>
                  SKILL_HUB // ACTIVE
                </span>
              </div>

              {/* category */}
              <div
                className={`${styles.skillCategory} ${glitching ? styles.glitch : ""}`}
              >
                {active.category}
              </div>

              {/* main skill name */}
              <div
                className={`${styles.skillName} ${glitching ? styles.glitch : ""}`}
              >
                {active.label}
              </div>

              {/* index */}
              <div className={styles.skillFooter}>
                <div className={styles.skillDots}>
                  {STACK.map((_, i) => (
                    <span
                      key={i}
                      className={`${styles.skillDot} ${i === activeIdx ? styles.skillDotActive : ""}`}
                    />
                  ))}
                </div>
                <span className={styles.skillIdx}>
                  0{activeIdx + 1} / 0{STACK.length}
                </span>
              </div>
            </div>

            {/* stack list below box */}
            <div className={styles.stackList}>
              {STACK.map((item, i) => (
                <span
                  key={i}
                  className={`${styles.stackItem} ${i === activeIdx ? styles.stackItemActive : ""}`}
                >
                  <span className={styles.stackIdx}>0{i + 1}</span>
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className={styles.bottom}>
          <div className={styles.ticker}>
            <div className={styles.tickerTrack}>
              {[...STACK, ...STACK, ...STACK].map((item, i) => (
                <span key={i} className={styles.tickerItem}>
                  {item.label} <span className={styles.tickerDot}>·</span>
                </span>
              ))}
            </div>
          </div>
          <div className={styles.scrollHint}>
            <span className={styles.scrollLine} />
            ENTER THE VOID
            <span className={styles.scrollLine} />
          </div>
        </div>
      </div>
    </section>
  );
}
