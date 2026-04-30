"use client";
import { useState, useEffect } from "react";
import Waves from "@/src/react-components/waves/Waves";
import "./Hero.css";

export default function HeroSection() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const menuItems = [
    { num: "01", label: "About" },
    { num: "02", label: "Work" },
    { num: "03", label: "Projects" },
    { num: "04", label: "Contact" },
  ];

  return (
    <section className="hero-section">
      {/* Navbar - Top Right */}
      <header className="hero-navbar">
        <div className="hero-nav-container">
          {/* Menu Button */}
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
                <path
                  d="M7.33333 16V0H8.66667V16H7.33333Z"
                  fill="currentColor"
                />
                <path
                  d="M16 8.66667H0V7.33333H16V8.66667Z"
                  fill="currentColor"
                />
              </svg>
            </div>
          </button>
        </div>
      </header>


      {/* Fullscreen Menu Overlay */}
      <div className={`hero-menu-overlay ${menuOpen ? "is-open" : ""}`}>
        <div className="hero-menu-overlay-bg" onClick={toggleMenu} />
        <nav className="hero-menu-panel">
          <div className="hero-menu-inner">
            {/* Optional top section - like in your screenshot */}
            <div className="hero-menu-header">
              <div className="hero-menu-header-title">Navigation</div>
              <div className="hero-menu-header-desc">
                Explore my work and journey
              </div>
            </div>

            {/* Main menu items - centered */}
            <ul className="hero-menu-list">
              {menuItems.map((item) => (
                <li key={item.num} className="hero-menu-item">
                  <a
                    href={`#${item.label.toLowerCase()}`}
                    className="hero-menu-link"
                    onClick={toggleMenu}
                  >
                    <span className="hero-menu-link-num">{item.num}</span>
                    <span className="hero-menu-link-heading">{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>

            {/* Footer with socials and copyright */}
            <div className="hero-menu-footer">
              <div className="hero-menu-socials">
                <a href="#" className="hero-menu-social-link">
                  GitHub
                </a>
                <a href="#" className="hero-menu-social-link">
                  LinkedIn
                </a>
                <a href="#" className="hero-menu-social-link">
                  Twitter
                </a>
              </div>
              <div className="hero-menu-copyright">
                ©2026 All Rights Reserved
              </div>
            </div>
          </div>
        </nav>
      </div>
      {/* Animated Wave Background */}
      <div className="hero-wave-background">
        <Waves
          lineColor="rgba(255, 255, 255, 0.15)"
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

      {/* Content */}
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
