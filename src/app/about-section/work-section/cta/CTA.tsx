"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import styles from "./CTA.module.css";

// ============================================
// TYPES
// ============================================

interface Cell {
  col: number;
  row: number;
  highlightEndTime: number;
}

interface ContactLink {
  label: string;
  description: string;
  href: string;
  isEmail?: boolean;
}

interface CTAProps {
  links?: { text: string; href: string }[];
  description?: string;
  className?: string;
  calLink?: string;
}

// ============================================
// CONSTANTS
// ============================================

const ASCII_CHARS = " .:-=+*#%@";
const CHAR_COLOR = "#FF0000";
const HOVER_COLOR = "#7D0000";
const HOVER_CHAR_COLOR = "#0f0f0f";
const HOVER_RADIUS = 3;
const CLUSTER_SIZE = 10;
const HIGHLIGHT_LIFETIME = 300;
const CELL_SIZE = 14; // px per ascii cell
const DPR = Math.min(window.devicePixelRatio || 1, 2);

// wave field tuning
const WAVE_SPEED = 0.0006;
const WAVE_SCALE_X = 0.05;
const WAVE_SCALE_Y = 0.08;

const contactLinks: ContactLink[] = [
  {
    label: "EMAIL",
    description: "",
    href: "mailto:youremail@example.com",
    isEmail: true,
  },
  {
    label: "LINKEDIN",
    description: "Professional DMs welcome. Keep it career-related... or not.",
    href: "https://linkedin.com/in/yourprofile",
  },
  {
    label: "GITHUB",
    description:
      "Open source and personal projects. Maybe find this site's code.",
    href: "https://github.com/yourusername",
  },
];

// ============================================
// MAIN COMPONENT
// ============================================

