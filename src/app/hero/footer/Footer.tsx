"use client";

import React, { useRef, useEffect } from "react";
import "./Footer.css";
import { Canvas } from "@react-three/fiber";
import RevealImage from "./r3f-reveal/components/RevealImage";

const Footer: React.FC = () => {
  const footerRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const torusRef = useRef<HTMLDivElement>(null);

  // Progresso do reveal da imagem
  const revealProgress = useRef({
    value: 0,
    get: () => revealProgress.current.value,
    set: (val: number) => {
      revealProgress.current.value = val;
    },
  });

  useEffect(() => {
    const footer = footerRef.current;
    const bg = bgRef.current;
    const name = nameRef.current;
    const content = contentRef.current;
    const torus = torusRef.current;

    if (!footer || !bg || !name || !content || !torus) return;

    const onScroll = () => {
      const rect = footer.getBoundingClientRect();
      const windowH = window.innerHeight;

      // Progresso geral do footer (0 a 1)
      let progress = Math.max(
        0,
        Math.min(1, (windowH - rect.top) / (windowH + rect.height)),
      );

      // Easing para suavizar
      progress = Math.pow(progress, 1.5);

      // Parallax effects
      bg.style.transform = `translateY(${(1 - progress) * 60}px)`;
      name.style.transform = `translateY(${(1 - progress) * 100}px)`;
      content.style.transform = `translateY(${(1 - progress) * 50}px)`;

      const imageRevealProgress = Math.max(0, Math.min(1, progress / 0.3));

      revealProgress.current.set(imageRevealProgress);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <footer className="footer" ref={footerRef}>
      {/* Parallax background layer */}
      <div className="footer__bg" ref={bgRef} />

      {/* Giant name — parallax layer 1 */}
      <div className="footer__name-wrap" ref={nameRef}>
        <span className="footer__name">SHEEP MS</span>
      </div>

      <div className="footer__torus" ref={torusRef}>
        <div className="footer__torus-left-text">DIGITAL</div>

        {/* Container do Canvas para o RevealImage */}
        <div className="footer__reveal-container">
          <Canvas
            camera={{ position: [0, 0, 3] }}
            style={{
              width: "100%",
              height: "100%",
              background: "transparent",
            }}
          >
            <RevealImage
              imageTexture="/textureupscaled.webp"
              revealProgress={revealProgress.current}
              isFullScreen={false}
            />
          </Canvas>
        </div>

        <div className="footer__torus-right-text">SHEPHERD</div>

        <span className="footer__torus-label-left">EST. 2026</span>
        <span className="footer__torus-label-right">BRASIL, PT</span>
      </div>

      <div className="footer__content" ref={contentRef}>
        <div className="footer__top-row">
          <div className="footer__tagline">
            <span className="footer__dot" />
            Available for work
          </div>
          <div className="footer__socials">
            <a href="#">Instagram</a>
            <a href="#">LinkedIn</a>
            <a href="#">Github</a>
          </div>
        </div>
        {/* Enhanced footer: added bottom row with nav, cta, and copyright */}
        <div className="footer__bottom-row">
          <div className="footer__nav">
            <a href="#">Work</a>
            <a href="#">Services</a>
            <a href="#">About</a>
            <a href="#">Contact</a>
          </div>

          <p className="footer__copy">© 2026 SHEEP — All rights reserved</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
