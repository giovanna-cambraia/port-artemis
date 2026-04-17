import HeroSection from "./hero-section/Hero";
import { FeaturesSection } from "./features-section/Features";
import { ImmersiveSection } from "./immersive-section/Immersive";
import Footer from "./footer/Footer";

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <ImmersiveSection />
      <Footer/>
    </>
  );
}
