"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./ArtemisSection.css";

gsap.registerPlugin(ScrollTrigger);

/* ─── Beats ─────────────────────────────────────────────────────────────── */
const BEATS = [
  {
    index: "01 — Signal",
    title: "Read the brief.",
    body: "Intent first, markup second.\nEvery pattern, every tell.",
  },
  {
    index: "02 — Systems",
    title: "Engineer the orbit.",
    body: "Components, data flow, motion\nlogic. Structure emerges.",
  },
  {
    index: "03 — Launch",
    title: "Ship it.",
    body: "Figma to production without\ndropping a pixel.",
  },
  {
    index: "04 — Transmission",
    title: "Then I disappear.",
    body: "The signal is sent. Stars drift\noutward. The work outlasts the maker.",
  },
];

/* ─── Orion star data (RA h, Dec °, apparent magnitude) ─────────────────── */
interface Star {
  id: string;
  name: string;
  ra: number;
  dec: number;
  mag: number;
  color: string;
  x: number;
  y: number;
  baseR: number;
}

const RAW_STARS = [
  {
    id: "betelgeuse",
    name: "Betelgeuse",
    ra: 5.919,
    dec: 7.407,
    mag: 0.5,
    color: "#ffcba8",
  },
  {
    id: "bellatrix",
    name: "Bellatrix",
    ra: 5.419,
    dec: 6.35,
    mag: 1.64,
    color: "#c8d8ff",
  },
  {
    id: "rigel",
    name: "Rigel",
    ra: 5.242,
    dec: -8.202,
    mag: 0.13,
    color: "#d0e4ff",
  },
  {
    id: "saiph",
    name: "Saiph",
    ra: 5.796,
    dec: -9.67,
    mag: 2.09,
    color: "#c0d0ff",
  },
  {
    id: "alnitak",
    name: "Alnitak",
    ra: 5.679,
    dec: -1.943,
    mag: 1.77,
    color: "#d0e8ff",
  },
  {
    id: "alnilam",
    name: "Alnilam",
    ra: 5.604,
    dec: -1.202,
    mag: 1.7,
    color: "#dceeff",
  },
  {
    id: "mintaka",
    name: "Mintaka",
    ra: 5.533,
    dec: -0.299,
    mag: 2.23,
    color: "#c8dcff",
  },
  {
    id: "meissa",
    name: "Meissa",
    ra: 5.585,
    dec: 9.934,
    mag: 3.33,
    color: "#c0d4ff",
  },
  {
    id: "hatysa",
    name: "Hatysa",
    ra: 5.59,
    dec: -5.909,
    mag: 2.77,
    color: "#c8dcff",
  },
];

/* ─── Constellation connection graph ─────────────────────────────────────── */
const EDGES: [string, string][] = [
  ["betelgeuse", "bellatrix"],
  ["betelgeuse", "alnitak"],
  ["betelgeuse", "meissa"],
  ["bellatrix", "mintaka"],
  ["bellatrix", "meissa"],
  ["alnitak", "alnilam"],
  ["alnilam", "mintaka"],
  ["alnitak", "saiph"],
  ["mintaka", "rigel"],
  ["hatysa", "alnilam"],
  ["rigel", "saiph"],
];

/* ─── Map RA/Dec → SVG coords ─────────────────────────────────────────────
   We place the belt centroid at (cx, cy) and scale so the full figure
   fits nicely in a 900×700 viewBox with room for labels.              */
function project(ra: number, dec: number): { x: number; y: number } {
  const cx = 480,
    cy = 350;
  const scaleX = 78,
    scaleY = 62;
  const raRef = 5.58,
    decRef = 0;
  return {
    x: cx + (raRef - ra) * scaleX * 3.2,
    y: cy - (dec - decRef) * scaleY,
  };
}

function buildStars(): Star[] {
  return RAW_STARS.map((s) => {
    const { x, y } = project(s.ra, s.dec);
    const baseR =
      s.mag < 0.3
        ? 5.5
        : s.mag < 0.7
          ? 5.0
          : s.mag < 1.5
            ? 4.0
            : s.mag < 2.0
              ? 3.2
              : s.mag < 2.5
                ? 2.6
                : 2.0;
    return { ...s, x, y, baseR };
  });
}

const STARS = buildStars();

