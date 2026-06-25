import HeroSection from "./hero-section/Hero";
import { FeaturesSection } from "./features-section/Features";
import { ImmersiveSection } from "../immersive-section/Immersive";
import Horizons from "../about-section/horizontal-scroll/ScrollSection";
import AboutSection from "../about-section/AboutSection";
import TransmissionWrapper from "../immersive-section/3Dscene/TransmissionWrapper";
import Footer from "./footer/Footer";
import ScrollSection from "../about-section/horizontal-scroll/ScrollSection";
import AboutHeader from "../about-section/about-header/AboutHeader";

function HeaderPlaceholder() {
  return (
    <section
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#444",
        fontFamily: "monospace",
        fontSize: "1.2rem",
        border: "1px dashed #333",
      }}
    >
      {/* TODO: Header section — not built yet */}
      [ HEADER — placeholder ]
    </section>
  );
}

function MinimalStuffPlaceholder() {
  return (
    <section
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#444",
        fontFamily: "monospace",
        fontSize: "1.2rem",
        border: "1px dashed #333",
      }}
    >
      {/* TODO: "Minimal stuff" section — not built yet */}
      [ MINIMAL STUFF — placeholder ]
    </section>
  );
}

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <ImmersiveSection />
      <AboutHeader />
      <ScrollSection />
      <TransmissionWrapper />
      <AboutSection />
      <Footer />
    </>
  );
}