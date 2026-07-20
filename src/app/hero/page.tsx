"use client";

import HeroSection from "./hero-section/Hero";
import { FeaturesSection } from "./features-section/Features";
import { ImmersiveSection } from "../immersive-section/Immersive";
import ScrollSection from "../about-section/statue-section/horizontal-scroll/ScrollSection";
import StatueSection from "../about-section/statue-section/StatueSection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <ImmersiveSection />
      <ScrollSection />
      <StatueSection />
    </>
  );
}
