"use client";

import { Canvas } from "@react-three/fiber";
import Scene from "./Scene";
import { useEffect, useRef, useState } from "react";
import { TRANSMISSIONS } from "../../../data/transmissionData"; 
import { TransmissionCard } from "../cards/TransmissionCard";

const CARD_START = 0.70;
const CARD_END = 1.0;

export default function TransmissionWrapper() {
  const sectionRef = useRef<HTMLElement>(null) as React.RefObject<HTMLElement>;
  const progressRef = useRef(0);
  const [activeCard, setActiveCard] = useState(-1);
  const [cardsVisible, setCardsVisible] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const onScroll = () => {
      const rect = section.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, -rect.top / (section.offsetHeight - window.innerHeight)));
      progressRef.current = p;

      const shouldShow = p >= CARD_START && p <= CARD_END;
      setCardsVisible(shouldShow);

      if (shouldShow) {
        const cardP = (p - CARD_START) / (CARD_END - CARD_START);
        const idx = Math.min(TRANSMISSIONS.length - 1, Math.floor(cardP * TRANSMISSIONS.length));
        setActiveCard(idx);
      } else {
        setActiveCard(-1);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{ height: "600vh", position: "relative" }}
      className="transmission-section"
    >
      <div
        className="transmission-sticky"
        style={{ position: "sticky", top: 0, height: "100vh" }}
      >
        <Canvas
          shadows
          camera={{ fov: 45, position: [0, 6, 6], near: 0.1, far: 100 }}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        >
          <Scene sectionRef={sectionRef} progressRef={progressRef} />
        </Canvas>

        {/* Cards overlay — plain DOM, inside sticky, z-indexed above canvas */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 10,
            opacity: cardsVisible ? 1 : 0,
            transition: "opacity 0.5s ease",
          }}
        >
          <div style={{ position: "relative", width: "480px", height:"420px" }}>
            {TRANSMISSIONS.map((tx, i) => (
              <TransmissionCard
                key={tx.id}
                data={tx}
                active={activeCard === i}
                currentIdx={activeCard}
                total={TRANSMISSIONS.length}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}