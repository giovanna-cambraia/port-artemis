import HeroSection from "./hero-section/Hero";
import { FeaturesSection } from "./features-section/Features";
import { ImmersiveSection } from "../immersive-section/Immersive";
import TransmissionWrapper from "../immersive-section/3Dscene/TransmissionWrapper";
import Footer from "./footer/Footer";
import ScrollSection from "../about-section/horizontal-scroll/ScrollSection";
import StatueSection from "../about-section/statue-section/StatueSection";
import WorkSection from "../about-section/work-section/WorkSection";


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
      <Footer />
    </>
  );
}
