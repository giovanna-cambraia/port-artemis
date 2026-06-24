import HeroSection from "./hero-section/Hero";
import { FeaturesSection } from "./features-section/Features";
import { ImmersiveSection } from "../immersive-section/Immersive";
import Horizons from "../about-section/horizontal-scroll/Horizon";
import AboutSection from "../about-section/AboutSection";
import TransmissionWrapper from "../immersive-section/3Dscene/TransmissionWrapper";
import Footer from "./footer/Footer";

/**
 * Page order (single continuous scroll, per the "one rhythm" decision):
 *
 *   1. HeroSection + FeaturesSection         — existing, unchanged
 *   2. ImmersiveSection ("W" portal)          — existing, now ONLY the portal
 *   3. Header                                 — NOT BUILT YET (placeholder below)
 *   4. Horizons (horizontal-scroll slides)    — existing, moved here from AboutSection
 *   5. "Minimal stuff" section                — NOT BUILT YET (placeholder below)
 *   6. TransmissionWrapper (black hole dive)  — existing scene, now its own
 *                                                500vh section with real room
 *      to breathe (was previously dead code, never mounted)
 *   7. AboutSection                           — hero/manifesto/skills/gallery
 *                                                content (CTA panel REMOVED,
 *                                                see CtaSection.tsx)
 *   8. Footer                                 — existing, unchanged
 *
 * CTA is intentionally NOT here — it's its own page now. See
 * CtaSection.tsx and wire it into whatever route you want (e.g. /contact).
 *
 * Placeholders below are deliberately bare so the scroll order and heights
 * are correct today; swap them out as you build the real sections. Don't
 * delete the wrapping <section> easily — removing height changes the
 * scroll math for everything below it.
 */

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
      <HeaderPlaceholder />
      <MinimalStuffPlaceholder />
      <TransmissionWrapper />
      <AboutSection />
      {/* <TransmissionWrapper/> */}
      <Footer />
    </>
  );
}