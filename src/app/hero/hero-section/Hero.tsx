// Hero.tsx (HeroSection)
"use client";
import { useState, useEffect } from "react";
import Waves from "@/src/react-components/waves/Waves";
import NavOverlay from "./NavOverlay";
import "./Hero.css";

export default function HeroSection() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);

  return (
    <section className="hero-section">
      {/* Navbar - Top Right */}
      <header className="hero-navbar">
        <div className="hero-nav-container">
          <button
            className={`hero-menu-button ${menuOpen ? "is-open" : ""}`}
            onClick={toggleMenu}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            <div className="hero-menu-button-text">
              <span className="hero-menu-label">Menu</span>
              <span className="hero-menu-label">Close</span>
            </div>
            <div className="hero-menu-icon-wrap">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="hero-menu-icon"
              >
                <path d="M7.33333 16V0H8.66667V16H7.33333Z" fill="currentColor" />
                <path d="M16 8.66667H0V7.33333H16V8.66667Z" fill="currentColor" />
              </svg>
            </div>
          </button>
        </div>
      </header>

      {/* Replaces the old hero-menu-overlay block entirely */}
      {menuOpen && <NavOverlay onClose={closeMenu} />}

      <div className="hero-wave-background">
        <Waves
          lineColor="gray"
          backgroundColor="transparent"
          waveSpeedX={0.015}
          waveSpeedY={0.01}
          waveAmpX={40}
          waveAmpY={20}
          friction={0.9}
          tension={0.01}
          maxCursorMove={120}
          xGap={12}
          yGap={36}
        />
      </div>

      <div className="hero-content-container">
        <div className="hero-top-divider">
          <div className="hero-divider-line"></div>
        </div>

        <div className="hero-main-content">
          <h1 className="hero-title">
            <span className="hero-title-line-1">
              I <span className="special-letter">B</span>uild Modern
            </span>
            <span className="hero-title-line-2">
              <span className="special-letter">W</span>ebsites
            </span>
            <span className="hero-title-line-3">
              That <span className="special-letter">W</span>ork
            </span>
          </h1>
        </div>

        <div className="hero-bottom-divider">
          <div className="hero-divider-line"></div>
        </div>
      </div>
    </section>
  );
}