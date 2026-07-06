"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { Flip } from "gsap/Flip";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import "./scroll-text-motion.css";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, Flip, ScrambleTextPlugin);

type TextItem = {
  text: string;
  pos: string;
  altPos: string;
  xl?: boolean;
  flipEase?: string;
  scrambleDuration?: number;
};

const GROUPS: TextItem[][] = [
  [
    { text: "Signal", pos: "pos-4", altPos: "pos-2" },
    { text: "Vacant orbit", pos: "pos-4", altPos: "pos-2" },
    { text: "Quantum waves", pos: "pos-4", altPos: "pos-2" },
  ],
  [
    { text: "Neural glow", pos: "pos-1", altPos: "pos-3" },
    { text: "Micro distortions", pos: "pos-1", altPos: "pos-3" },
    { text: "Data streams", pos: "pos-1", altPos: "pos-3" },
    { text: "Spark", pos: "pos-1", altPos: "pos-3" },
    { text: "Cold radiance", pos: "pos-1", altPos: "pos-3" },
  ],
  [
    {
      text: "M",
      pos: "pos-1",
      altPos: "pos-2",
      xl: true,
      scrambleDuration: 2.5,
    },
  ],
  [
    {
      text: "アクセス権限がありません",
      pos: "pos-1",
      altPos: "pos-3",
      scrambleDuration: 0,
    },
    { text: "█", pos: "pos-1", altPos: "pos-3", scrambleDuration: 0 },
  ],
  [
    { text: "Beacon", pos: "pos-2", altPos: "pos-5" },
    { text: "Synthetic veil", pos: "pos-2", altPos: "pos-5" },
    { text: "Hidden strata", pos: "pos-2", altPos: "pos-5" },
  ],
  [
    {
      text: "S",
      pos: "pos-3",
      altPos: "pos-9",
      xl: true,
      scrambleDuration: 2.5,
    },
  ],
  [
    { text: "Nebula", pos: "pos-3", altPos: "pos-2" },
    { text: "Digital scatter", pos: "pos-3", altPos: "pos-2" },
    { text: "Orbital drift", pos: "pos-3", altPos: "pos-2" },
    { text: "Photon shards", pos: "pos-3", altPos: "pos-2" },
  ],
  [
    {
      text: "操作は許可されていません",
      pos: "pos-1",
      altPos: "pos-3",
      scrambleDuration: 0,
    },
    { text: "█", pos: "pos-1", altPos: "pos-3", scrambleDuration: 0 },
  ],
  [
    { text: "Anomaly", pos: "pos-2", altPos: "pos-4" },
    { text: "Dark offset", pos: "pos-2", altPos: "pos-4" },
    { text: "Gradual decay", pos: "pos-2", altPos: "pos-4" },
    { text: "Temporal imprint", pos: "pos-2", altPos: "pos-4" },
    { text: "Stable rupture", pos: "pos-2", altPos: "pos-4" },
    { text: "Harmonic field", pos: "pos-2", altPos: "pos-4" },
  ],
  [
    {
      text: "A",
      pos: "pos-1",
      altPos: "pos-3",
      xl: true,
      scrambleDuration: 2.5,
    },
  ],
  [
    { text: "Latent energy", pos: "pos-2", altPos: "pos-9" },
    { text: "Spectral imprint", pos: "pos-2", altPos: "pos-9" },
    { text: "Muted emission", pos: "pos-2", altPos: "pos-9" },
    { text: "Archived potential", pos: "pos-2", altPos: "pos-9" },
    { text: "Quantum impulse", pos: "pos-2", altPos: "pos-9" },
    { text: "Distributed field", pos: "pos-2", altPos: "pos-9" },
  ],
  [
    {
      text: "B",
      pos: "pos-3",
      altPos: "pos-10",
      xl: true,
      scrambleDuration: 2.5,
      flipEase: "expo.in",
    },
  ],
  [
    { text: "Flare", pos: "pos-4", altPos: "pos-3" },
    { text: "Phase transit", pos: "pos-4", altPos: "pos-3" },
    { text: "Slow orbit", pos: "pos-4", altPos: "pos-3" },
    { text: "Merged signal", pos: "pos-4", altPos: "pos-3" },
  ],
  [
    {
      text: "権限が不足しています",
      pos: "pos-1",
      altPos: "pos-3",
      scrambleDuration: 0,
    },
    { text: "█", pos: "pos-1", altPos: "pos-3", scrambleDuration: 0 },
  ],
  [
    { text: "Latent charge", pos: "pos-3", altPos: "pos-5" },
    { text: "Nano beacon", pos: "pos-3", altPos: "pos-5" },
    { text: "Photon trail", pos: "pos-3", altPos: "pos-5" },
    { text: "Diffuse render", pos: "pos-3", altPos: "pos-5" },
  ],
  [
    {
      text: "N",
      pos: "pos-2",
      altPos: "pos-3",
      xl: true,
      scrambleDuration: 2.5,
    },
  ],
  [
    { text: "Silent current", pos: "pos-3", altPos: "pos-6" },
    { text: "Orbital marker", pos: "pos-3", altPos: "pos-6" },
    { text: "Radiant vector", pos: "pos-3", altPos: "pos-6" },
    { text: "Soft projection", pos: "pos-3", altPos: "pos-6" },
  ],
  [
    { text: "Quantum residue", pos: "pos-2", altPos: "pos-7" },
    { text: "Signal anchor", pos: "pos-2", altPos: "pos-7" },
    { text: "Luminous path", pos: "pos-2", altPos: "pos-7" },
    { text: "Ambient blur", pos: "pos-2", altPos: "pos-7" },
  ],
  [
    { text: "Dormant voltage", pos: "pos-3", altPos: "pos-8" },
    { text: "Micro relay", pos: "pos-3", altPos: "pos-8" },
    { text: "Spectral trace", pos: "pos-3", altPos: "pos-8" },
    { text: "Diffuse mapping", pos: "pos-3", altPos: "pos-8" },
    { text: "Residual energy", pos: "pos-3", altPos: "pos-8" },
    { text: "Nano transmitter", pos: "pos-3", altPos: "pos-8" },
    { text: "Photon residue", pos: "pos-3", altPos: "pos-8" },
    { text: "Soft raster", pos: "pos-3", altPos: "pos-8" },
    { text: "Stored impulse", pos: "pos-3", altPos: "pos-8" },
    { text: "Quantum locator", pos: "pos-3", altPos: "pos-8" },
    { text: "Radiant filament", pos: "pos-3", altPos: "pos-8" },
    { text: "Light diffusion", pos: "pos-3", altPos: "pos-8" },
    { text: "Static potential", pos: "pos-3", altPos: "pos-8" },
    { text: "Signal node", pos: "pos-3", altPos: "pos-8" },
    { text: "Energy wake", pos: "pos-3", altPos: "pos-8" },
    { text: "Blurred output", pos: "pos-3", altPos: "pos-8" },
    { text: "Hidden current", pos: "pos-3", altPos: "pos-8" },
    { text: "Data beacon", pos: "pos-3", altPos: "pos-8" },
    { text: "Lumen echo", pos: "pos-3", altPos: "pos-8" },
    { text: "Soft synthesis", pos: "pos-3", altPos: "pos-8" },
    { text: "Quantum latency", pos: "pos-3", altPos: "pos-8" },
    { text: "Neural marker", pos: "pos-3", altPos: "pos-8" },
    { text: "Optic trail", pos: "pos-3", altPos: "pos-8" },
    { text: "Diffuse signal", pos: "pos-3", altPos: "pos-8" },
  ],
  [
    { text: "Residual charge", pos: "pos-1", altPos: "pos-1" },
    { text: "Optical trace", pos: "pos-1", altPos: "pos-2" },
    { text: "Soft output", pos: "pos-1", altPos: "pos-4" },
    { text: "Stored voltage", pos: "pos-1", altPos: "pos-5" },
    { text: "Nano impulse", pos: "pos-1", altPos: "pos-6" },
    { text: "Diffuse field", pos: "pos-1", altPos: "pos-4" },
  ],
];

