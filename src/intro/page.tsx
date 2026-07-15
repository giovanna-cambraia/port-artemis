"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import "./intro.css";
import Preloader from "../components/preloader/Preloader";

interface HomeProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function Home({ searchParams }: HomeProps) {
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [preloaderDone, setPreloaderDone] = useState(false);
  const [portfolioLoaded, setPortfolioLoaded] = useState(false);
  const phoneWrapperRef = useRef<HTMLDivElement>(null);
  const portfolioContentRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);

  // Track if preloader has been mounted
  const hasPreloaderCompletedRef = useRef(false);

  const handlePreloaderComplete = () => {
    // Prevent multiple calls
    if (hasPreloaderCompletedRef.current) return;
    hasPreloaderCompletedRef.current = true;
    setPreloaderDone(true);
  };

  const handleScreenClick = () => {
    if (isAnimating || showPortfolio) return;

    setIsAnimating(true);

    // Add camera push effect
    if (cameraRef.current) {
      cameraRef.current.classList.add("camera-push");
    }

    if (phoneWrapperRef.current) {
      phoneWrapperRef.current.classList.add("zoom-out");
    }

    setTimeout(() => {
      setShowPortfolio(true);
      setPortfolioLoaded(true);

      setTimeout(() => {
        if (portfolioContentRef.current) {
          portfolioContentRef.current.classList.add("portfolio-enter");
        }
        setIsAnimating(false);

        // Remove camera push class after animation
        if (cameraRef.current) {
          cameraRef.current.classList.remove("camera-push");
        }
      }, 100);
    }, 800);
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showPortfolio) {
        handleBackToComputer();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [showPortfolio]);

  const handleBackToComputer = () => {
    if (isAnimating) return;

    setIsAnimating(true);
    setShowPortfolio(false);

    if (phoneWrapperRef.current) {
      phoneWrapperRef.current.classList.remove("zoom-out");
      void phoneWrapperRef.current.offsetHeight;
    }

    // Add reverse camera effect
    if (cameraRef.current) {
      cameraRef.current.classList.add("camera-pull-back");
    }

    setTimeout(() => {
      setIsAnimating(false);
      if (cameraRef.current) {
        cameraRef.current.classList.remove("camera-pull-back");
      }
    }, 500);
  };

  // Don't unmount Preloader, just hide it
  return (
    <>
      {/* Preloader - always mounted but hidden when done */}
      <div style={{ display: preloaderDone ? "none" : "block" }}>
        <Preloader onComplete={handlePreloaderComplete} />
      </div>
    </>
  );
}
