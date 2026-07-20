"use client";

import { useEffect, useState } from "react";
import { subscribePageTransition } from "../../immersive-section/lib/pageTransition";
import "./PageTransitionOverlay.css";

export default function PageTransitionOverlay() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribePageTransition(setVisible);
    return () => {
      unsubscribe();
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="pt-overlay">
      <div className="pt-noise" />
      <div className="pt-scanlines" />
      <div className="pt-tear pt-tear-1" />
      <div className="pt-tear pt-tear-2" />
    </div>
  );
}
