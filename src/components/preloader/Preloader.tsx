"use client";

import { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import "./preloader.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PreloaderProps {
  onComplete?: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LOG_ENTRIES = [
  "// boot_seq: OK",
  "// auth_layer: loaded",
  "// assets: fetching",
  "// render_engine: ready",
] as const;

const STATUS_STAGES = [
  { at: 0, text: "> initializing...", color: "#333" },
  { at: 0.3, text: "> assets streaming...", color: "#444" },
  { at: 2.2, text: "> ENTRY PERMITTED", color: "#C8F135" },
] as const;

const COUNTER_DURATION = 2.8;
const GLITCH_INTERVAL_MS = 400;
const GLITCH_CHANCE = 0.07;
const GLITCH_DURATION_MS = 60;

const COLORS = {
  lime: "#C8F135",
  bg: "#080808",
  textPrimary: "#efefef",
  textMuted: "#333",
  gridLine: "#C8F135",
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pad3(n: number): string {
  return String(Math.round(n)).padStart(3, "0");
}

function glitchString(current: number): string {
  return pad3(current + Math.floor(Math.random() * 8 - 4)).replace(
    /\d/g,
    (d) => (Math.random() < 0.3 ? String(Math.floor(Math.random() * 10)) : d),
  );
}

// ─── Canvas hooks ─────────────────────────────────────────────────────────────

function useGridCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  containerRef: React.RefObject<HTMLDivElement | null>,
) {
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const w = container.clientWidth;
    const h = container.clientHeight;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = COLORS.gridLine;
    ctx.lineWidth = 0.5;

    const step = 48;
    for (let x = 0; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }, [canvasRef, containerRef]);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);
}

function useNoiseCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const frameRef = useRef<number>(0);

  const start = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const tick = () => {
      const { width: w, height: h } = canvas;
      const img = ctx.createImageData(w, h);
      const data = img.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() > 0.92 ? Math.random() * 200 + 55 : 0;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = v > 0 ? 255 : 0;
      }
      ctx.putImageData(img, 0, 0);
      frameRef.current = requestAnimationFrame(tick);
    };

    tick();
  }, [canvasRef]);

  const stop = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }
  }, []);

  return { start, stop };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Preloader({ onComplete }: PreloaderProps) {
  const preloaderRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const curtainRef = useRef<HTMLDivElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const noiseCanvasRef = useRef<HTMLCanvasElement>(null);

  // Brand
  const letterGRef = useRef<HTMLSpanElement>(null);
  const letterCRef = useRef<HTMLSpanElement>(null);
  const brandSepRef = useRef<HTMLDivElement>(null);
  const brandSubRef = useRef<HTMLSpanElement>(null);
  const sysBadgeRef = useRef<HTMLDivElement>(null);

  // Counter
  const counterRef = useRef<HTMLSpanElement>(null);
  const counterGhostRef = useRef<HTMLSpanElement>(null);
  const counterLabelRef = useRef<HTMLSpanElement>(null);
  const sideDataRef = useRef<HTMLDivElement>(null);

  // Progress + status
  const progressFillRef = useRef<HTMLDivElement>(null);
  const statusTextRef = useRef<HTMLSpanElement>(null);
  const statusWrapRef = useRef<HTMLDivElement>(null);
  const logRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Entry
  const entryBadgeRef = useRef<HTMLDivElement>(null);
  const entryDotRef = useRef<HTMLDivElement>(null);

  useGridCanvas(gridCanvasRef, containerRef);
  const { start: startNoise, stop: stopNoise } = useNoiseCanvas(noiseCanvasRef);

  useEffect(() => {
    // Size noise canvas to match container
    const container = containerRef.current;
    const noiseCanvas = noiseCanvasRef.current;
    if (container && noiseCanvas) {
      noiseCanvas.width = container.clientWidth;
      noiseCanvas.height = container.clientHeight;
    }

    startNoise();
    const tl = buildTimeline();
    return () => {
      tl.kill();
      stopNoise();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function buildTimeline() {
    const tl = gsap.timeline();

    // ── Initial states ──────────────────────────────────────────────────────
    gsap.set([letterGRef.current, letterCRef.current], { opacity: 0, y: 10 });
    gsap.set([brandSepRef.current, brandSubRef.current, sysBadgeRef.current], {
      opacity: 0,
    });
    gsap.set([counterRef.current, counterGhostRef.current], { opacity: 0 });
    gsap.set(counterLabelRef.current, { opacity: 0 });
    gsap.set(sideDataRef.current, { opacity: 0, x: 10 });
    gsap.set(statusWrapRef.current, { opacity: 0 });
    gsap.set(entryBadgeRef.current, { opacity: 0, y: 5 });
    gsap.set(entryDotRef.current, { opacity: 0 });

    if (progressFillRef.current) progressFillRef.current.style.width = "0%";
    if (counterRef.current) counterRef.current.textContent = "000";
    if (counterGhostRef.current) counterGhostRef.current.textContent = "000";
    if (statusTextRef.current) {
      statusTextRef.current.textContent = STATUS_STAGES[0].text;
      statusTextRef.current.style.color = STATUS_STAGES[0].color;
    }
    logRefs.current.forEach((el) => el?.classList.remove("visible", "active"));

    // ── Brand entrance ──────────────────────────────────────────────────────
    tl.to(letterGRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: "power3.out",
    })
      .to(
        letterCRef.current,
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" },
        "-=0.35",
      )
      .to(
        [brandSepRef.current, brandSubRef.current],
        { opacity: 1, duration: 0.4 },
        "-=0.2",
      )
      .to(sysBadgeRef.current, { opacity: 1, duration: 0.3 }, "-=0.2")

      // ── Counter ─────────────────────────────────────────────────────────────
      .to(counterRef.current, { opacity: 1, duration: 0.4 }, "+=0.1")
      .to(counterGhostRef.current, { opacity: 0.15, duration: 0.3 }, "<")
      .to(counterLabelRef.current, { opacity: 1, duration: 0.3 }, "<+0.1")

      .call(startCounterAnimation)

      // ── Status line + side data ─────────────────────────────────────────────
      .to(statusWrapRef.current, { opacity: 1, duration: 0.3 }, "<")
      .to(sideDataRef.current, { opacity: 1, x: 0, duration: 0.5 }, "<+0.3")

      // ── Terminal log entries ────────────────────────────────────────────────
      .call(() => activateLog(0), [], "+=0.3")
      .call(() => activateLog(1), [], "+=0.5")
      .call(() => activateLog(2), [], "+=0.5")
      .call(
        () => {
          activateLog(3);
          setStatus(STATUS_STAGES[1]);
        },
        [],
        "+=0.5",
      )

      // ── Entry permitted ─────────────────────────────────────────────────────
      .call(() => setStatus(STATUS_STAGES[2]), [], "+=0.6")
      .to(
        entryBadgeRef.current,
        { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
        "+=0.1",
      )
      .to(entryDotRef.current, { opacity: 1, duration: 0.2 }, "<")

      // ── Curtain wipe ────────────────────────────────────────────────────────
      .to(curtainRef.current, {
        y: "-100%",
        duration: 1.1,
        ease: "power4.inOut",
        delay: 0.6,
        onStart: () => {
          stopNoise();
          gsap.to(gridCanvasRef.current, { opacity: 0, duration: 0.4 });
        },
        onComplete: () => {
          if (preloaderRef.current) preloaderRef.current.style.display = "none";
          onComplete?.();
        },
      });

    return tl;
  }

  function startCounterAnimation() {
    const obj = { val: 0 };
    let lastGlitch = 0;

    gsap.to(obj, {
      val: 100,
      duration: COUNTER_DURATION,
      ease: "power1.inOut",
      onUpdate() {
        const v = Math.round(obj.val);
        const str = pad3(v);

        if (counterRef.current) counterRef.current.textContent = str;
        if (counterGhostRef.current) counterGhostRef.current.textContent = str;
        if (progressFillRef.current)
          progressFillRef.current.style.width = `${v}%`;

        // Occasional glitch
        const now = Date.now();
        if (
          now - lastGlitch > GLITCH_INTERVAL_MS &&
          Math.random() < GLITCH_CHANCE
        ) {
          lastGlitch = now;
          const scrambled = glitchString(v);
          if (counterRef.current) counterRef.current.textContent = scrambled;
          setTimeout(() => {
            if (counterRef.current) counterRef.current.textContent = str;
          }, GLITCH_DURATION_MS);
        }
      },
    });
  }

  function activateLog(index: number) {
    if (index > 0) {
      logRefs.current[index - 1]?.classList.remove("active");
    }
    logRefs.current[index]?.classList.add("visible", "active");
  }

  function setStatus(stage: (typeof STATUS_STAGES)[number]) {
    if (!statusTextRef.current) return;
    statusTextRef.current.textContent = stage.text;
    gsap.to(statusTextRef.current, { color: stage.color, duration: 0.2 });
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div ref={preloaderRef} className="preloader-root">
      {/* Canvas layers */}
      <canvas ref={gridCanvasRef} className="preloader-grid-canvas" />
      <canvas ref={noiseCanvasRef} className="preloader-noise-canvas" />

      {/* CRT effects */}
      <div className="preloader-scan-lines" />
      <div className="preloader-vignette" />

      {/* Curtain (slides up on exit) */}
      <div ref={curtainRef} className="preloader-curtain">
        <div ref={containerRef} className="preloader-curtain-inner">
          {/* Top row */}
          <div className="preloader-top-row">
            <div className="preloader-brand">
              <div className="preloader-brand-letters">
                <span ref={letterGRef} className="preloader-brand-letter">
                  G
                </span>
                <span ref={letterCRef} className="preloader-brand-letter">
                  C
                </span>
              </div>
              <div ref={brandSepRef} className="preloader-brand-sep" />
              <span ref={brandSubRef} className="preloader-brand-sub">
                System
              </span>
            </div>
            <div ref={sysBadgeRef} className="preloader-sys-badge">
              v2.4.1 — 2024
            </div>
          </div>

          {/* Counter */}
          <div className="preloader-center-block">
            <div className="preloader-counter-wrap">
              <span ref={counterGhostRef} className="preloader-counter-ghost">
                000
              </span>
              <span ref={counterRef} className="preloader-counter-main">
                000
              </span>
            </div>
            <span ref={counterLabelRef} className="preloader-counter-label">
              loading sequence
            </span>

            <div ref={sideDataRef} className="preloader-side-data">
              <span className="preloader-data-row">MEM ██████░░ 72%</span>
              <span className="preloader-data-row">CPU ████░░░░ 48%</span>
              <span className="preloader-data-row">NET ██████████ OK</span>
            </div>
          </div>

          {/* Bottom */}
          <div className="preloader-bottom-block">
            {/* Progress bar */}
            <div className="preloader-progress-track">
              <div ref={progressFillRef} className="preloader-progress-fill">
                <div className="preloader-progress-glow" />
              </div>
            </div>

            {/* Status row */}
            <div className="preloader-status-row">
              <div className="preloader-status-left">
                <div ref={statusWrapRef} className="preloader-status-wrap">
                  <span ref={statusTextRef} className="preloader-status-text">
                    &gt; initializing...
                  </span>
                </div>

                <div className="preloader-terminal-log">
                  {LOG_ENTRIES.map((entry, i) => (
                    <div
                      key={entry}
                      ref={(el) => {
                        logRefs.current[i] = el;
                      }}
                      className="preloader-log-entry"
                    >
                      {entry}
                    </div>
                  ))}
                </div>
              </div>

              <div className="preloader-right-block">
                <div ref={entryDotRef} className="preloader-entry-dot" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
