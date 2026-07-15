"use client";

import HeroSection from "./hero-section/Hero";
import { FeaturesSection } from "./features-section/Features";
import { ImmersiveSection } from "../immersive-section/Immersive";
import TransmissionWrapper from "../immersive-section/3Dscene/TransmissionWrapper";
import Footer from "./footer/Footer";
import ScrollSection from "../about-section/statue-section/horizontal-scroll/ScrollSection";
import StatueSection from "../about-section/statue-section/StatueSection";
import WorkSection from "../about-section/work-section/WorkSection";
import CTA from "../about-section/work-section/cta/CTA";


export default function Home() {

  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <ImmersiveSection />
      <ScrollSection />
      <StatueSection />
      <TransmissionWrapper />
      <WorkSection/>
      <CTA/>
      <Footer />
    </>
  );
}
