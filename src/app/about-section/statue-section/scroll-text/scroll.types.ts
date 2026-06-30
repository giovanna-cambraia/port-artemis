export interface TextElement extends HTMLElement {
  dataset: DOMStringMap & {
    text?: string;
    altPos?: string;
    flipEase?: string;
    scrambleDuration?: string;
  };
}

export interface FlipConfig {
  ease?: string;
  start?: string;
  end?: string;
  scrub?: boolean | number;
}

export interface ScrambleConfig {
  duration?: number;
  revealDelay?: number;
  chars?: string;
}
