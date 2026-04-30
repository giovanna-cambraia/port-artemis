export interface TransmissionData {
  id: string;
  signal: string;
  coords: string;
  redactedCoords?: boolean;
  title: string;
  redactedTitle?: boolean;
  status: string;
  body: string;
}

export const TRANSMISSIONS: TransmissionData[] = [
  {
    id: "01",
    signal: "[SIGNAL_01] // ORIGIN",
    coords: "23.4°S 46.3°W — 2014",
    title: "THE FIRST TIME",
    status: "TRANSMITTING",
    body: `
      I was 16. A for loop printed my name 100 times and I felt
      something shift — not excitement, something older than that. Like
      recognizing a language I'd always known but never spoken.
      The terminal didn't care who I was. It only cared whether the logic was
      right. That felt like power.
    `,
  },
  {
    id: "02",
    signal: "[SIGNAL_02] // OBSESSION",
    coords: "██████████████",
    redactedCoords: true,
    title: "WHY CREATIVE DEV",
    status: "SIGNAL UNSTABLE",
    body: `
      Engineering without feeling is just maintenance. Art without structure
      is just noise.
      Creative development is the only field where I can be
      precise and irrational at the same time. Where a 2ms timing
      difference in an animation is a moral issue.
      The obsession isn't with the output. It's with the gap between what
      technology can do and what it feels like.
    `,
  },
  {
    id: "03",
    signal: "[SIGNAL_03] // PHILOSOPHY",
    coords: "23.4°S 46.3°W",
    title: "CRAFT OVER NOISE",
    status: "TRANSMITTING",
    body: `
      Noise isn't bad work. Noise is
      work that doesn't know what it's saying. Confident, polished,
      technically correct — and completely empty.
      The web is full of it. Scroll-triggered gradients announcing nothing.
      Hero sections demanding attention they haven't earned.
      Craft means every decision traces back to a feeling. If you can't answer
     why does this feel this way? You haven't finished yet.
    `,
  },
  {
    id: "04",
    signal: "[SIGNAL_04] // TOOLS",
    coords: "████████ — 02:14 local",
    redactedCoords: true,
    title: "THREE.JS AT 2AM",
    status: "DECODING",
    body: `
      Tools aren't neutral. Three.js makes you think in space. GSAP
      makes you think in time. The terminal makes you think in
      truth. The browser is the most underestimated canvas alive
      Every other medium has gatekeepers. The browser ships to everyone, runs
      everywhere, costs nothing to distribute. We are still learning what that
      means.
    `,
  },
  {
    id: "05",
    signal: "[SIGNAL_05] // THE WORK",
    coords: "██████████",
    redactedCoords: true,
    title: "FEELING FIRST",
    status: "TRANSMITTING",
    body: `
      I don't start with wireframes. I start with a sentence.
      
      "This should feel like walking into a room where something just
        happened."
      
      Then I reverse-engineer that into code. The layout serves the feeling.
      The timing serves the feeling. The color, the easing curve, the choice
      of font weight — all of it in service of that first sentence.
     
    `,
  },
  {
    id: "06",
    signal: "[SIGNAL_06] // FRAGMENT",
    coords: "[CORRUPTED]",
    title: "████████████",
    redactedTitle: true,
    status: "FILE CORRUPTED",
    body: `
   
        ████████████████████████████████████████████
    
      The part was written,
    
    █████████████████████████████████████████████████
     
    ████████████████████████ within perfection.
    `,
  },
  {
    id: "07",
    signal: "[SIGNAL_07] // NOW",
    coords: "23.4°S 46.3°W — ongoing",
    title: "STILL TRANSMITTING",
    status: "LIVE",
    body: `
      Chasing the experience that makes someone stop and say
      I didn't know the web could do that.
      Not for the technical achievement. For the fraction of a second before
      they understand what they're looking at — when it's still just feeling.
      signal ongoing. no end timestamp.
    `,
  },
];
