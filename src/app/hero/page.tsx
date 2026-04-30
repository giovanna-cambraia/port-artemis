import HeroSection from "./hero-section/Hero";
import { FeaturesSection } from "./features-section/Features";
import { ImmersiveSection } from "../immersive-section/Immersive";
import Footer from "./footer/Footer";
import AboutSection from "../about-section/AboutSection";
import TransmissionWrapper from "../immersive-section/3Dscene/TransmissionWrapper";

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <ImmersiveSection />
      <AboutSection />
      <Footer />
    </>
  );
}
