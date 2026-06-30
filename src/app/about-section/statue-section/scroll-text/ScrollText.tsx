import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { Flip } from "gsap/Flip";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";

import { Frame } from "./frame/Frame"; 
import { TextGroup } from "./text-group/TextGroup"; 
import { Grid } from "./grid/Grid"; 
import { Related } from "./related/Related"; 
import styles from "./ScrollDemoPage.module.css";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, Flip, ScrambleTextPlugin);

const textItems = [
  {
    text: "creative",
    position: "pos-2",
    altPosition: "pos-3",
    isLarge: true,
    flipEase: "expo.inOut",
    scrambleDuration: 1.2,
  },
  {
    text: "coding",
    position: "pos-3",
    altPosition: "pos-10",
    flipEase: "power3.inOut",
    scrambleDuration: 1.5,
  },
  {
    text: "with",
    position: "pos-4",
    altPosition: "pos-2",
    flipEase: "sine.inOut",
    scrambleDuration: 0.8,
  },
  {
    text: "gsap",
    position: "pos-1",
    altPosition: "pos-5",
    isLarge: true,
    flipEase: "expo.inOut",
    scrambleDuration: 1.3,
  },
  {
    text: "scroll",
    position: "pos-6",
    altPosition: "pos-7",
    flipEase: "power2.inOut",
    scrambleDuration: 1.0,
  },
  {
    text: "driven",
    position: "pos-8",
    altPosition: "pos-9",
    flipEase: "back.inOut",
    scrambleDuration: 1.1,
  },
  {
    text: "animation",
    position: "pos-9",
    altPosition: "pos-6",
    flipEase: "expo.inOut",
    scrambleDuration: 1.4,
  },
];

const gridItems = [
  {
    id: 1,
    title: "Scroll Trigger Demo",
    imageUrl: "https://picsum.photos/400/300?random=1",
    link: "#scroll-trigger",
  },
  {
    id: 2,
    title: "Flip Animation",
    imageUrl: "https://picsum.photos/400/300?random=2",
    link: "#flip",
  },
  {
    id: 3,
    title: "Scramble Text",
    imageUrl: "https://picsum.photos/400/300?random=3",
    link: "#scramble",
  },
  {
    id: 4,
    title: "Scroll Smoother",
    imageUrl: "https://picsum.photos/400/300?random=4",
    link: "#smooth",
  },
];

const frameTags = ["Animation", "GSAP", "Scroll", "FLIP"];

