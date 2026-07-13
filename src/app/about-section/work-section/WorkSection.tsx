"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import * as THREE from "three";
import styles from "../work-section/WorkSection.module.css";

// ============ DATA ============
const cardData = [
  {
    id: 1,
    title: "Project Alpha",
    number: "#001",
    imageUrl: "https://picsum.photos/seed/1/400/500",
  },
  {
    id: 2,
    title: "Project Beta",
    number: "#002",
    imageUrl: "https://picsum.photos/seed/2/400/500",
  },
  {
    id: 3,
    title: "Project Gamma",
    number: "#003",
    imageUrl: "https://picsum.photos/seed/3/400/500",
  },
  {
    id: 4,
    title: "Project Delta",
    number: "#004",
    imageUrl: "https://picsum.photos/seed/4/400/500",
  },
  {
    id: 5,
    title: "Project Epsilon",
    number: "#005",
    imageUrl: "https://picsum.photos/seed/5/400/500",
  },
  {
    id: 6,
    title: "Project Zeta",
    number: "#006",
    imageUrl: "https://picsum.photos/seed/6/400/500",
  },
  {
    id: 7,
    title: "Project Eta",
    number: "#007",
    imageUrl: "https://picsum.photos/seed/7/400/500",
  },
  {
    id: 8,
    title: "Project Theta",
    number: "#008",
    imageUrl: "https://picsum.photos/seed/8/400/500",
  },
];

// ============ ASCII HAND CONFIG ============
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

// ============ MAIN COMPONENT ============
interface CombinedSectionProps {
  leftHandSrc?: string;
  rightHandSrc?: string;
  title1?: string;
  title2?: string;
  className?: string;
}

