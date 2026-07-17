"use client";

import React, { useEffect, useRef } from "react";
import styles from "./AsciiTiles.module.css";

export interface AsciiTilesProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  children?: React.ReactNode;

  speed?: number; // 0-3
  glyphSize?: number; // 4-24 px (bigger = fewer cells = cheaper)
  tileDensity?: number; // 1-12
  tileShear?: number; // -0.5 - 0.5
  bevelWidth?: number; // 0-0.5
  bevelSoftness?: number; // 0.01-0.4
  refractionStrength?: number; // 0-120
  chromaticSpread?: number; // 0-1 (0 = cheap single-pass, >0 = 3x draw cost)
  specularExponent?: number; // 1-256
  specularStrength?: number; // 0-3
  patternFreqX?: number;
  patternFreqY?: number;
  patternFreqXY?: number;
  opacity?: number;

  glyphColor?: string;
  recessColor?: string;
  backgroundColor?: string;

  fps?: number; // frame cap, default 20
  maxDpr?: number; // default 1 - this is a texture, not text you read
}

const GLYPHS = ".:-=+*#%@01|/\\";
const LEVELS = 12; // brightness buckets for cached sprites

export default function AsciiTiles({
  width = "100%",
  height = "100%",
  className = "",
  children,

  speed = 0.75,
  glyphSize = 12,
  tileDensity = 4,
  tileShear = 0,
  bevelWidth = 0.02,
  bevelSoftness = 0.1,
  refractionStrength = 100,
  chromaticSpread = 0,
  specularExponent = 150,
  specularStrength = 1,
  patternFreqX = 5.6,
  patternFreqY = 4,
  patternFreqXY = 10,
  opacity = 1,

  glyphColor = "#FFFFFF",
  recessColor = "#050D08",
  backgroundColor = "#000000",

  fps = 30,
  maxDpr = 1,
}: AsciiTilesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | undefined>(undefined);
  const visibleRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    let cw = 0;
    let ch = 0;

    const hexToRgb = (hex: string) => {
      const h = hex.replace("#", "");
      const v =
        h.length === 3
          ? h
              .split("")
              .map((c) => c + c)
              .join("")
          : h;
      const num = parseInt(v, 16);
      return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
    };
    const glyphRgb = hexToRgb(glyphColor);
    const recessRgb = hexToRgb(recessColor);

    // ---- Sprite cache: pre-render each glyph at each brightness level once.
    // Chromatic mode adds an extra fringed sprite per level.
    let sprites: HTMLCanvasElement[][] = [];
    let spritesChroma: HTMLCanvasElement[][] = [];

    const buildSprites = () => {
      sprites = [];
      spritesChroma = [];
      const pad = 2;
      const spriteSize = glyphSize + pad * 2;
      for (let gi = 0; gi < GLYPHS.length; gi++) {
        const levelRow: HTMLCanvasElement[] = [];
        const chromaRow: HTMLCanvasElement[] = [];
        for (let lvl = 0; lvl < LEVELS; lvl++) {
          const tt = lvl / (LEVELS - 1);
          const r = Math.round(glyphRgb.r * tt + recessRgb.r * (1 - tt));
          const g = Math.round(glyphRgb.g * tt + recessRgb.g * (1 - tt));
          const b = Math.round(glyphRgb.b * tt + recessRgb.b * (1 - tt));

          const sc = document.createElement("canvas");
          sc.width = spriteSize;
          sc.height = spriteSize;
          const sctx = sc.getContext("2d")!;
          sctx.font = `${glyphSize}px monospace`;
          sctx.textBaseline = "top";
          sctx.globalAlpha = 0.35 + tt * 0.65;
          sctx.fillStyle = `rgb(${r},${g},${b})`;
          sctx.fillText(GLYPHS[gi], pad, pad);
          levelRow.push(sc);

          if (chromaticSpread > 0) {
            const cc = document.createElement("canvas");
            cc.width = spriteSize;
            cc.height = spriteSize;
            const cctx = cc.getContext("2d")!;
            cctx.font = `${glyphSize}px monospace`;
            cctx.textBaseline = "top";
            const off = refractionStrength * 0.02 * chromaticSpread;
            cctx.globalAlpha = 0.4;
            cctx.fillStyle = `rgb(${Math.min(255, r + 40)},${Math.max(
              0,
              g - 20,
            )},${Math.max(0, b - 20)})`;
            cctx.fillText(GLYPHS[gi], pad - off, pad);
            cctx.fillStyle = `rgb(${Math.max(0, r - 20)},${Math.max(
              0,
              g - 20,
            )},${Math.min(255, b + 40)})`;
            cctx.fillText(GLYPHS[gi], pad + off, pad);
            cctx.globalAlpha = 0.5 + tt * 0.5;
            cctx.fillStyle = `rgb(${r},${g},${b})`;
            cctx.fillText(GLYPHS[gi], pad, pad);
            chromaRow.push(cc);
          }
        }
        sprites.push(levelRow);
        if (chromaticSpread > 0) spritesChroma.push(chromaRow);
      }
    };
    buildSprites();

    // ---- Geometry cache. tileSize, cellCols/cellRows, and each glyph's
    // distEdge/bevel value only change when the container resizes (they do
    // NOT depend on time or scroll), so they're computed once here instead
    // of every frame inside the draw loop.
    let tileSize = 0;
    let cellCols = 0;
    let cellRows = 0;
    let bevelCache: Float32Array = new Float32Array(0);

    const buildGeometry = () => {
      const long = Math.max(cw, ch);
      tileSize = long / Math.max(1, tileDensity);
      cellCols = Math.max(1, Math.floor(tileSize / glyphSize));
      cellRows = Math.max(1, Math.floor(tileSize / glyphSize));

      bevelCache = new Float32Array(cellCols * cellRows);
      for (let gy = 0; gy < cellRows; gy++) {
        const localY = gy * glyphSize;
        for (let gx = 0; gx < cellCols; gx++) {
          const localX = gx * glyphSize;
          const distEdge =
            Math.min(localX, tileSize - localX, localY, tileSize - localY) /
            tileSize;
          const bevel = Math.min(
            1,
            Math.max(
              0,
              1 - (distEdge - bevelWidth) / Math.max(0.001, bevelSoftness),
            ),
          );
          bevelCache[gy * cellCols + gx] = bevel;
        }
      }
    };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      cw = Math.max(1, Math.floor(rect.width));
      ch = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(cw * dpr);
      canvas.height = Math.floor(ch * dpr);
      canvas.style.width = cw + "px";
      canvas.style.height = ch + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildGeometry();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    // Pause when scrolled off-screen or tab hidden.
    const io = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
      },
      { threshold: 0 },
    );
    io.observe(container);
    const onVis = () => {
      visibleRef.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVis);

    const frameInterval = 1000 / Math.max(1, fps);
    let lastDraw = 0;
    const pad = 2;

    const draw = (t: number) => {
      rafRef.current = requestAnimationFrame(draw);
      if (!visibleRef.current) return;
      if (t - lastDraw < frameInterval) return;
      lastDraw = t;

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, cw, ch);

      const long = Math.max(cw, ch);
      const time = t * 0.001 * speed;

      const cols = Math.ceil(cw / tileSize) + 2;
      const rows = Math.ceil(ch / tileSize) + 2;

      for (let ty = -1; ty < rows; ty++) {
        const originY = ty * tileSize;
        for (let tx = -1; tx < cols; tx++) {
          const originX = tx * tileSize + ty * tileSize * tileShear;

          for (let gy = 0; gy < cellRows; gy++) {
            const py = originY + gy * glyphSize;
            if (py < -glyphSize || py > ch + glyphSize) continue;
            const bevelRowOffset = gy * cellCols;
            for (let gx = 0; gx < cellCols; gx++) {
              const px = originX + gx * glyphSize;
              if (px < -glyphSize || px > cw + glyphSize) continue;

              const nx = px / long;
              const ny = py / long;

              let field =
                Math.sin(nx * patternFreqX * Math.PI * 2 + time) * 0.5 +
                Math.cos(ny * patternFreqY * Math.PI * 2 - time * 0.8) * 0.5 +
                Math.sin((nx + ny) * patternFreqXY * Math.PI + time * 0.5) *
                  0.5;
              field = field / 1.5;

              const bevel = bevelCache[bevelRowOffset + gx];

              const intensity = Math.max(
                0,
                Math.min(1, field * 0.5 + 0.5 + bevel * 0.3),
              );
              if (intensity < 0.12) continue;

              const glyphIdx = Math.floor(intensity * (GLYPHS.length - 1));
              const lvl = Math.min(
                LEVELS - 1,
                Math.round(intensity * (LEVELS - 1)),
              );

              const useChroma = chromaticSpread > 0 && bevel > 0.05;
              const sprite = useChroma
                ? spritesChroma[glyphIdx][lvl]
                : sprites[glyphIdx][lvl];

              ctx.drawImage(sprite, px - pad, py - pad);
            }
          }
        }
      }
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [
    speed,
    glyphSize,
    tileDensity,
    tileShear,
    bevelWidth,
    bevelSoftness,
    refractionStrength,
    chromaticSpread,
    specularExponent,
    specularStrength,
    patternFreqX,
    patternFreqY,
    patternFreqXY,
    opacity,
    glyphColor,
    recessColor,
    backgroundColor,
    fps,
    maxDpr,
  ]);

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${className}`}
      style={{ width, height }}
    >
      <canvas ref={canvasRef} className={styles.canvas} />
      {children ? <div className={styles.content}>{children}</div> : null}
    </div>
  );
}
