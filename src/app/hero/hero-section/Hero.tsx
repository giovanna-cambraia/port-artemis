"use client";
import Waves from "@/src/react-components/waves/Waves";
import "./Hero.css";

export default function HeroSection() {
  return (
    <section className="hero-section">
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
        {/* Top Divider Line with padding for menu */}
        <div className="hero-top-divider">
          <div className="hero-divider-line"></div>
        </div>

        {/* Main Content - Centered Phrase */}
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

        {/* Bottom Divider Line */}
        <div className="hero-bottom-divider">
          <div className="hero-divider-line"></div>
        </div>
      </div>
    </section>
  );
}