export const ScrollDemoPage: React.FC = () => {
  const contentRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLSpanElement>(null);
  const relatedRef = useRef<HTMLDivElement>(null);

  const textElementsRef = useRef<NodeListOf<Element> | null>(null);
  const gridItemsRef = useRef<NodeListOf<Element> | null>(null);

  const storeOriginalText = () => {
    if (!textElementsRef.current) return;
    textElementsRef.current.forEach((el) => {
      const element = el as HTMLElement & { dataset: { text?: string } };
      if (!element.dataset.text) {
        element.dataset.text = element.textContent || "";
      }
    });
    if (logoRef.current) {
      logoRef.current.dataset.text = logoRef.current.textContent || "";
    }
  };

  const resetTextElements = () => {
    if (!textElementsRef.current) return;
    textElementsRef.current.forEach((el) => {
      gsap.set(el, {
        clearProps: "transform,opacity,filter",
      });
    });
  };

  const initFlips = () => {
    if (!textElementsRef.current) return;
    resetTextElements();

    textElementsRef.current.forEach((el) => {
      const element = el as HTMLElement & {
        dataset: { altPos?: string; flipEase?: string };
      };

      const originalClass = [...element.classList].find((c) =>
        c.startsWith("pos-"),
      );
      const targetClass = element.dataset.altPos;
      const flipEase = element.dataset.flipEase || "expo.inOut";

      if (!originalClass || !targetClass) return;

      element.classList.add(targetClass);
      element.classList.remove(originalClass);

      const flipState = Flip.getState(el, {
        props: "opacity, filter, width",
      });

      element.classList.add(originalClass);
      element.classList.remove(targetClass);

      Flip.to(flipState, {
        ease: flipEase,
        scrollTrigger: {
          trigger: el,
          start: "clamp(bottom bottom-=10%)",
          end: "clamp(center center)",
          scrub: true,
        },
      });

      Flip.from(flipState, {
        ease: flipEase,
        scrollTrigger: {
          trigger: el,
          start: "clamp(center center)",
          end: "clamp(top top)",
          scrub: true,
        },
      });
    });
  };

  const scramble = (
    el: Element,
    config: { duration?: number; revealDelay?: number } = {},
  ) => {
    const element = el as HTMLElement & {
      dataset: { text?: string; scrambleDuration?: string };
    };

    const text = element.dataset.text ?? element.textContent ?? "";
    const duration =
      config.duration ??
      (element.dataset.scrambleDuration
        ? parseFloat(element.dataset.scrambleDuration)
        : 1);
    const revealDelay = config.revealDelay ?? 0;

    gsap.killTweensOf(el);

    gsap.fromTo(
      el,
      { scrambleText: { text: "", chars: "" } },
      {
        scrambleText: {
          text,
          chars: "upperAndLowerCase",
          revealDelay,
        },
        duration,
      },
    );
  };

  const killScrambleTriggers = () => {
    ScrollTrigger.getAll().forEach((st) => {
      if (st.vars.id === "scramble") {
        st.kill();
      }
    });
  };

  const initScramble = () => {
    if (!textElementsRef.current) return;
    killScrambleTriggers();

    textElementsRef.current.forEach((el) => {
      ScrollTrigger.create({
        id: "scramble",
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        onEnter: () => scramble(el),
        onEnterBack: () => scramble(el),
      });
    });

    if (logoRef.current) {
      scramble(logoRef.current, { revealDelay: 0.5 });
    }
  };

  const initRelatedDemos = () => {
    if (!gridItemsRef.current || !relatedRef.current) return;

    gsap.set(gridItemsRef.current, {
      xPercent: 100,
      scale: 0,
      opacity: 0,
    });

    ScrollTrigger.create({
      trigger: relatedRef.current,
      start: "top center+=25%",
      onEnter: () => {
        if (!logoRef.current || !gridItemsRef.current) return;

        gsap.to(logoRef.current, {
          duration: 0.7,
          ease: "expo",
          opacity: 0,
        });

        gsap.fromTo(
          gridItemsRef.current,
          {
            xPercent: 100,
            scale: 0,
            opacity: 0,
          },
          {
            duration: 0.7,
            ease: "expo",
            stagger: 0.1,
            xPercent: 0,
            scale: 1,
            opacity: 1,
          },
        );
      },
      onLeaveBack: () => {
        if (!logoRef.current || !gridItemsRef.current) return;

        gsap.to(logoRef.current, {
          duration: 0.5,
          ease: "power3.in",
          opacity: 1,
        });

        gsap.to(gridItemsRef.current, {
          duration: 0.5,
          ease: "power3.in",
          scale: 0,
          opacity: 0,
          xPercent: 100,
          stagger: 0.05,
        });
      },
    });
  };

  const getDomReferences = () => {
    if (contentRef.current) {
      textElementsRef.current = contentRef.current.querySelectorAll(".el");
      const relatedEl = contentRef.current.querySelector(".related");
      if (relatedEl) {
        relatedRef.current = relatedEl as HTMLDivElement;
        gridItemsRef.current = relatedEl.querySelectorAll(".grid__item");
      }
    }
  };
  const initAnimations = () => {
    ScrollSmoother.create({
      smooth: 1,
      normalizeScroll: true,
    });

    getDomReferences();

    storeOriginalText();
    initFlips();
    initScramble();
    initRelatedDemos();
  };

  const handleResize = () => {
    ScrollTrigger.refresh(true);
    getDomReferences();
    initFlips();
    initScramble();
  };

  const cleanup = () => {
    ScrollTrigger.getAll().forEach((st) => st.kill());
    gsap.killTweensOf("*");
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      initAnimations();
    }, 100);

    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
      cleanup();
    };
  }, []);

  return (
    <div className={styles.page}>
      <Frame
        title="GSAP FLIP"
        archiveLink="#archive"
        githubLink="#github"
        tags={frameTags}
        sponsor={<div id="cdawrap">Sponsor Content</div>}
      />

      <div className={styles.content} ref={contentRef}>
        <TextGroup items={textItems} />

        <Related ref={relatedRef}>
          <Grid items={gridItems} columns={4} />
        </Related>
      </div>
    </div>
  );
};

export default ScrollDemoPage;
