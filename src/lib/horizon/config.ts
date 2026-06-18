export const HORIZON_CONFIG = {
  scroll: {
    scrub: 1,
    endMultiplier: 1.1,
    anticipatePin: 1,
  },

  lerp: {
    cursor: 0.18,
    parallax: 0.085,
  },
  velocity: {
    skewFactor: 0.0009,
    maxSkew: 7,
  },
  depth: {
    background: -0.12,
    midground: 0.06,
    foreground: 0.22,
  },
} as const;

export const SECTIONS = [
  { id: "01", tag: "ARRIVAL", title: "ENTER THE SYSTEM" },
  { id: "02", tag: "DIMENSION", title: "BREAKING THE GRID" },
  { id: "03", tag: "MANIFESTO", title: "THE IDEA" },
  { id: "04", tag: "ARCHITECTURE", title: "BUILDING THE FUTURE" },
  { id: "05", tag: "REVELATION", title: "THE FUTURE IS NOW" },
] as const;