export default function CombinedSection({
  leftHandSrc = "/models/left-hand.png",
  rightHandSrc = "/models/right-hand.png",
  title1 = "Ready to",
  title2 = "Start?",
  className = "",
}: CombinedSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const workRef = useRef<HTMLElement>(null);

  // CTA refs
  const leftHandRef = useRef<HTMLDivElement>(null);
  const rightHandRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const ctaContentRef = useRef<HTMLDivElement>(null);

  // Work section refs
  const cardsRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);

  // ASCII hands state
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

    const section = sectionRef.current;
    const workSection = workRef.current;
    const cardsContainer = cardsRef.current;
    const textContainer = textContainerRef.current;

    if (!section || !workSection || !cardsContainer || !textContainer) {
      console.error("Required DOM elements not found");
      return;
    }

    // ============================================================
    // 1. WORK SECTION - 3D LETTERS & GRID (FIRST)
    // ============================================================

    const moveDistance = window.innerWidth * 5;
    let currentXPosition = 0;

    const lerp = (start: number, end: number, t: number) =>
      start + (end - start) * t;

    // Grid canvas setup
    const gridCanvas = document.createElement("canvas");
    gridCanvas.id = "grid-canvas";
    gridCanvas.className = styles["grid-canvas"];
    workSection.appendChild(gridCanvas);
    const gridCtx = gridCanvas.getContext("2d")!;

    const resizeGridCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      gridCanvas.width = window.innerWidth * dpr;
      gridCanvas.height = window.innerHeight * dpr;
      gridCanvas.style.width = `${window.innerWidth}px`;
      gridCanvas.style.height = `${window.innerHeight}px`;
      gridCtx.setTransform(1, 0, 0, 1, 0, 0);
      gridCtx.scale(dpr, dpr);
    };
    resizeGridCanvas();

    const drawGrid = (scrollProgress = 0) => {
      gridCtx.fillStyle = "#000";
      gridCtx.fillRect(0, 0, gridCanvas.width, gridCanvas.height);
      gridCtx.fillStyle = "#f40c3f";
      const [dotSize, spacing] = [1, 30];
      const [rows, cols] = [
        Math.ceil(window.innerHeight / spacing),
        Math.ceil(window.innerWidth / spacing) + 15,
      ];

      const offset = (scrollProgress * spacing * 10) % spacing;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          gridCtx.beginPath();
          gridCtx.arc(
            x * spacing - offset,
            y * spacing,
            dotSize,
            0,
            Math.PI * 2,
          );
          gridCtx.fill();
        }
      }
    };

    // Three.js setup for letters
    const lettersScene = new THREE.Scene();
    const lettersCamera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    lettersCamera.position.z = 20;

    const lettersRenderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    lettersRenderer.setSize(window.innerWidth, window.innerHeight);
    lettersRenderer.setClearColor(0x000000, 0);
    lettersRenderer.setPixelRatio(window.devicePixelRatio);
    lettersRenderer.domElement.id = "letters-canvas";
    lettersRenderer.domElement.className = styles["letters-canvas"];
    workSection.appendChild(lettersRenderer.domElement);

    const createTextAnimationPath = (yPos: number, amplitude: number) => {
      const points = [];
      for (let i = 0; i < 20; i++) {
        const t = i / 20;
        points.push(
          new THREE.Vector3(
            -25 + 50 * t,
            yPos + Math.sin(t * Math.PI) * -amplitude,
            (1 - Math.pow(Math.abs(t - 0.5) * 2, 2)) * -5,
          ),
        );
      }
      const curve = new THREE.CatmullRomCurve3(points);
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(curve.getPoints(100)),
        new THREE.LineBasicMaterial({
          color: 0xffffff,
          linewidth: 1,
        }),
      );
      (line as any).curve = curve;
      return line;
    };

    const path = [
      createTextAnimationPath(10, 2),
      createTextAnimationPath(3.5, 1),
      createTextAnimationPath(-10, -2),
      createTextAnimationPath(-3.5, -1),
    ];
    path.forEach((line) => lettersScene.add(line));

    const letterPositions = new Map();
    const letters = ["W", "O", "R", "K"];
    path.forEach((line, i) => {
      (line as any).letterElements = Array.from({ length: 15 }, () => {
        const el = document.createElement("div");
        el.className = styles.letter;
        el.textContent = letters[i % letters.length];
        textContainer.appendChild(el);
        letterPositions.set(el, {
          current: { x: 0, y: 0 },
          target: { x: 0, y: 0 },
        });
        return el;
      });
    });

    const lineSpeedMultipliers = [0.8, 1, 0.7, 0.9];
    const updateTargetPositions = (scrollProgress = 0) => {
      path.forEach((line, lineIndex) => {
        const letterElements = (line as any).letterElements;
        letterElements.forEach((element: HTMLElement, i: number) => {
          const point = (line as any).curve.getPoint(
            (i / 14 + scrollProgress * lineSpeedMultipliers[lineIndex]) % 1,
          );

          const vector = point.clone().project(lettersCamera);
          const positions = letterPositions.get(element);
          positions.target = {
            x: (-vector.x * 0.5 + 0.5) * window.innerWidth,
            y: (-vector.y * 0.5 + 0.5) * window.innerHeight,
          };
        });
      });
    };

    const updateLetterPositions = () => {
      letterPositions.forEach((positions: any, element: HTMLElement) => {
        const distX = positions.target.x - positions.current.x;
        if (Math.abs(distX) > window.innerWidth * 0.7) {
          [positions.current.x, positions.current.y] = [
            positions.target.x,
            positions.target.y,
          ];
        } else {
          positions.current.x = lerp(
            positions.current.x,
            positions.target.x,
            0.07,
          );
          positions.current.y = lerp(
            positions.current.y,
            positions.target.y,
            0.07,
          );
        }
        element.style.transform = `translate(-50%, -50%) translate3d(${positions.current.x}px, ${positions.current.y}px, 0px)`;
      });
    };

    let workTrigger: any;

    const updateCardsPosition = () => {
      const targetX = -moveDistance * (workTrigger?.progress || 0);
      currentXPosition = lerp(currentXPosition, targetX, 0.07);
      gsap.set(cardsContainer, {
        x: currentXPosition,
      });
    };

    const animate = () => {
      updateLetterPositions();
      updateCardsPosition();
      lettersRenderer.render(lettersScene, lettersCamera);
      requestAnimationFrame(animate);
    };

    workTrigger = ScrollTrigger.create({
      trigger: workSection,
      start: "top top",
      end: "+=700%",
      pin: true,
      pinSpacing: true,
      scrub: 1,
      onUpdate: (self: any) => {
        updateTargetPositions(self.progress);
        drawGrid(self.progress);
      },
    });

    drawGrid(0);
    animate();
    updateTargetPositions(0);

    // ============================================================
    // 2. CTA - ASCII HANDS SETUP (SECOND)
    // ============================================================

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

    const headingChars = splitHeadingChars();

    // Image pixel sampling for ASCII hands
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

    // Highlight cluster for ASCII hands
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

    // Mouse move handler for ASCII hands
    const handleMouseMove = (event: MouseEvent) => {
      handsRef.current.forEach((hand) =>
        hoverHand(hand, event.clientX, event.clientY),
      );
    };

    window.addEventListener("mousemove", handleMouseMove);

    // CTA Parallax
    const pointer = { x: 0, y: 0 };
    const drift = { x: 0, y: 0 };
    const reveal = { left: -125, right: 125 };

    const setPointerTarget = (clientX: number, clientY: number) => {
      const cta = section;
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

    // CTA animations
    const charStagger = { each: 0.04, from: "center" as const };

    const animateCTAIn = () => {
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
    };

    const animateCTAOut = () => {
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
    };

    // ============================================================
    // 3. CTA SCROLL TRIGGERS (triggers when entering CTA section)
    // ============================================================

    ScrollTrigger.create({
      trigger: section,
      start: "top 80%",
      onEnter: animateCTAIn,
    });

    ScrollTrigger.create({
      trigger: section,
      start: "top 20%",
      onLeaveBack: animateCTAOut,
    });

    // ============================================================
    // 4. RESIZE HANDLER
    // ============================================================

    const handleResize = () => {
      resizeGridCanvas();
      drawGrid(workTrigger?.progress || 0);
      lettersCamera.aspect = window.innerWidth / window.innerHeight;
      lettersCamera.updateProjectionMatrix();
      lettersRenderer.setSize(window.innerWidth, window.innerHeight);
      lettersRenderer.setPixelRatio(window.devicePixelRatio);
      updateTargetPositions(workTrigger?.progress || 0);
    };

    window.addEventListener("resize", handleResize);

    // ============================================================
    // 5. CLEANUP
    // ============================================================

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousemove", handleMouseMoveParallax);
      window.removeEventListener("resize", handleResize);

      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      lenis.destroy();
      gsap.ticker.remove(() => {});

      // Clean up canvases
      if (workSection) {
        const canvases = workSection.querySelectorAll("canvas");
        canvases.forEach((canvas) => canvas.remove());
      }
    };
  }, [leftHandSrc, rightHandSrc, title1, title2]);

  // ============================================================
  // 6. RENDER - WORK SECTION FIRST, CTA SECOND
  // ============================================================

  return (
    <section ref={sectionRef} className={`${styles.combined} ${className}`}>
      {/* ===== WORK SECTION (FIRST) ===== */}
      <section className={styles.workSection} ref={workRef}>
        <div className={styles.textContainer} ref={textContainerRef}>
          <div className={styles.cards} ref={cardsRef}>
            {cardData.map((card) => (
              <div key={card.id} className={styles.card}>
                <div className={styles.cardImg}>
                  <img src={card.imageUrl} alt={card.title} />
                </div>
                <div className={styles.cardCopy}>
                  <p>{card.title}</p>
                  <p>{card.number}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION (SECOND) ===== */}
      <div className={styles.ctaSection}>
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

          <div ref={headerRef} className={styles.ctaHeader}>
            <h1>{title1}</h1>
            <h1>{title2}</h1>
          </div>
        </div>
      </div>
    </section>
  );
}
