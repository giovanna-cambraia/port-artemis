"use client";
import { useEffect, useRef } from "react";
import "./Features.css";

const features = [
  {
    number: "01",
    title: "Performance First",
    description:
      "I focus on building websites that load fast and feel smooth from the first interaction. Performance is considered at every stage, from structure and assets to code quality and optimization, ensuring reliable results on real devices and networks.",
    variant: "light" as const,
  },
  {
    number: "02",
    title: "Clean & Scalable Code",
    description:
      "I write clean, well-structured, and maintainable code with a strong focus on clarity and long-term scalability. This approach makes projects easier to understand, update, and extend over time.",
    variant: "accent" as const,
  },
  {
    number: "03",
    title: "Modern UI & UX",
    description:
      "I design intuitive interfaces that prioritize user experience without sacrificing aesthetics. Every element is crafted with purpose, ensuring seamless navigation and engaging interactions.",
    variant: "light" as const,
  },
  {
    number: "04",
    title: "SEO Optimized",
    description:
      "Every website I build is structured with search engines in mind. From semantic HTML to meta tags and performance metrics, I ensure your site ranks well and reaches the right audience organically.",
    variant: "accent" as const,
  },
  {
    number: "05",
    title: "Responsive Design",
    description:
      "I create websites that look and function perfectly across all devices and screen sizes. From mobile phones to large desktop monitors, every layout adapts fluidly.",
    variant: "light" as const,
  },
];

export function FeaturesSection() {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const progress = Math.min(Math.max(-rect.top / rect.height, 0), 0.8);
        const scale = 1 - progress * 0.05;
        const opacity = 1 - progress * 0.3;
        card.style.transform = `scale(${scale})`;
        card.style.opacity = `${opacity}`;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="features-section">
      <div className="features-grid-overlay">
        <div className="grid-container">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="grid-column" />
          ))}
        </div>
      </div>

      <div className="cards-container">
        {features.map((feature, index) => (
          <div
            key={feature.number}
            className="card-sticky"
            style={{ zIndex: index + 1 }}
          >
            <div
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              className={`feature-card ${
                feature.variant === "light" ? "card-light" : "card-accent"
              }`}
            >
              <div className="card-grid-overlay">
                <div className="grid-container">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="card-grid-column" />
                  ))}
                </div>
              </div>

              <div className="card-content">
                <div className="card-header">
                  <span className="card-index">{feature.number}</span>
                  <span className="card-total">/05</span>
                </div>

                <div className="card-body">
                  <h2
                    className={`card-title ${
                      feature.variant === "light"
                        ? "title-light"
                        : "title-accent"
                    }`}
                  >
                    {feature.title}
                  </h2>

                  <p
                    className={`card-description ${
                      feature.variant === "light"
                        ? "description-light"
                        : "description-accent"
                    }`}
                  >
                    {feature.description}
                  </p>
                </div>
              </div>

              <div
                className="card-shadow"
                style={{
                  background:
                    feature.variant === "light"
                      ? "linear-gradient(to top, rgba(0,0,0,0.05), transparent)"
                      : "linear-gradient(to top, rgba(0,0,0,0.08), transparent)",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