/* ─── Which stars are visible at each beat ───────────────────────────────── */
const BEAT_VISIBLE: Record<number, Set<string>> = {
  0: new Set(["alnitak", "alnilam", "mintaka", "betelgeuse", "bellatrix"]),
  1: new Set([
    "alnitak",
    "alnilam",
    "mintaka",
    "betelgeuse",
    "bellatrix",
    "rigel",
    "saiph",
    "meissa",
  ]),
  2: new Set(STARS.map((s) => s.id)),
  3: new Set(STARS.map((s) => s.id)),
};

/* ─── Scatter offsets for beat 4 ────────────────────────────────────────── */
const SCATTER: Record<string, { dx: number; dy: number }> = {};
const rng = (n: number) => (Math.sin(n * 127.1 + 311.7) * 43758.5453) % 1;
STARS.forEach((s, i) => {
  SCATTER[s.id] = {
    dx: (rng(i) - 0.5) * 260,
    dy: (rng(i + 99) - 0.5) * 220,
  };
});

/* ─── SVG helpers ────────────────────────────────────────────────────────── */
const NS = "http://www.w3.org/2000/svg";
function el<T extends SVGElement>(
  tag: string,
  attrs: Record<string, string | number> = {},
): T {
  const e = document.createElementNS(NS, tag) as T;
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, String(v)));
  return e;
}

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function ArtemisSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const beatRef = useRef(0);

  /* DOM refs for mutable SVG elements */
  const starCircles = useRef<Record<string, SVGCircleElement>>({});
  const starGlows = useRef<Record<string, SVGCircleElement>>({});
  const starCores = useRef<Record<string, SVGCircleElement>>({});
  const starDiffuse = useRef<Record<string, SVGCircleElement>>({});
  const lineEls = useRef<Record<string, SVGLineElement>>({});
  const labelEls = useRef<Record<string, SVGTextElement>>({});

  /* Text refs */
  const indexRef = useRef<HTMLSpanElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    /* ── Build SVG layers ── */
    const layerLines = el<SVGGElement>("g");
    const layerDiffuse = el<SVGGElement>("g");
    const layerGlows = el<SVGGElement>("g");
    const layerStars = el<SVGGElement>("g");
    const layerLabels = el<SVGGElement>("g");
    const layerCores = el<SVGGElement>("g");
    svg.append(
      layerLines,
      layerDiffuse,
      layerGlows,
      layerStars,
      layerCores,
      layerLabels,
    );

    /* ── Background scatter dust ── */
    const DUST_COUNT = 120;
    for (let i = 0; i < DUST_COUNT; i++) {
      const x = rng(i * 3 + 1) * 900;
      const y = rng(i * 3 + 2) * 700;
      const r = rng(i * 3 + 3) < 0.15 ? 0.8 : 0.4;
      const opacity = 0.08 + rng(i * 3 + 5) * 0.18;
      const d = el<SVGCircleElement>("circle", {
        cx: x,
        cy: y,
        r,
        fill: "#e8eeff",
        opacity,
      });
      layerDiffuse.appendChild(d);
    }

    /* ── Connection lines ── */
    EDGES.forEach(([a, b]) => {
      const sa = STARS.find((s) => s.id === a)!;
      const sb = STARS.find((s) => s.id === b)!;
      const line = el<SVGLineElement>("line", {
        x1: sa.x,
        y1: sa.y,
        x2: sb.x,
        y2: sb.y,
        stroke: "rgba(200,160,240,0.18)",
        "stroke-width": "0.8",
        opacity: 0,
        "stroke-dasharray": "3 5",
      });
      layerLines.appendChild(line);
      lineEls.current[`${a}_${b}`] = line;
      lineEls.current[`${b}_${a}`] = line;
    });

    STARS.forEach((s) => {
      /* Wide diffuse halo */
      const diffuse = el<SVGCircleElement>("circle", {
        cx: s.x,
        cy: s.y,
        r: s.baseR * 9,
        fill: s.color,
        opacity: 0,
        filter: "url(#blur-heavy)",
      });
      layerDiffuse.appendChild(diffuse);
      starDiffuse.current[s.id] = diffuse;

      const glow = el<SVGCircleElement>("circle", {
        cx: s.x,
        cy: s.y,
        r: s.baseR * 4,
        fill: s.color,
        opacity: 0,
        filter: "url(#blur-mid)",
      });
      layerGlows.appendChild(glow);
      starGlows.current[s.id] = glow;

      const body = el<SVGCircleElement>("circle", {
        cx: s.x,
        cy: s.y,
        r: s.baseR,
        fill: s.color,
        opacity: 0,
      });
      layerStars.appendChild(body);
      starCircles.current[s.id] = body;

      const core = el<SVGCircleElement>("circle", {
        cx: s.x,
        cy: s.y,
        r: s.baseR * 0.35,
        fill: "#ffffff",
        opacity: 0,
      });
      layerCores.appendChild(core);
      starCores.current[s.id] = core;
      const NAMED = ["betelgeuse", "rigel", "bellatrix", "alnilam", "meissa"];
      if (NAMED.includes(s.id)) {
        const offX = ["betelgeuse", "bellatrix", "meissa"].includes(s.id)
          ? -14
          : 14;
        const anchor = offX < 0 ? "end" : "start";
        const txt = el<SVGTextElement>("text", {
          x: s.x + offX,
          y: s.y - 12,
          fill: "rgba(200,170,240,0.45)",
          "font-size": "9",
          "font-family": "ui-monospace,monospace",
          "letter-spacing": "0.18em",
          "text-anchor": anchor,
          opacity: 0,
        });
        txt.textContent = s.name.toUpperCase();
        layerLabels.appendChild(txt);
        labelEls.current[s.id] = txt;
      }
    });

    const totalBeats = BEATS.length;

    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: 1.2,
      onUpdate: (self) => {
        const raw = self.progress * (totalBeats - 1);
        const beat = Math.min(totalBeats - 1, Math.floor(raw));
        const frac = raw - beat;

        if (beat !== beatRef.current) {
          beatRef.current = beat;
          updateText(beat);
        }

        if (progressRef.current) {
          progressRef.current.style.transform = `scaleX(${self.progress})`;
        }

        updateConstellation(beat, frac);
      },
    });

    updateConstellation(0, 0);
    updateText(0);

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);

  function updateConstellation(beat: number, frac: number) {
    const nextBeat = Math.min(BEATS.length - 1, beat + 1);

    STARS.forEach((s) => {
      const vis0 = BEAT_VISIBLE[beat].has(s.id);
      const vis1 = BEAT_VISIBLE[nextBeat].has(s.id);

      const op0 = vis0 ? 1 : 0;
      const op1 = vis1 ? 1 : 0;
      const opacity = lerp(op0, op1, easeInOut(frac));

      let cx = s.x,
        cy = s.y;
      if (beat === 3 || (beat === 2 && frac > 0)) {
        const sf = beat === 3 ? 1 : frac;
        cx = lerp(s.x, s.x + SCATTER[s.id].dx, easeInOut(sf));
        cy = lerp(s.y, s.y + SCATTER[s.id].dy, easeInOut(sf));
      } else if (beat === 2) {
        cx = s.x;
        cy = s.y;
      }

      const glowPeak =
        beat === 2
          ? 1
          : beat === 1
            ? lerp(0.4, 1, frac)
            : beat === 3
              ? lerp(1, 0.1, frac)
              : 0.4;
      const diffusePeak =
        beat === 2
          ? 1
          : beat === 1
            ? lerp(0.25, 1, frac)
            : beat === 3
              ? lerp(1, 0, frac)
              : 0.25;
      const coreOpacity = beat === 2 ? opacity : opacity * 0.6;

      const r = s.baseR * (beat === 2 ? lerp(1, 1.2, frac) : 1);

      const setEl = (
        el: SVGCircleElement,
        attrs: Record<string, string | number>,
      ) => {
        Object.entries(attrs).forEach(([k, v]) =>
          el.setAttribute(k, String(v)),
        );
      };

      const body = starCircles.current[s.id];
      const glow = starGlows.current[s.id];
      const core = starCores.current[s.id];
      const diff = starDiffuse.current[s.id];

      if (!body) return;

      setEl(body, { cx, cy, r, opacity });
      setEl(glow, {
        cx,
        cy,
        r: s.baseR * 4.5,
        opacity: opacity * glowPeak * (s.mag < 1.5 ? 0.7 : 0.45),
      });
      setEl(core, { cx, cy, opacity: coreOpacity });
      setEl(diff, {
        cx,
        cy,
        r: s.baseR * 9,
        opacity: opacity * diffusePeak * (s.mag < 1.5 ? 0.22 : 0.12),
      });

      if (labelEls.current[s.id]) {
        const offX = ["betelgeuse", "bellatrix", "meissa"].includes(s.id)
          ? -14
          : 14;
        labelEls.current[s.id].setAttribute("x", String(cx + offX));
        labelEls.current[s.id].setAttribute("y", String(cy - 12));
        const lblOp = beat >= 1 ? opacity * 0.55 : opacity * 0.25;
        labelEls.current[s.id].setAttribute("opacity", String(lblOp));
      }
    });

    EDGES.forEach(([a, b]) => {
      const key = `${a}_${b}`;
      const line = lineEls.current[key];
      if (!line) return;
      const sa = STARS.find((s) => s.id === a)!;
      const sb = STARS.find((s) => s.id === b)!;

      const aVis = BEAT_VISIBLE[beat].has(a);
      const bVis = BEAT_VISIBLE[beat].has(b);
      const aVisN = BEAT_VISIBLE[nextBeat].has(a);
      const bVisN = BEAT_VISIBLE[nextBeat].has(b);

      const op0 =
        aVis && bVis ? (beat === 0 ? 0.3 : beat === 1 ? 0.45 : 0.7) : 0;
      const op1 =
        aVisN && bVisN
          ? nextBeat === 0
            ? 0.3
            : nextBeat === 1
              ? 0.45
              : 0.7
          : 0;
      const lineOp = lerp(
        op0,
        beat === 3 ? lerp(op0, 0, frac) : op1,
        easeInOut(frac),
      );

      const getCx = (star: Star) => {
        if (beat === 3)
          return lerp(star.x, star.x + SCATTER[star.id].dx, easeInOut(frac));
        return star.x;
      };
      const getCy = (star: Star) => {
        if (beat === 3)
          return lerp(star.y, star.y + SCATTER[star.id].dy, easeInOut(frac));
        return star.y;
      };

      line.setAttribute("x1", String(getCx(sa)));
      line.setAttribute("y1", String(getCy(sa)));
      line.setAttribute("x2", String(getCx(sb)));
      line.setAttribute("y2", String(getCy(sb)));
      line.setAttribute("opacity", String(lineOp));
    });
  }

  function updateText(beat: number) {
    const b = BEATS[beat];
    if (indexRef.current) indexRef.current.textContent = b.index;
    if (titleRef.current) titleRef.current.textContent = b.title;
    if (bodyRef.current) {
      bodyRef.current.innerHTML = b.body
        .split("\n")
        .map((l) => `<span>${l}</span>`)
        .join("<br>");
    }
    if (dotsRef.current) {
      dotsRef.current.querySelectorAll(".artemis-dot").forEach((d, i) => {
        d.classList.toggle("artemis-dot--active", i === beat);
      });
    }
  }

  return (
    <div ref={sectionRef} className="artemis-section">
      <div ref={stickyRef} className="artemis-sticky">
        <svg
          ref={svgRef}
          className="artemis-svg"
          viewBox="0 0 900 700"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <defs>
            <filter
              id="blur-heavy"
              x="-80%"
              y="-80%"
              width="260%"
              height="260%"
            >
              <feGaussianBlur stdDeviation="14" />
            </filter>
            <filter id="blur-mid" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
            <radialGradient id="artemis-bg" cx="53%" cy="50%" r="48%">
              <stop offset="0%" stopColor="#2a0a18" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#06020a" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="900" height="700" fill="transparent" />
          <ellipse
            cx="480"
            cy="350"
            rx="360"
            ry="300"
            fill="url(#artemis-bg)"
          />
        </svg>

        <div className="artemis-copy">
          <span ref={indexRef} className="artemis-beat-index" />
          <h2 ref={titleRef} className="artemis-beat-title" />
          <p ref={bodyRef} className="artemis-beat-body" />
        </div>

        <div ref={dotsRef} className="artemis-dots">
          {BEATS.map((_, i) => (
            <span
              key={i}
              className={`artemis-dot${i === 0 ? " artemis-dot--active" : ""}`}
            />
          ))}
        </div>

        <div className="artemis-progress">
          <div ref={progressRef} className="artemis-progress-fill" />
        </div>
      </div>
    </div>
  );
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}
