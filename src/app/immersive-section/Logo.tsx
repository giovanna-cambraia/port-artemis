"use client";

import { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import RevealImage from "../hero/footer/r3f-reveal/components/RevealImage";
import styles from "../immersive-section/about-header/AboutHeader.module.css";

export function LogoCard({ aboutReveal }: { aboutReveal: number }) {
  const revealProgress = useRef({
    value: 0,
    get: () => revealProgress.current.value,
    set: (val: number) => {
      revealProgress.current.value = val;
    },
  });

  // delay slightly so it condenses in after the card itself has faded up
  revealProgress.current.set(
    Math.max(0, Math.min(1, (aboutReveal - 0.2) / 0.6))
  );

  return (
    <div className={styles.center}>
      <Canvas
        camera={{ position: [0, 0, 3] }}
        style={{ width: "100%", height: "100%", background: "transparent" }}
      >
        <RevealImage
          imageTexture="/icon-img.png"
          revealProgress={revealProgress.current}
          isFullScreen={true}
        />
      </Canvas>
    </div>
  );
}