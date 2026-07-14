"use client";

import React, { useEffect, useRef, forwardRef } from "react";
import styles from "./WorkSection.module.css";
import WaveGridBackground from "./WaveGridBackground";

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

declare global {
  interface Window {
    Lenis: any;
    gsap: any;
    ScrollTrigger: any;
  }
}

const WorkSection = forwardRef<HTMLElement>((_props, forwardedRef) => {
  const workRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  const setWorkRef = (node: HTMLElement | null) => {
    (workRef as React.MutableRefObject<HTMLElement | null>).current = node;
    if (typeof forwardedRef === "function") {
      forwardedRef(node);
    } else if (forwardedRef) {
      (forwardedRef as React.MutableRefObject<HTMLElement | null>).current =
        node;
    }
  };

  useEffect(() => {
    const loadScripts = async () => {
      const scripts = [
        "https://unpkg.com/lenis@1.1.20/dist/lenis.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js",
      ];

      const loadScript = (src: string): Promise<void> => {
        return new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = src;
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () =>
            reject(new Error(`Failed to load script: ${src}`));
          document.body.appendChild(script);
        });
      };

      try {
        for (const src of scripts) {
          await loadScript(src);
        }
        initializeAnimations();
      } catch (error) {
        console.error("Error loading scripts:", error);
      }
    };

    const initializeAnimations = () => {
      const { gsap, ScrollTrigger, Lenis } = window;

      if (!gsap || !ScrollTrigger || !Lenis) {
        console.error("Required libraries not loaded");
        return;
      }

      gsap.registerPlugin(ScrollTrigger);

      const lenis = new Lenis();
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time: number) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);

      const workSection = workRef.current;
      const cardsContainer = cardsRef.current;

      if (!workSection || !cardsContainer) {
        console.error("Required DOM elements not found");
        return;
      }

      const moveDistance = window.innerWidth * 5;
      let currentXPosition = 0;

      const lerp = (start: number, end: number, t: number) =>
        start + (end - start) * t;

      let workTrigger: any;

      const updateCardsPosition = () => {
        const targetX = -moveDistance * (workTrigger?.progress || 0);
        currentXPosition = lerp(currentXPosition, targetX, 0.07);
        gsap.set(cardsContainer, { x: currentXPosition });
      };

      const animate = () => {
        updateCardsPosition();
        requestAnimationFrame(animate);
      };

      workTrigger = ScrollTrigger.create({
        trigger: workSection,
        start: "top top",
        end: "+=700%",
        pin: true,
        pinSpacing: true,
        scrub: 1,
      });

      animate();
    };

    loadScripts();
  }, []);

  return (
    <section className={styles.work} ref={setWorkRef}>
      <WaveGridBackground />
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
