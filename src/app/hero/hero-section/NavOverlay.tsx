"use client";

import { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import "./NavOverlay.css";

gsap.registerPlugin(useGSAP);

interface NavItem {
  index: string;
  label: string;
  marquee: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { index: "01", label: "ABOUT", marquee: "MY JOURNEY", href: "/about" },
  {
    index: "02",
    label: "PROJECTS",
    marquee: "SELECTED WORK",
    href: "/projects",
  },
  { index: "03", label: "CONTACT", marquee: "SAY HELLO", href: "/contact" },
];

interface NavOverlayProps {
  onClose: () => void;
}

export default function NavOverlay({ onClose }: NavOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () =>
      setTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      tl.from(".nav-overlay__header", { y: -30, opacity: 0, duration: 0.6 })
        .from(
          ".nav-row",
          { yPercent: 100, duration: 0.7, stagger: 0.08 },
          "-=0.3",
        )
        .from(
          ".nav-overlay__footer",
          { y: 40, opacity: 0, duration: 0.6 },
          "-=0.4",
        );
    },
    { scope: containerRef },
  );

  return (
    <div className="nav-overlay" ref={containerRef}>
      <header className="nav-overlay__header">
        <div className="nav-overlay__logo">
          <img src="/icon-img.png" alt="" />
        </div>
        <button
          className="nav-overlay__close"
          onClick={onClose}
          aria-label="Close menu"
        >
          <CloseIcon />
        </button>
      </header>

      <nav className="nav-overlay__list">
        {NAV_ITEMS.map((item) => (
          <NavRow key={item.label} item={item} />
        ))}
      </nav>

      <footer className="nav-overlay__footer">
        <div className="nav-overlay__col nav-overlay__blurb">
          <p>
            My work is driven by clarity, performance, and attention to detail.
            I focus on creating reliable digital experiences that feel simple,
            fast, and intentional.
          </p>
          <span className="nav-overlay__copyright">
            ©2026 All Rights Reserved
          </span>
        </div>

        <div className="nav-overlay__col nav-overlay__spacer nav-overlay__spacer--model">
         
        </div>

        <div className="nav-overlay__col nav-overlay__spacer">
          <PlusMark />
        </div>

        <div className="nav-overlay__col nav-overlay__spacer nav-overlay__spacer--model">
          
        </div>

        <div className="nav-overlay__col nav-overlay__contact">
          <a href="mailto:cambraia.dev@gmail.com">cambraia.dev@gmail.com</a>
          <span>São Paulo, Brasil</span>
        </div>

        <div className="nav-overlay__col nav-overlay__social">
          <a href="#" target="_blank" rel="noreferrer" className="social-link">
            <span className="social-link__label">instagram</span>
            <span className="social-link__icon">↗</span>
          </a>
          <a href="#" target="_blank" rel="noreferrer" className="social-link">
            <span className="social-link__label">linkedin</span>
            <span className="social-link__icon">↗</span>
          </a>
          <a href="#" target="_blank" rel="noreferrer" className="social-link">
            <span className="social-link__label">github</span>
            <span className="social-link__icon">↗</span>
          </a>
        </div>
      </footer>
    </div>
  );
}

interface NavRowProps {
  item: NavItem;
}

function NavRow({ item }: NavRowProps) {
  const rowRef = useRef<HTMLAnchorElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const marqueeRef = useRef<HTMLSpanElement>(null);
  const trackRef = useRef<HTMLSpanElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const loopTween = useRef<gsap.core.Tween | null>(null);

  useGSAP(
    () => {
      gsap.set(marqueeRef.current, { yPercent: -100 });

      loopTween.current = gsap
        .to(trackRef.current, {
          xPercent: -50,
          duration: 12,
          ease: "none",
          repeat: -1,
        })
        .pause();
    },
    { scope: rowRef },
  );

  const handleEnter = () => {
    gsap.to(labelRef.current, {
      yPercent: 120,
      duration: 0.5,
      ease: "power4.inOut",
    });
    gsap.to(marqueeRef.current, {
      yPercent: 0,
      duration: 0.5,
      ease: "power4.inOut",
    });
    gsap.to(dotRef.current, {
      y: 6,
      scale: 0.9,
      duration: 0.4,
      ease: "power3.out",
    });
    loopTween.current?.play();
  };

  const handleLeave = () => {
    gsap.to(labelRef.current, {
      yPercent: 0,
      duration: 0.5,
      ease: "power4.inOut",
    });
    gsap.to(marqueeRef.current, {
      yPercent: -100,
      duration: 0.5,
      ease: "power4.inOut",
    });
    gsap.to(dotRef.current, {
      y: 0,
      scale: 1,
      duration: 0.4,
      ease: "power3.out",
    });
    loopTween.current?.pause();
  };

  return (
    <a
      href={item.href}
      className="nav-row"
      ref={rowRef}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <span className="nav-row__index">{item.index}</span>

      <span className="nav-row__label" ref={labelRef}>
        {item.label}
      </span>

      <span className="nav-row__marquee" ref={marqueeRef} aria-hidden="true">
        <span className="nav-row__marquee-track" ref={trackRef}>
          {Array.from({ length: 6 }).map((_, i) => (
            <span className="nav-row__marquee-item" key={i}>
              {item.marquee}
              <span className="nav-row__marquee-arrow">↗</span>
            </span>
          ))}
        </span>
      </span>

      <span className="nav-row__dot" ref={dotRef}>
        <span className="nav-row__dot-inner" />
      </span>
    </a>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function PlusMark() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M5 0V10M0 5H10" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
