"use client";
import "./Features.css";
import { ArrowUpRight } from "lucide-react";

const features = [
  {
    number: "01",
    title: "Performance First",
    description:
      "I focus on building websites that load fast and feel smooth from the first interaction. Performance is considered at every stage, from structure and assets to code quality and optimization, ensuring reliable results on real devices and networks.",
    link: "Learn more",
    variant: "light" as const,
  },
  {
    number: "02",
    title: "Clean & Scalable Code",
    description:
      "I write clean, well-structured, and maintainable code with a strong focus on clarity and long-term scalability. This approach makes projects easier to understand, update, and extend over time, while reducing complexity and keeping the codebase reliable as it grows.",
    link: "My workflow",
    variant: "accent" as const,
  },
  {
    number: "03",
    title: "Modern UI & UX",
    description:
      "I design intuitive interfaces that prioritize user experience without sacrificing aesthetics. Every element is crafted with purpose, ensuring seamless navigation and engaging interactions that keep users coming back.",
    link: "See examples",
    variant: "light" as const,
  },
  {
    number: "04",
    title: "SEO Optimized",
    description:
      "Every website I build is structured with search engines in mind. From semantic HTML to meta tags and performance metrics, I ensure your site ranks well and reaches the right audience organically.",
    link: "Learn more",
    variant: "accent" as const,
  },
  {
    number: "05",
    title: "Responsive Design",
    description:
      "I create websites that look and function perfectly across all devices and screen sizes. From mobile phones to large desktop monitors, every layout adapts fluidly to provide an optimal viewing experience.",
    link: "View process",
    variant: "light" as const,
  },
];

export function FeaturesSection() {
  return (
    <section className="relative bg-[#1a1a1a]">
      {/* Grid lines overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="h-full w-full flex">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex-1 border-r border-white/10 last:border-r-0"
            />
          ))}
        </div>
      </div>

      {/* Cards Container */}
      <div className="relative">
        {features.map((feature, index) => (
          <div
            key={feature.number}
            className="sticky top-0"
            style={{ zIndex: index + 1 }}
          >
            <div
              className={`
                min-h-[70vh] md:min-h-[80vh] relative overflow-hidden
                ${feature.variant === "light" ? "bg-[#f5f5f5]" : "bg-[#ff0000]"}
                transition-all duration-500 ease-out
              `}
            >
              {/* Grid lines for card */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="h-full w-full flex">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 border-r last:border-r-0 ${
                        feature.variant === "light"
                          ? "border-black/10"
                          : "border-black/10"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="relative z-10 flex flex-col justify-between h-full min-h-[70vh] md:min-h-[80vh] px-6 md:px-12 lg:px-16 py-12 md:py-16">
                {/* Top section with title and number */}
                <div className="flex items-start justify-between">
                  <h2
                    className={`
                      font-sans font-black uppercase leading-[0.9] tracking-tight
                      text-[10vw] md:text-[8vw] lg:text-[7vw]
                      ${feature.variant === "light" ? "text-[#1a1a1a]" : "text-[#1a1a1a]"}
                    `}
                  >
                    {feature.title}
                  </h2>

                  {/* Large Number */}
                  <span
                    className={`
                      font-sans font-black text-[20vw] md:text-[18vw] lg:text-[15vw]
                      leading-none select-none
                      ${feature.variant === "light" ? "text-black/10" : "text-black/15"}
                    `}
                  >
                    {feature.number}
                  </span>
                </div>

                {/* Bottom section with description and link */}
                <div className="max-w-2xl mx-auto text-center mt-auto">
                  <p
                    className={`
                      text-sm md:text-base leading-relaxed mb-6
                      ${feature.variant === "light" ? "text-[#1a1a1a]/80" : "text-[#1a1a1a]/80"}
                    `}
                  >
                    {feature.description}
                  </p>

                  <a
                    href="#"
                    className={`
                      inline-flex items-center gap-1 text-sm font-medium
                      transition-opacity hover:opacity-70
                      ${feature.variant === "light" ? "text-[#1a1a1a]" : "text-[#1a1a1a]"}
                    `}
                  >
                    {feature.link}
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Bottom shadow for depth */}
              <div
                className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
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
