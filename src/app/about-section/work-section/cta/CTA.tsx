"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import styles from "./CTA.module.css";

interface Cell {
  col: number;
  row: number;
  char: string;
  highlightEndTime: number;
}

interface Hand {
  canvas: HTMLCanvasElement;
  cells: Map<string, Cell>;
  cellList: Cell[];
  rows: number;
  cellSize: number;
}

interface CTAProps {
  leftHandSrc?: string;
  rightHandSrc?: string;
  title1?: string;
  title2?: string;
  links?: { text: string; href: string }[];
  description?: string;
  className?: string;
}

const ASCII_CHARS = "... ... .. :::=+xX#0396";
const CHAR_COLOR = "#803500";
const HOVER_COLOR = "#ff6a00";
const HOVER_CHAR_COLOR = "#0f0f0f";
const HOVER_RADIUS = 8;
const CLUSTER_SIZE = 10;
const HIGHLIGHT_LIFETIME = 300;
const ASCII_COLUMNS = 80;
const DPR = 2;
const PARALLAX_STRENGTH = 20;
const PARALLAX_EASE = 0.05;

export default function CTA({
  leftHandSrc = "/models/left-hand.png",
  rightHandSrc = "/models/right-hand.png",
  title1 = "Ready to",
  title2 = "Start?",

  className = "",
}: CTAProps) {
  const ctaRef = useRef<HTMLElement>(null);
  const leftHandRef = useRef<HTMLDivElement>(null);
  const rightHandRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const handsRef = useRef<Hand[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Register plugins
    gsap.registerPlugin(ScrollTrigger);

    // Initialize Lenis
    const lenis = new Lenis();
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time: number) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    // Split characters helper
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

    // Split heading characters
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

    // Split content lines
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

    const headingChars = splitHeadingChars();
    const contentLines = splitContentLines();

    // Image pixel sampling
    const sampleImagePixels = (
      image: HTMLImageElement,
      gridRows: number,
    ): Uint8ClampedArray | null => {
      const validRows = Math.max(1, Math.round(gridRows));

      try {
        const canvas = document.createElement("canvas");
        canvas.width = ASCII_COLUMNS;
        canvas.height = validRows;

        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        ctx.drawImage(image, 0, 0, ASCII_COLUMNS, validRows);
        const imageData = ctx.getImageData(0, 0, ASCII_COLUMNS, validRows);
        return imageData.data;
      } catch (error) {
        console.error("Error sampling image pixels:", error);
        return null;
      }
    };

    const pixelToCharIndex = (
      pixels: Uint8ClampedArray,
      pixelsOffset: number,
    ): number => {
      const alpha = pixels[pixelsOffset + 3];
      if (alpha < 128) return -1;

      const r = pixels[pixelsOffset];
      const g = pixels[pixelsOffset + 1];
      const b = pixels[pixelsOffset + 2];

      const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
      const backgroundCharIndex = ASCII_CHARS.lastIndexOf(".");

      return Math.min(
        ASCII_CHARS.length - 1,
        Math.floor((1 - brightness) * ASCII_CHARS.length),
      );
    };

    const buildCells = (
      image: HTMLImageElement,
    ): { rows: number; cells: Map<string, Cell> } | null => {
      if (!image.naturalWidth || !image.naturalHeight) {
        console.error("Invalid image dimensions");
        return null;
      }

      const aspectRatio = image.naturalWidth / image.naturalHeight;
      const rows = Math.max(1, Math.round(ASCII_COLUMNS / aspectRatio));

      const pixels = sampleImagePixels(image, rows);
      if (!pixels) return null;

      const cells = new Map<string, Cell>();
      const backgroundCharIndex = ASCII_CHARS.lastIndexOf(".");

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < ASCII_COLUMNS; col++) {
          const pixelsOffset = (row * ASCII_COLUMNS + col) * 4;
          if (pixelsOffset + 3 >= pixels.length) continue;

          const charIndex = pixelToCharIndex(pixels, pixelsOffset);
          if (charIndex < 0 || charIndex <= backgroundCharIndex) continue;

          cells.set(`${col},${row}`, {
            col,
            row,
            char: ASCII_CHARS[charIndex],
            highlightEndTime: 0,
          });
        }
      }

      return { rows, cells };
    };

    const setupHand = (
      image: HTMLImageElement,
      wrapper: HTMLDivElement,
    ): Hand | null => {
      const result = buildCells(image);
      if (!result) return null;

      const { rows, cells } = result;
      const cellList = [...cells.values()];

      const canvas = wrapper.querySelector("canvas");
      if (!canvas) return null;

      const displayWidth = wrapper.clientWidth || 200;
      const cellSize = displayWidth / ASCII_COLUMNS;
      const displayHeight = rows * cellSize;

      canvas.width = displayWidth * DPR;
      canvas.height = displayHeight * DPR;
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.font = `${Math.max(cellSize * 0.9, 8)}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";

      const metrics = ctx.measureText("X");
      const glyphHeight =
        (metrics.actualBoundingBoxAscent || 0) +
        (metrics.actualBoundingBoxDescent || 0);
      const baselineOffSet =
        cellSize / 2 + glyphHeight - (metrics.actualBoundingBoxDescent || 0);

      const render = () => {
        const now = Date.now();
        ctx.clearRect(0, 0, displayWidth, displayHeight);

        for (const cell of cellList) {
          const x = cell.col * cellSize;
          const y = cell.row * cellSize;
          const isHighlighted = cell.highlightEndTime > now;

          if (isHighlighted) {
            ctx.fillStyle = HOVER_COLOR;
            ctx.fillRect(x, y, cellSize, cellSize);
          }

          ctx.fillStyle = isHighlighted ? HOVER_CHAR_COLOR : CHAR_COLOR;
          ctx.fillText(cell.char, x + cellSize / 2, y + baselineOffSet);
        }
        animationFrameRef.current = requestAnimationFrame(render);
      };

      render();

      return { canvas, cells, cellList, rows, cellSize };
    };

    // Setup hands
    const setupHands = () => {
      const leftWrapper = leftHandRef.current;
      const rightWrapper = rightHandRef.current;
      if (!leftWrapper || !rightWrapper) return;

      const leftImg = leftWrapper.querySelector(
        ".ascii-hand",
      ) as HTMLImageElement;
      const rightImg = rightWrapper.querySelector(
        ".ascii-hand",
      ) as HTMLImageElement;

      if (leftImg && rightImg) {
        const leftHand = setupHand(leftImg, leftWrapper);
        const rightHand = setupHand(rightImg, rightWrapper);
        if (leftHand && rightHand) {
          handsRef.current = [leftHand, rightHand];
        }
      }
    };

    // Wait for images to load
    const setupImages = () => {
      const images = document.querySelectorAll(".ascii-hand");
      if (images.length === 0) return;

      let loadedCount = 0;

      images.forEach((img) => {
        const imageElement = img as HTMLImageElement;

        const handleLoad = () => {
          loadedCount++;
          if (loadedCount === images.length) {
            setupHands();
          }
        };

        if (imageElement.complete && imageElement.naturalWidth > 0) {
          handleLoad();
        } else {
          imageElement.addEventListener("load", handleLoad);
          imageElement.addEventListener("error", () => {
            console.error("Failed to load image:", imageElement.src);
            loadedCount++;
            if (loadedCount === images.length) {
              setupHands();
            }
          });
        }
      });
    };

    setupImages();

    // Highlight cluster
    const highlightCluster = (cells: Map<string, Cell>, startCell: Cell) => {
      const now = Date.now();
      startCell.highlightEndTime = now + HIGHLIGHT_LIFETIME;

      const steps = Math.floor(Math.random() * CLUSTER_SIZE) + 1;
      const litCells = [startCell];
      let current = startCell;

      for (let step = 0; step < steps; step++) {
        const neighbours: Cell[] = [];

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const neighbour = cells.get(
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

    const hoverHand = (hand: Hand, clientX: number, clientY: number) => {
      const rect = hand.canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const mouseCol = ((clientX - rect.left) / rect.width) * ASCII_COLUMNS;
      const mouseRow = ((clientY - rect.top) / rect.height) * hand.rows;

      let closest: Cell | null = null;
      let closestDist = Infinity;

      for (const cell of hand.cellList) {
        const dx = mouseCol - cell.col;
        const dy = mouseRow - cell.row;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < closestDist) {
          closestDist = dist;
          closest = cell;
        }
      }

      if (closest && closestDist <= HOVER_RADIUS) {
        highlightCluster(hand.cells, closest);
      }
    };

    // Mouse move handler
    const handleMouseMove = (event: MouseEvent) => {
      handsRef.current.forEach((hand) =>
        hoverHand(hand, event.clientX, event.clientY),
      );
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Parallax
    const pointer = { x: 0, y: 0 };
    const drift = { x: 0, y: 0 };
    const reveal = { left: -125, right: 125 };

    const setPointerTarget = (clientX: number, clientY: number) => {
      const cta = ctaRef.current;
      if (!cta) return;
      const rect = cta.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      pointer.x =
        ((clientX - rect.left) / rect.width - 0.5) * PARALLAX_STRENGTH * 2;
      pointer.y =
        ((clientY - rect.top) / rect.height - 0.5) * PARALLAX_STRENGTH * 2;
    };

    const renderParallax = () => {
      drift.x += (pointer.x - drift.x) * PARALLAX_EASE;
      drift.y += (pointer.y - drift.y) * PARALLAX_EASE;

      const wrappers = [leftHandRef.current, rightHandRef.current];
      wrappers.forEach((wrapper, i) => {
        if (!wrapper) return;
        const direction = i === 0 ? 1 : -1;
        const revealX = i === 0 ? reveal.left : reveal.right;
        const x = drift.x * direction;
        const y = -drift.y;
        const parallaxScale = 1 + (PARALLAX_STRENGTH * 2) / 200;
        wrapper.style.transform = `translate(calc(${x}px + ${revealX}%), ${y}px) scale(${parallaxScale})`;
      });
      requestAnimationFrame(renderParallax);
    };

    renderParallax();

    const handleMouseMoveParallax = (event: MouseEvent) => {
      setPointerTarget(event.clientX, event.clientY);
    };

    window.addEventListener("mousemove", handleMouseMoveParallax);

    const charStagger = { each: 0.04, from: "center" as const };

    const animateIn = () => {
      gsap.to(reveal, {
        left: 0,
        right: 0,
        duration: 1,
        ease: "power3.out",
        overwrite: true,
      });
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
        ease: "0.08",
        stagger: 0.08,
        overwrite: true,
      });
    };

    const animateOut = () => {
      gsap.to(reveal, {
        left: -125,
        right: 125,
        duration: 1,
        ease: "power3.in",
        overwrite: true,
      });
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
        ease: "0.08",
        stagger: 0.08,
        overwrite: true,
      });
    };

    // Trigger animations when CTA comes into view
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

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousemove", handleMouseMoveParallax);
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      lenis.destroy();
      gsap.ticker.remove(() => {});
    };
  }, []);

  return (
    <section ref={ctaRef} className={`${styles.cta} ${className}`}>
      <div className={styles.ctaContainer}>
        <div ref={leftHandRef} className={styles.ctaHandImg}>
          <img
            src={leftHandSrc}
            alt="left hand"
            className={`ascii-hand ${styles.asciiHand}`}
            crossOrigin="anonymous"
          />
          <canvas
            width="400"
            height="600"
            className={styles.handCanvas}
          ></canvas>
        </div>

        <div ref={rightHandRef} className={styles.ctaHandImg}>
          <img
            src={rightHandSrc}
            alt="right hand"
            className={`ascii-hand ${styles.asciiHand}`}
            crossOrigin="anonymous"
          />
          <canvas
            width="400"
            height="600"
            className={styles.handCanvas}
          ></canvas>
        </div>

        <div className={styles.ctaContent}>
          

         
        </div>

        <div ref={headerRef} className={styles.ctaHeader}>
          <h1>{title1}</h1>
          <h1>{title2}</h1>
        </div>
      </div>
    </section>
  );
}