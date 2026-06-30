
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { TextElement, ScrambleConfig } from "../scroll.types";

gsap.registerPlugin(ScrollTrigger, Flip, ScrambleTextPlugin);

export const useGSAPAnimations = (
  containerRef: React.RefObject<HTMLElement>,
  textSelector = ".el",
  relatedSelector = ".related",
  gridItemSelector = ".grid__item",
) => {
  const animationsInitialized = useRef(false);

  const scramble = (el: Element, text: string, config: ScrambleConfig = {}) => {
    const {
      duration = 1,
      revealDelay = 0,
      chars = "upperAndLowerCase",
    } = config;

    gsap.killTweensOf(el);

    gsap.fromTo(
      el,
      { scrambleText: { text: "", chars: "" } },
      {
        scrambleText: {
          text,
          chars,
          revealDelay,
        },
        duration,
      },
    );
  };

  const initFlips = () => {
    if (!containerRef.current) return;

    const textElements = containerRef.current.querySelectorAll(textSelector);

    textElements.forEach((el) => {
      gsap.set(el, {
        clearProps: "transform,opacity,filter",
      });
    });

    textElements.forEach((el) => {
      const element = el as TextElement;
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

  const initScramble = () => {
    if (!containerRef.current) return;

    const textElements = containerRef.current.querySelectorAll(textSelector);

    textElements.forEach((el) => {
      const element = el as TextElement;
      if (!element.dataset.text) {
        element.dataset.text = element.textContent || "";
      }
    });

    ScrollTrigger.getAll().forEach((st) => {
      if (st.vars.id === "scramble") {
        st.kill();
      }
    });

    textElements.forEach((el) => {
      const element = el as TextElement;
      const text = element.dataset.text || "";
      const duration = element.dataset.scrambleDuration
        ? parseFloat(element.dataset.scrambleDuration)
        : 1;

      ScrollTrigger.create({
        id: "scramble",
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        onEnter: () => scramble(el, text, { duration, revealDelay: 0 }),
        onEnterBack: () => scramble(el, text, { duration, revealDelay: 0 }),
      });
    });
  };

  const initRelatedDemos = () => {
    if (!containerRef.current) return;

    const relatedEl = containerRef.current.querySelector(relatedSelector);
    const gridItems = relatedEl?.querySelectorAll(gridItemSelector);

    if (!relatedEl || !gridItems?.length) return;

    gsap.set(gridItems, {
      xPercent: 100,
      scale: 0,
      opacity: 0,
    });

    ScrollTrigger.create({
      trigger: relatedEl,
      start: "top center+=25%",
      onEnter: () => {
        gsap.fromTo(
          gridItems,
          { xPercent: 100, scale: 0, opacity: 0 },
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
        gsap.to(gridItems, {
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

  const init = () => {
    if (!containerRef.current || animationsInitialized.current) return;

    ScrollSmoother.create({
      smooth: 1,
      normalizeScroll: true,
    });

    initFlips();
    initScramble();
    initRelatedDemos();

    animationsInitialized.current = true;
  };

  const cleanup = () => {
    ScrollTrigger.getAll().forEach((st) => st.kill());
    gsap.killTweensOf("*");
    animationsInitialized.current = false;
  };

  const refresh = () => {
    ScrollTrigger.refresh(true);
    cleanup();
    init();
  };

  useEffect(() => {
    init();

    const handleResize = () => {
      refresh();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cleanup();
    };
  }, []);

  return { init, cleanup, refresh, scramble };
};
