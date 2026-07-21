"use client";

import React, { useRef, forwardRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import FaultyTerminal from "@/src/react-components/dither/Dither";
import styles from "./WorkSection.module.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface CardData {
  id: number;
  title: string;
  number: string;
  imageUrl: string;
  description: string;
}

const cardData: CardData[] = [
  {
    id: 1,
    title: "Project Alpha",
    number: "#001",
    imageUrl: "https://picsum.photos/seed/1/400/500",
    description:
      "A full-stack platform exploring real-time data visualization and motion.",
  },
  {
    id: 2,
    title: "Project Beta",
    number: "#002",
    imageUrl: "https://picsum.photos/seed/2/400/500",
    description:
      "An AI-driven analytics dashboard that transforms complex data into actionable insights.",
  },
  {
    id: 3,
    title: "Project Gamma",
    number: "#003",
    imageUrl: "https://picsum.photos/seed/3/400/500",
    description:
      "A mobile-first e-commerce solution with seamless payment integration and AR previews.",
  },
  {
    id: 4,
    title: "Project Delta",
    number: "#004",
    imageUrl: "https://picsum.photos/seed/4/400/500",
    description:
      "A decentralized finance application built on blockchain technology for secure transactions.",
  },
  {
    id: 5,
    title: "Project Epsilon",
    number: "#005",
    imageUrl: "https://picsum.photos/seed/5/400/500",
    description:
      "An interactive learning platform that gamifies education through immersive experiences.",
  },
  {
    id: 6,
    title: "Project Zeta",
    number: "#006",
    imageUrl: "https://picsum.photos/seed/6/400/500",
    description:
      "A smart city IoT solution optimizing traffic flow and reducing urban congestion.",
  },
  {
    id: 7,
    title: "Project Eta",
    number: "#007",
    imageUrl: "https://picsum.photos/seed/7/400/500",
    description:
      "A healthcare platform leveraging machine learning for early disease detection and monitoring.",
  },
  {
    id: 8,
    title: "Project Theta",
    number: "#008",
    imageUrl: "https://picsum.photos/seed/8/400/500",
    description:
      "A sustainable energy management system that optimizes consumption using predictive analytics.",
  },
];

const WorkSection = forwardRef<HTMLElement>((_props, forwardedRef) => {
  const workRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  // Wait for component to mount and layout to settle
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useGSAP(
    () => {
      const workSection = workRef.current;
      const cardsContainer = cardsRef.current;
      if (!workSection || !cardsContainer || !isReady) return;

      let animationFrame: number;

      // Use window.innerWidth * 5 for move distance (matches original behavior)
      const moveDistance = window.innerWidth * 5;

      // Create the scroll trigger with pinning
      const scrollTrigger = ScrollTrigger.create({
        trigger: workSection,
        start: "top top",
        end: "+=700%",
        pin: true,
        pinSpacing: true,
        scrub: 1,
      });

      // Lerp-based animation loop (matches original behavior)
      let currentXPosition = 0;

      const lerp = (start: number, end: number, t: number) =>
        start + (end - start) * t;

      const updateCardsPosition = () => {
        const targetX = -moveDistance * (scrollTrigger?.progress || 0);
        currentXPosition = lerp(currentXPosition, targetX, 0.07);
        gsap.set(cardsContainer, { x: currentXPosition });
        animationFrame = requestAnimationFrame(updateCardsPosition);
      };

      // Start the animation loop
      updateCardsPosition();

      // Cleanup
      return () => {
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
        }
        scrollTrigger?.kill();
      };
    },
    { scope: workRef, dependencies: [isReady] },
  );

  return (
    <section className={styles.work} ref={workRef}>
      {/* Background layer with FaultyTerminal */}
      <div className={styles.background}>
        <FaultyTerminal
          scale={1.5}
          gridMul={[2, 1]}
          digitSize={1.2}
          timeScale={0.5}
          pause={false}
          scanlineIntensity={0.5}
          glitchAmount={1}
          flickerAmount={1}
          noiseAmp={1}
          chromaticAberration={0}
          dither={0}
          curvature={0.1}
          tint="#A7EF9E"
          mouseReact
          mouseStrength={0.5}
          pageLoadAnimation
          brightness={0.6}
        />
      </div>

      {/* Cards layer - on top of background */}
      <div className={styles.cards} ref={cardsRef}>
        {cardData.map((card) => (
          <div key={card.id} className={styles.card}>
            <div className={styles["card-img"]}>
              <img src={card.imageUrl} alt={card.title} />
            </div>
            <div className={styles["card-reveal"]}>
              <span className={styles["reveal-scanline"]} />
              <p>{card.description}</p>
            </div>
            <div className={styles["card-copy"]}>
              <p>{card.title}</p>
              <p>{card.number}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
});

WorkSection.displayName = "WorkSection";
export default WorkSection;
