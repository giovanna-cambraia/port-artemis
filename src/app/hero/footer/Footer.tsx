"use client";

import React from "react";
import "./Footer.css";
import { Canvas } from "@react-three/fiber";
import { useMotionValue } from "framer-motion";
import SkullCard from "./skull-card/Skull";

const Footer: React.FC = () => {
  const revealProgress = useMotionValue(1);

  return (
    <footer className="footer">
      <div className="footer__top">
        <h1 className="footer__name">G</h1>
      </div>

      <div className="footer__bottom">
        <div className="footer__left">
          <nav className="footer__nav">
            <div className="footer__nav-col">
              <a href="#">About</a>
              <a href="#">Projects</a>
              <a href="#">CTA</a>
            </div>
            <div className="footer__nav-col">
              <a href="#">FAQ</a>
              <a href="#">Linkedin</a>
              <span className="footer__badge">✦ Available for work</span>
            </div>
          </nav>

          <div className="footer__cta">
            <p>Ready to start your next digital experience?</p>
            <a href="#" className="footer__button">
              <span className="footer__button-dot" />
              GET IN TOUCH
            </a>
          </div>

          <p className="footer__copy">© 2026 G. All rights reserved.</p>
        </div>

       {/*  <div className="footer__card-wrap">
          <SkullCard />
        </div> */}
      </div>
    </footer>
  );
};

export default Footer;
