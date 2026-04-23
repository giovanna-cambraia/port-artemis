"use client";

import React, { useRef, useEffect } from "react";
import "./Footer.css";
import KineticTypeDemo1 from "../kinetic-type/KineticTypeTorus";

const Footer: React.FC = () => {
  const footerRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const footer = footerRef.current;
    const bg = bgRef.current;
    const name = nameRef.current;
    const content = contentRef.current;
    if (!footer || !bg || !name || !content) return;

    const onScroll = () => {
      const rect = footer.getBoundingClientRect();
      const windowH = window.innerHeight;

      const progress = Math.max(
        0,
        Math.min(1, (windowH - rect.top) / (windowH + rect.height)),
      );

      bg.style.transform = `translateY(${(1 - progress) * 60}px)`;

      name.style.transform = `translateY(${(1 - progress) * 100}px)`;

      content.style.transform = `translateY(${(1 - progress) * 50}px)`;
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

      <div className="footer__torus">
        <div className="footer__torus-left-text">DIGITAL</div>
        <KineticTypeDemo1 />
        <div className="footer__torus-right-text">SHEPHERD</div>
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
            <a href="#">Dribbble</a>
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

          <p className="footer__copy">© 2025 SHEEP — All rights reserved</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
