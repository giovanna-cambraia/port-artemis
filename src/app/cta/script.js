import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

// Manual character splitting helper
const splitCharsManual = (element) => {
  const text = element.textContent;
  element.textContent = "";
  const chars = [];

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

const splitHeadingChars = () => {
  const headings = document.querySelectorAll(".footer-header h1");
  const chars = [];

  headings.forEach((heading) => {
    chars.push(...splitCharsManual(heading));
  });

  gsap.set(chars, { position: "relative", yPercent: 125 });
  return chars;
};

const splitContentLines = () => {
  // Splitting is available as a global from the regular script tag
  const results = window.Splitting({
    target: ".footer-links a, .footer-text p",
    by: "lines",
  });
  const lines = results.flatMap((r) => r.lines).flat();
  gsap.set(lines, { yPercent: 100 });
  return lines;
};

const headingChars = splitHeadingChars();
const contentLines = splitContentLines();

const ASCII_CHARS = "... ... .. :::=+xX#0396";
const FONT_SIZE = 18;
const CELL_SIZE = 20;
const ASCII_COLUMNS = 80;
const DPR = 2;

const CHAR_COLOR = "#803500";
const HOVER_COLOR = "#ff6a00";
const HOVER_CHAR_COLOR = "#0f0f0f";

const HOVER_RADIUS = 8;
const CLUSTER_SIZE = 10;
const HIGHLIGHT_LIFETIME = 300;

const backgroundCharIndex = ASCII_CHARS.lastIndexOf(".");

const sampleImagePixels = (image, gridRows) => {
  const canvas = document.createElement("canvas");
  canvas.width = ASCII_COLUMNS;
  canvas.height = gridRows;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, ASCII_COLUMNS, gridRows);
  return ctx.getImageData(0, 0, ASCII_COLUMNS, gridRows).data;
};

const pixelToCharIndex = (pixels, pixelsOffset) => {
  const alpha = pixels[pixelsOffset + 3];
  if (alpha < 128) return -1;

  const r = pixels[pixelsOffset];
  const g = pixels[pixelsOffset + 1];
  const b = pixels[pixelsOffset + 2];

  const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;

  return Math.min(
    ASCII_CHARS.length - 1,
    Math.floor((1 - brightness) * ASCII_CHARS.length),
  );
};
const buildCells = (image) => {
  const rows = Math.round(
    ASCII_COLUMNS / (image.naturalWidth / image.naturalHeight),
  );
  const pixels = sampleImagePixels(image, rows);
  const cells = new Map();

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < ASCII_COLUMNS; col++) {
      const pixelsOffset = (row * ASCII_COLUMNS + col) * 4;
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

const setupHand = (image) => {
  const { rows, cells } = buildCells(image);
  const cellList = [...cells.values()];

  const canvas = image.closest(".footer-hand-img").querySelector("canvas");
  const wrapper = image.closest(".footer-hand-img");

  // Measure the actual on-screen size instead of assuming a fixed px width
  const displayWidth = wrapper.clientWidth;
  const cellSize = displayWidth / ASCII_COLUMNS; // dynamic, replaces fixed CELL_SIZE
  const displayHeight = rows * cellSize;

  canvas.width = displayWidth * DPR;
  canvas.height = displayHeight * DPR;
  canvas.style.width = `${displayWidth}px`;
  canvas.style.height = `${displayHeight}px`;

  const ctx = canvas.getContext("2d");
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.font = `${cellSize * 0.9}px monospace`; // scale font with cell size
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  const metrics = ctx.measureText("X");
  const glyphHeight =
    metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
  const baselineOffSet =
    cellSize / 2 + glyphHeight - metrics.actualBoundingBoxDescent;

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
    requestAnimationFrame(render);
  };

  render();

  return { canvas, cells, cellList, rows, cellSize };
};

const hands = [];
document.querySelectorAll("img.ascii-hand").forEach((image) => {
  const start = () => hands.push(setupHand(image));

  if (image.complete && image.naturalWidth) {
    start();
  } else {
    image.addEventListener("load", start);
    image.addEventListener("error", () =>
      console.error("Failed to load hand image:", image.src),
    );
  }
});

setTimeout(() => console.log("hands array:", hands), 1000);

const highlightCluster = (cells, startCell) => {
  const now = Date.now();
  startCell.highlightEndTime = now + HIGHLIGHT_LIFETIME;

  const steps = Math.floor(Math.random() * CLUSTER_SIZE) + 1;
  const litCells = [startCell];
  let current = startCell;

  for (let step = 0; step < steps; step++) {
    const neighbours = [];

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const neighbour = cells.get(`${current.col + dx},${current.row + dy}`);
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

const hoverHand = (hand, clientX, clientY) => {
  const rect = hand.canvas.getBoundingClientRect();
  const mouseCol = ((clientX - rect.left) / rect.width) * ASCII_COLUMNS;
  const mouseRow = ((clientY - rect.top) / rect.height) * hand.rows;

  let closest = null;
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

window.addEventListener("mousemove", (event) => {
  hands.forEach((hand) => hoverHand(hand, event.clientX, event.clientY));
});

const PARALLAX_STRENGTH = 20;
const PARALLAX_EASE = 0.05;

const footer = document.querySelector("footer");
const handWrappers = [...document.querySelectorAll(".footer-hand-img")];

const parallaxScale = 1 + (PARALLAX_STRENGTH * 2) / 200;
const pointer = { x: 0, y: 0 };
const drift = { x: 0, y: 0 };

const reveal = { left: -125, right: 125 };

const setPointerTarget = (clientX, clientY) => {
  const rect = footer.getBoundingClientRect();
  pointer.x =
    ((clientX - rect.left) / rect.width - 0.5) * PARALLAX_STRENGTH * 2;
  pointer.y =
    ((clientY - rect.top) / rect.height - 0.5) * PARALLAX_STRENGTH * 2;
};

const renderParallax = () => {
  drift.x += (pointer.x - drift.x) * PARALLAX_EASE;
  drift.y += (pointer.y - drift.y) * PARALLAX_EASE;

  handWrappers.forEach((wrapper, i) => {
    const direction = i === 0 ? 1 : -1;
    const revealX = i === 0 ? reveal.left : reveal.right;
    const x = drift.x * direction;
    const y = -drift.y;
    wrapper.style.transform = `translate(calc(${x}px + ${revealX}%), ${y}px) scale(${parallaxScale})`;
  });
  requestAnimationFrame(renderParallax);
};

renderParallax();

window.addEventListener("mousemove", (event) => {
  setPointerTarget(event.clientX, event.clientY);
});

const charStagger = { each: 0.04, from: "center" };

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

ScrollTrigger.create({
  trigger: ".footer-revealer",
  start: "top 50%",
  onEnter: animateIn,
});

ScrollTrigger.create({
  trigger: ".footer-revealer",
  start: "top 85%",
  onLeaveBack: animateOut,
});