const RELATED_ITEMS = [
  {
    title: "Hover Animations for Terminal-like Typography",
    img: "https://tympanus.net/codrops/wp-content/uploads/2024/06/terminalhover_feat.jpg",
    href: "https://tympanus.net/Development/LineTextHoverAnimations/index.html",
  },
  {
    title: "Blurry Text Reveal on Scroll",
    img: "https://tympanus.net/codrops/wp-content/uploads/2024/04/blurrytext_featured.jpg",
    href: "https://tympanus.net/Development/ScrollBlurTypography/",
  },
  {
    title: "Some On-Scroll Text Highlight Animations",
    img: "https://tympanus.net/codrops/wp-content/uploads/2024/04/TextHighlight.jpg",
    href: "https://tympanus.net/Development/OnScrollTextHighlight/",
  },
  {
    title: "On-Scroll Expanding Image Animation within Typography",
    img: "https://tympanus.net/codrops/wp-content/uploads/2024/04/expandimage_feat.jpg",
    href: "https://tympanus.net/Development/ImageExpansionTypography/",
  },
  {
    title: "Inspiration for Text Block Transitions",
    img: "https://tympanus.net/codrops/wp-content/uploads/2023/07/textbocktransitions.jpg",
    href: "https://tympanus.net/Development/TextBlockTransitions/index.html",
  },
  {
    title: "Shuffling Typography Animation",
    img: "https://tympanus.net/codrops/wp-content/uploads/2023/02/typeshuffle.jpg",
    href: "https://tympanus.net/Development/TypeShuffleAnimation/",
  },
  {
    title: "On-Scroll Text Repetition Animation",
    img: "https://tympanus.net/codrops/wp-content/uploads/2022/04/TextRep_feat.jpg",
    href: "https://tympanus.net/Development/TextRepetitionEffect/index.html",
  },
  {
    title: "Kinetic Typography Page Transition",
    img: "https://tympanus.net/codrops/wp-content/uploads/2021/09/KineticTypePageTransition_featured.jpg",
    href: "https://tympanus.net/Development/KineticTypePageTransition/",
  },
];