export default function CTA({
  className = "",
  calLink = "giovanna-cambraia-cw0cjt",
}: CTAProps) {
  // Refs
  const ctaRef = useRef<HTMLElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const calRef = useRef<HTMLDivElement>(null);

  const [calLoaded, setCalLoaded] = useState(false);
  const [calError, setCalError] = useState(false);

  const animationFrameRef = useRef<number | null>(null);
  const cellsRef = useRef<Cell[]>([]);
  const gridRef = useRef<{ cols: number; rows: number }>({ cols: 0, rows: 0 });

  useEffect(() => {
    if (!calLink) return;
    setCalLoaded(false);
    setCalError(false);

    try {
      (function (C: any, A: string, L: string) {
        let p = function (a: any, ar: any) {
          a.q.push(ar);
        };
        let d = C.document;
        C.Cal =
          C.Cal ||
          function () {
            let cal = C.Cal;
            let ar = arguments;
            if (!cal.loaded) {
              cal.ns = {};
              cal.q = cal.q || [];
              d.head.appendChild(d.createElement("script")).src = A;
              cal.loaded = true;
            }
            if (ar[0] === L) {
              const api = function () {
                p(api, arguments);
              } as any;
              api.q = [] as any[];
              const namespace = ar[1];
              if (typeof namespace === "string") {
                cal.ns[namespace] = cal.ns[namespace] || api;
                p(cal.ns[namespace], ar);
                p(cal, ["initNamespace", namespace]);
              } else p(cal, ar);
              return;
            }
            p(cal, ar);
          };
      })(window, "https://app.cal.com/embed/embed.js", "init");

      (window as any).Cal("init", { origin: "https://cal.com" });
      (window as any).Cal("inline", {
        elementOrSelector: calRef.current,
        calLink: calLink,
        layout: "month_view",
        config: { theme: "dark" },
      });
      (window as any).Cal("ui", {
        theme: "dark",
        styles: { branding: { brandColor: "#c0263a" } },
        hideEventTypeDetails: false,
        layout: "month_view",
      });

      setCalLoaded(true);
    } catch (err) {
      console.error("Cal.com embed failed:", err);
      setCalError(true);
    }
  }, [calLink]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis();
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time: number) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    const splitCharsManual = (element: HTMLElement): HTMLElement[] => {
      const text = element.textContent || "";
      element.textContent = "";
      const chars: HTMLElement[] = [];
      [...text].forEach((char) => {
        const span = document.createElement("span");
        span.textContent = char === " " ? "\u00A0" : char;
        span.classList.add("char");
        span.style.display = "inline-block";
        span.style.position = "relative";
        element.appendChild(span);
        chars.push(span);
      });
      return chars;
    };

    const splitHeadingChars = (): HTMLElement[] => {
      const header = headerRef.current;
      if (!header) return [];
      const headings = header.querySelectorAll("h1");
      const chars: HTMLElement[] = [];
      headings.forEach((heading) => {
        chars.push(...splitCharsManual(heading as HTMLElement));
      });
      gsap.set(chars, { position: "relative", yPercent: 125 });
      return chars;
    };

    const splitContentLines = (): HTMLElement[] => {
      const links = linksRef.current;
      const text = textRef.current;
      if (!links || !text) return [];
      const elements = [
        ...links.querySelectorAll("a"),
        ...text.querySelectorAll("p"),
      ];
      const lines: HTMLElement[] = [];
      elements.forEach((el) => {
        const lineElements =
          el.textContent?.split(" ").map((word) => {
            const span = document.createElement("span");
            span.textContent = word + " ";
            span.style.display = "inline-block";
            return span;
          }) || [];
        lines.push(...(lineElements as HTMLElement[]));
      });
      gsap.set(lines, { yPercent: 100 });
      return lines;
    };

    const canvas = bgCanvasRef.current;
    const section = ctaRef.current;
    if (!canvas || !section) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = section.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      const cols = Math.ceil(width / CELL_SIZE);
      const rows = Math.ceil(height / CELL_SIZE);
      gridRef.current = { cols, rows };

      cellsRef.current = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          cellsRef.current.push({ col, row, highlightEndTime: 0 });
        }
      }

      canvas.width = width * DPR;
      canvas.height = height * DPR;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.font = `${Math.max(CELL_SIZE * 0.85, 8)}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
    };

    resize();
    window.addEventListener("resize", resize);

    const render = () => {
      const now = Date.now();
      const { cols, rows } = gridRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const cell of cellsRef.current) {
        const x = cell.col * CELL_SIZE;
        const y = cell.row * CELL_SIZE;

        const wave =
          Math.sin(cell.col * WAVE_SCALE_X + now * WAVE_SPEED) *
            Math.cos(cell.row * WAVE_SCALE_Y - now * WAVE_SPEED * 0.7) *
            0.5 +
          0.5; 

        const charIndex = Math.min(
          ASCII_CHARS.length - 1,
          Math.floor(wave * ASCII_CHARS.length),
        );
        const char = ASCII_CHARS[charIndex];
        if (char === " ") continue;

        const isHighlighted = cell.highlightEndTime > now;

        if (isHighlighted) {
          ctx.fillStyle = HOVER_COLOR;
          ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        }

        ctx.fillStyle = isHighlighted ? HOVER_CHAR_COLOR : CHAR_COLOR;
        ctx.fillText(char, x + CELL_SIZE / 2, y + CELL_SIZE / 2);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    const highlightCluster = (startCell: Cell) => {
      const now = Date.now();
      startCell.highlightEndTime = now + HIGHLIGHT_LIFETIME;

      const { cols, rows } = gridRef.current;
      const cellMap = new Map<string, Cell>();
      for (const c of cellsRef.current) cellMap.set(`${c.col},${c.row}`, c);

      const steps = Math.floor(Math.random() * CLUSTER_SIZE) + 1;
      const litCells = [startCell];
      let current = startCell;

      for (let step = 0; step < steps; step++) {
        const neighbours: Cell[] = [];
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const neighbour = cellMap.get(
              `${current.col + dx},${current.row + dy}`,
            );
            if (neighbour && !litCells.includes(neighbour))
              neighbours.push(neighbour);
          }
        }
        if (neighbours.length === 0) break;
        const next = neighbours[Math.floor(Math.random() * neighbours.length)];
        next.highlightEndTime = now + HIGHLIGHT_LIFETIME + step * 10;
        litCells.push(next);
        current = next;
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const col = Math.floor((event.clientX - rect.left) / CELL_SIZE);
      const row = Math.floor((event.clientY - rect.top) / CELL_SIZE);

      let closest: Cell | null = null;
      let closestDist = Infinity;

      for (const cell of cellsRef.current) {
        const dx = col - cell.col;
        const dy = row - cell.row;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < closestDist) {
          closestDist = dist;
          closest = cell;
        }
      }

      if (closest && closestDist <= HOVER_RADIUS) {
        highlightCluster(closest);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    const headingChars = splitHeadingChars();
    const contentLines = splitContentLines();

    const charStagger = { each: 0.04, from: "center" as const };

    const animateIn = () => {
      gsap.to(headingChars, {
        yPercent: 0,
        duration: 1,
        ease: "power3.out",
        stagger: charStagger,
        overwrite: true,
      });
      gsap.to(contentLines, {
        yPercent: 0,
        duration: 1,
        ease: "power3.out",
        stagger: 0.08,
        overwrite: true,
      });
    };

    const animateOut = () => {
      gsap.to(headingChars, {
        yPercent: 125,
        duration: 1,
        ease: "power3.in",
        stagger: charStagger,
        overwrite: true,
      });
      gsap.to(contentLines, {
        yPercent: 100,
        duration: 1,
        ease: "power3.in",
        stagger: 0.08,
        overwrite: true,
      });
    };

    ScrollTrigger.create({
      trigger: ctaRef.current,
      start: "top 80%",
      onEnter: animateIn,
    });

    ScrollTrigger.create({
      trigger: ctaRef.current,
      start: "top 20%",
      onLeaveBack: animateOut,
    });

    return () => {
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      lenis.destroy();
      gsap.ticker.remove(() => {});
    };
  }, []);

  return (
    <section ref={ctaRef} className={`${styles.cta} ${className}`}>
      <canvas ref={bgCanvasRef} className={styles.bgCanvas} />

      <div className={styles.ctaContent}>
        <div ref={headerRef} className={styles.ctaHeader}>
          <h1>Let's create</h1>
          <h1>something together</h1>
        </div>
        <div className={styles.ctaWidget}>
          <div className={styles.calCard}>
            <div ref={calRef} className={styles.calEmbed} />
            {!calLoaded && !calError && (
              <div className={styles.calLoading}>Loading calendar…</div>
            )}
            {calError && (
              <div className={styles.calLoading}>
                Calendar unavailable right now — try the contact links below.
              </div>
            )}
          </div>

          <div className={styles.contactSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.kanji}>連絡</span>
              <span className={styles.headerText}>
                or reach out the old-fashioned way
              </span>
            </div>

            <div className={styles.linksList}>
              {contactLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.isEmail ? undefined : "_blank"}
                  rel={link.isEmail ? undefined : "noopener noreferrer"}
                  className={styles.linkRow}
                >
                  <span className={styles.linkLabel} data-text={link.label}>
                    {link.label}
                  </span>
                  
                  {link.isEmail ? (
                    <span className={styles.emailText}>
                      {link.href.replace("mailto:", "")}
                    </span>
                  ) : (
                    <span className={styles.linkDescription}>
                      {link.description}
                    </span>
                  )}
                  
                  <span className={styles.arrow}>↗</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}