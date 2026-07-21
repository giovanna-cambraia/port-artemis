const GLYPH_RAMP = " .:-=+*#%@"; 
const CELL_SIZE = 6; 

interface AsciiCache {
  img: HTMLImageElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  sampleCanvas: HTMLCanvasElement;
  sampleCtx: CanvasRenderingContext2D;
}

const cache = new WeakMap<HTMLCanvasElement, AsciiCache>();

export function renderAsciiFromImage(
  canvasEl: HTMLCanvasElement | null,
  imageUrl: string,
  options?: { cellSize?: number; ramp?: string; color?: string }
) {
  if (!canvasEl) return;

  const cellSize = options?.cellSize ?? CELL_SIZE;
  const ramp = options?.ramp ?? GLYPH_RAMP;
  const color = options?.color ?? "#e8e8e8";

  let entry = cache.get(canvasEl);

  const draw = (img: HTMLImageElement) => {
    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;

    const rect = canvasEl.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvasEl.width = rect.width * dpr;
    canvasEl.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const cols = Math.floor(rect.width / cellSize);
    const rows = Math.floor(rect.height / cellSize);

    // offscreen sample canvas — downscale image to cols x rows to read brightness cheaply
    const sample =
      entry?.sampleCanvas ?? document.createElement("canvas");
    sample.width = cols;
    sample.height = rows;
    const sampleCtx = sample.getContext("2d", { willReadFrequently: true });
    if (!sampleCtx) return;

    // draw image cropped/cover-fit into the sample grid
    const imgRatio = img.width / img.height;
    const boxRatio = cols / rows;
    let sx = 0, sy = 0, sw = img.width, sh = img.height;
    if (imgRatio > boxRatio) {
      sw = img.height * boxRatio;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / boxRatio;
      sy = (img.height - sh) / 2;
    }
    sampleCtx.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows);

    const { data } = sampleCtx.getImageData(0, 0, cols, rows);

    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.font = `${cellSize}px monospace`;
    ctx.textBaseline = "top";
    ctx.fillStyle = color;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
        const brightness = a === 0 ? 0 : (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        const glyphIndex = Math.min(
          ramp.length - 1,
          Math.floor(brightness * (ramp.length - 1))
        );
        const glyph = ramp[glyphIndex];
        if (glyph !== " ") {
          ctx.fillText(glyph, x * cellSize, y * cellSize);
        }
      }
    }

    cache.set(canvasEl, {
      img,
      canvas: canvasEl,
      ctx,
      sampleCanvas: sample,
      sampleCtx,
    });
  };

  if (entry?.img && entry.img.src.endsWith(imageUrl)) {
    draw(entry.img);
    return;
  }

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = imageUrl;
  img.onload = () => draw(img);
}