export default function ScrollTextMotion() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      const smoother = ScrollSmoother.create({
        smooth: 1,
        normalizeScroll: true,
        wrapper: "#smooth-wrapper",
        content: "#smooth-content",
      });

      const textElements = root.querySelectorAll<HTMLElement>(".el");
      const logoEl = root.querySelector<HTMLElement>(".logo > span");
      const relatedEl = root.querySelector<HTMLElement>(".related");
      const relatedItems =
        relatedEl?.querySelectorAll<HTMLElement>(".grid__item") ?? [];

      textElements.forEach((el) => {
        el.dataset.text = el.textContent || "";
      });
      if (logoEl) logoEl.dataset.text = logoEl.textContent || "";

      function resetTextElements() {
        textElements.forEach((el) => {
          gsap.set(el, { clearProps: "transform,opacity,filter" });
        });
      }

      function initFlips() {
        resetTextElements();

        textElements.forEach((el) => {
          const originalClass = [...el.classList].find((c) =>
            c.startsWith("pos-"),
          );
          const targetClass = el.dataset.altPos;
          const flipEase = el.dataset.flipEase || "expo.inOut";

          if (!originalClass || !targetClass || originalClass === targetClass)
            return;

          el.classList.add(targetClass);
          el.classList.remove(originalClass);

          const flipState = Flip.getState(el, {
            props: "opacity, filter, width",
          });

          el.classList.add(originalClass);
          el.classList.remove(targetClass);

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
      }

      function scramble(
        el: HTMLElement,
        opts: { duration?: number; revealDelay?: number } = {},
      ) {
        const text = el.dataset.text ?? el.textContent ?? "";
        const finalDuration =
          opts.duration ??
          (el.dataset.scrambleDuration
            ? parseFloat(el.dataset.scrambleDuration)
            : 1);

        gsap.killTweensOf(el);
        gsap.fromTo(
          el,
          { scrambleText: { text: "", chars: "" } },
          {
            scrambleText: {
              text,
              chars: "upperAndLowerCase",
              revealDelay: opts.revealDelay ?? 0,
            },
            duration: finalDuration,
          },
        );
      }

      function killScrambleTriggers() {
        ScrollTrigger.getAll().forEach((st) => {
          if (st.vars.id === "scramble") st.kill();
        });
      }

      function initScramble() {
        killScrambleTriggers();
        textElements.forEach((el) => {
          ScrollTrigger.create({
            id: "scramble",
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            onEnter: () => scramble(el),
            onEnterBack: () => scramble(el),
          });
        });
        if (logoEl) scramble(logoEl, { revealDelay: 0.5 });
      }

      function initRelatedDemos() {
        if (!relatedEl || !relatedItems.length) return;

        gsap.set(relatedItems, { xPercent: 100, scale: 0, opacity: 0 });

        ScrollTrigger.create({
          trigger: relatedEl,
          start: "top center+=25%",
          onEnter: () => {
            if (logoEl)
              gsap.to(logoEl, { duration: 0.7, ease: "expo", opacity: 0 });
            gsap.fromTo(
              relatedItems,
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
            if (logoEl)
              gsap.to(logoEl, { duration: 0.5, ease: "power3.in", opacity: 1 });
            gsap.to(relatedItems, {
              duration: 0.5,
              ease: "power3.in",
              scale: 0,
              opacity: 0,
              xPercent: 100,
              stagger: 0.05,
            });
          },
        });
      }

      initFlips();
      initScramble();
      initRelatedDemos();

      const handleResize = () => {
        ScrollTrigger.refresh(true);
        initFlips();
        initScramble();
      };
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        smoother.kill();
      };
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef}>
      <header className="frame">
        <h1 className="frame__title">
          On-Scroll Text Motion inspired by{" "}
          <a href="https://www.instagram.com/p/DQkL7XUjEtN/">satto.studio</a>
        </h1>
        <a className="frame__archive" href="https://tympanus.net/codrops/hub/">
          All demos
        </a>
        <a
          className="frame__github"
          href="https://github.com/codrops/ScrollTextMotion"
        >
          GitHub
        </a>
        <nav className="frame__tags">
          <a href="https://tympanus.net/codrops/demos/?tag=scroll">#scroll</a>
          <a href="https://tympanus.net/codrops/demos/?tag=typography">
            #typography
          </a>
          <a href="https://tympanus.net/codrops/demos/?tag=gsap">#gsap</a>
        </nav>
      </header>

      <div className="logo fixed">
        <span>Mens Absens</span>
      </div>

      <div id="smooth-wrapper">
        <main id="smooth-content">
          <div className="content">
            {GROUPS.map((group, gi) => (
              <div className="group" key={gi}>
                {group.map((item, ii) => (
                  <div
                    key={ii}
                    className={`el ${item.xl ? "el--xl" : ""} ${item.pos}`}
                    data-alt-pos={item.altPos}
                    data-flip-ease={item.flipEase}
                    data-scramble-duration={item.scrambleDuration ?? 1}
                  >
                    {item.text}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <section className="related">
            <p>You might also like</p>
            <div className="grid">
              {RELATED_ITEMS.map((it, i) => (
                <a
                  className="grid__item"
                  href={it.href}
                  target="_blank"
                  rel="noreferrer"
                  key={i}
                >
                  <div
                    className="grid__item-img"
                    style={{ backgroundImage: `url(${it.img})` }}
                  />
                  <h3 className="grid__item-title">{it.title}</h3>
                </a>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
