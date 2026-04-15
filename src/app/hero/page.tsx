import HeroSection from "./hero-section/Hero";
import { FeaturesSection } from "./features-section/Features";
import { ImmersiveSection } from "./immersive-section/Immersive"; 

export default function Home() {
  return (
    <main>
      <HeroSection />
      <FeaturesSection />
      <ImmersiveSection/>
    </main>
  );
}
