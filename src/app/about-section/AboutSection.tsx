"use client";

import React, { useEffect, useRef, useState } from "react";
import "./AboutSection.css";
import Horizons from "./horizontal-scroll/Horizon";

const AboutSection = () => {
  // Refs for all sections
  const heroContentRef = useRef<HTMLDivElement>(null);
  const heroAsideRef = useRef<HTMLDivElement>(null);
  const manifestoRef = useRef<HTMLDivElement>(null);
  const galleryHeaderRef = useRef<HTMLDivElement>(null);
  const skillsHeaderRef = useRef<HTMLDivElement>(null);
  const skillsFooterRef = useRef<HTMLDivElement>(null);
  const ctaInnerRef = useRef<HTMLDivElement>(null);

  const [wordIndex, setWordIndex] = useState(0);
  const [isLeaving, setIsLeaving] = useState(false);
  const [countedValues, setCountedValues] = useState({
    projects: 0,
    clients: 0,
    years: 0,
  });

  const words = ["Creative", "Developer", "Designer", "Innovator", "Builder"];

  // Image URLs (replace with your actual images)
  const heroImage =
    "https://images.unsplash.com/photo-1549692520-acc6669e2f0c?w=800&h=1000&fit=crop";
  const galleryImages = [
    "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=600&h=750&fit=crop",
    "https://images.unsplash.com/photo-1558655146-364adaf1fcc9?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1558655146-364adaf1fcc9?w=600&h=500&fit=crop",
  ];

  // Enhanced custom cursor with magnetic effect
  useEffect(() => {
    const cursor = document.createElement("div");
    cursor.className = "about-cursor";
    document.body.appendChild(cursor);

    const magneticElements = document.querySelectorAll(".magnetic-btn");
    const interactiveElements = document.querySelectorAll(
      ".image-card__frame, .skill-item, .magnetic-btn",
    );

    const move = (e: MouseEvent) => {
      cursor.style.left = e.clientX + "px";
      cursor.style.top = e.clientY + "px";

      // Check hover on interactive elements
      let isHovering = false;
      interactiveElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          isHovering = true;
        }
      });

      if (isHovering) {
        cursor.classList.add("hover");
      } else {
        cursor.classList.remove("hover");
      }

      // Magnetic effect for buttons
      magneticElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distanceX = e.clientX - centerX;
        const distanceY = e.clientY - centerY;
        const distance = Math.hypot(distanceX, distanceY);

        if (distance < 100) {
          const moveX = distanceX * 0.15;
          const moveY = distanceY * 0.15;
          (el as HTMLElement).style.transform =
            `translate(${moveX}px, ${moveY}px)`;
        } else {
          (el as HTMLElement).style.transform = "";
        }
      });
    };

    window.addEventListener("mousemove", move);
    return () => {
      window.removeEventListener("mousemove", move);
      cursor.remove();
    };
  }, []);

  // Word cycler animation
  useEffect(() => {
    const interval = setInterval(() => {
      setIsLeaving(true);
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % words.length);
        setIsLeaving(false);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, [words.length]);

  // Number counter animation
  const startCounter = () => {
    const targets = [87, 124, 12];
    const durations = [2000, 2000, 1500];

    targets.forEach((target, index) => {
      let start = 0;
      const duration = durations[index];
      const increment = target / (duration / 16);

      const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
          start = target;
          clearInterval(timer);
        }

        setCountedValues((prev) => {
          if (index === 0) return { ...prev, projects: Math.floor(start) };
          if (index === 1) return { ...prev, clients: Math.floor(start) };
          return { ...prev, years: Math.floor(start) };
        });
      }, 16);
    });
  };

  // Intersection Observer for scroll animations
  useEffect(() => {
    // Hero observer
    const heroObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (heroContentRef.current)
              heroContentRef.current.classList.add("is-visible");
            if (heroAsideRef.current)
              heroAsideRef.current.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.2 },
    );

    if (heroContentRef.current) heroObserver.observe(heroContentRef.current);
    if (heroAsideRef.current) heroObserver.observe(heroAsideRef.current);

    // Manifesto observer
    const manifestoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            startCounter();
            // Animate stat items
            const statItems = document.querySelectorAll(".manifesto-stat");
            statItems.forEach((item, idx) => {
              setTimeout(() => {
                item.classList.add("revealed");
              }, idx * 150);
            });
          }
        });
      },
      { threshold: 0.3 },
    );

    if (manifestoRef.current) manifestoObserver.observe(manifestoRef.current);

    // Gallery header observer
    const galleryObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (galleryHeaderRef.current)
              galleryHeaderRef.current.classList.add("revealed");
            const imageCards = document.querySelectorAll(".image-card");
            imageCards.forEach((card, idx) => {
              setTimeout(() => {
                card.classList.add("revealed");
              }, idx * 150);
            });
          }
        });
      },
      { threshold: 0.2 },
    );

    if (galleryHeaderRef.current)
      galleryObserver.observe(galleryHeaderRef.current);

    // Skills observer
    const skillsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (skillsHeaderRef.current)
              skillsHeaderRef.current.classList.add("revealed");
            if (skillsFooterRef.current)
              skillsFooterRef.current.classList.add("revealed");

            const skillCols = document.querySelectorAll(".skills-col");
            skillCols.forEach((col, idx) => {
              setTimeout(() => {
                col.classList.add("revealed");
              }, idx * 100);
            });

            const skillItems = document.querySelectorAll(".skill-item");
            skillItems.forEach((item, idx) => {
              setTimeout(() => {
                item.classList.add("revealed");
                const progressBar = item.querySelector(".skill-progress-bar");
                if (progressBar) {
                  const progress = progressBar.getAttribute("data-progress");
                  setTimeout(() => {
                    (progressBar as HTMLElement).style.width = progress || "0%";
                  }, 50);
                }
              }, idx * 80);
            });
          }
        });
      },
      { threshold: 0.2 },
    );

    if (skillsHeaderRef.current)
      skillsObserver.observe(skillsHeaderRef.current);
    if (skillsFooterRef.current)
      skillsObserver.observe(skillsFooterRef.current);

    // CTA observer with 3D tilt
    const ctaObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (ctaInnerRef.current)
              ctaInnerRef.current.classList.add("revealed");

            // Add 3D tilt effect on mousemove
            const handleMouseMove = (e: MouseEvent) => {
              if (!ctaInnerRef.current) return;
              const rect = ctaInnerRef.current.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
              const y = ((e.clientY - rect.top) / rect.height - 0.5) * 20;
              ctaInnerRef.current.style.transform = `rotateY(${x}deg) rotateX(${-y}deg)`;
            };

            window.addEventListener("mousemove", handleMouseMove);
            return () =>
              window.removeEventListener("mousemove", handleMouseMove);
          }
        });
      },
      { threshold: 0.3 },
    );

    if (ctaInnerRef.current) ctaObserver.observe(ctaInnerRef.current);

    // Gallery images observer (individual cards)
    const imageCardObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
          }
        });
      },
      { threshold: 0.1 },
    );

    const imageCards = document.querySelectorAll(".image-card");
    imageCards.forEach((card) => imageCardObserver.observe(card));

    return () => {
      heroObserver.disconnect();
      manifestoObserver.disconnect();
      galleryObserver.disconnect();
      skillsObserver.disconnect();
      ctaObserver.disconnect();
      imageCardObserver.disconnect();
    };
  }, []);

  return (
    <div className="about-section">
      {/* PANEL 1 — HERO */}
      <div className="about-panel about-panel--hero">
        <div className="hero-content" ref={heroContentRef}>
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-line"></span>
            <span className="hero-eyebrow-text">
              <span className="special-letter">M</span>OTION DESIGNER &
              DEVELOPER
            </span>
          </div>

          <h1 className="hero-headline">
            <span className="hero-line hero-line--1">
              <span
                className={`word-cycler ${isLeaving ? "is-leaving" : "is-visible"}`}
              >
                {words[wordIndex]}
              </span>
            </span>
            <span className="hero-line hero-line--2">WITH EDGE</span>
            <span className="hero-line hero-line--3">& PRECISION</span>
          </h1>

          <div className="hero-sub">
            Crafting immersive digital experiences that push boundaries and
            redefine possibilities. Where motion meets meaning, and code becomes
            art.
          </div>

          <div className="hero-cta-row">
            <a href="#work" className="magnetic-btn">
              View Work →
            </a>
            <a href="#contact" className="magnetic-btn">
              Contact Me
            </a>
          </div>
        </div>

        <div className="hero-aside" ref={heroAsideRef}>
          <div className="hero-img-frame">
            <div
              className="hero-img"
              style={{ backgroundImage: `url(${heroImage})` }}
            ></div>
            <div className="hero-img-cover"></div>
          </div>
        </div>
      </div>

      <div>
        <Horizons />
      </div>

      {/* PANEL 2 — MANIFESTO */}
      <div className="about-panel about-panel--manifesto" ref={manifestoRef}>
        <div className="manifesto-track">
          <div className="manifesto-copy">
            I turn <em>complex ideas</em> into seamless digital realities.
          </div>
          <div className="manifesto-body">
            With over a decade of experience pushing pixels and perfecting
            interactions, I've collaborated with brands that demand excellence.{" "}
            <strong>Motion is my language,</strong>
            and performance is my promise. Every line of code, every keyframe
            tells a story of precision and passion.
          </div>
        </div>

        <div className="manifesto-stats">
          <div className="manifesto-skills">
            <div className="manifesto-stat">
              <div className="manifesto-stat-value">
                {countedValues.projects}+
              </div>
              <div className="manifesto-stat-label">Projects Delivered</div>
            </div>
            <div className="manifesto-stat">
              <div className="manifesto-stat-value">
                {countedValues.clients}+
              </div>
              <div className="manifesto-stat-label">Happy Clients</div>
            </div>
            <div className="manifesto-stat">
              <div className="manifesto-stat-value">{countedValues.years}+</div>
              <div className="manifesto-stat-label">Years Experience</div>
            </div>
          </div>
        </div>
      </div>

      {/* PANEL 3 — JOURNEY / MILESTONES (Replaces Gallery) */}
      <div className="about-panel about-panel--journey">
        <div className="journey-header" ref={galleryHeaderRef}>
          <div className="journey-label">Personal Journey</div>
          <div className="journey-title">
            Career
            <br />
            Milestones
          </div>
        </div>

        <div className="journey-timeline">
          <div className="timeline-line"></div>

          <div className="milestone-card milestone-card--1">
            <div className="milestone-year">2024</div>
            <div className="milestone-content">
              <div className="milestone-title">Lead Innovation</div>
              <div className="milestone-desc">
                Spearheaded AI integration at global design firm,
                revolutionizing workflow efficiency by 150%
              </div>
              <div className="milestone-tag">Current Role</div>
            </div>
          </div>

          <div className="milestone-card milestone-card--2">
            <div className="milestone-year">2022</div>
            <div className="milestone-content">
              <div className="milestone-title">Award Recognition</div>
              <div className="milestone-desc">
                Received Awwwards Site of the Day for immersive brand experience
                platform
              </div>
              <div className="milestone-tag">Achievement</div>
            </div>
          </div>

          <div className="milestone-card milestone-card--3">
            <div className="milestone-year">2020</div>
            <div className="milestone-content">
              <div className="milestone-title">Master's Degree</div>
              <div className="milestone-desc">
                Completed MSc in Interactive Media with focus on emerging
                technologies
              </div>
              <div className="milestone-tag">Education</div>
            </div>
          </div>

          <div className="milestone-card milestone-card--4">
            <div className="milestone-year">2018</div>
            <div className="milestone-content">
              <div className="milestone-title">Studio Launch</div>
              <div className="milestone-desc">
                Founded creative studio working with Fortune 500 clients
                globally
              </div>
              <div className="milestone-tag">Entrepreneurship</div>
            </div>
          </div>
        </div>
      </div>

      {/* PANEL 4 — SKILLS */}
      <div className="about-panel about-panel--skills">
        <div className="skills-header" ref={skillsHeaderRef}>
          <div className="skills-label">Expertise</div>
          <div className="skills-title">
            Core
            <br />
            Competencies
          </div>
        </div>

        <div className="skills-columns">
          <div className="skills-col">
            <div className="skills-col-heading">Development</div>
            <div className="skill-item">
              <div className="skill-info">
                <div className="skill-name">
                  <span className="skill-dot"></span>
                  <span>React / Next.js</span>
                </div>
                <span className="skill-percent">95%</span>
              </div>
              <div className="skill-progress">
                <div className="skill-progress-bar" data-progress="95%"></div>
              </div>
            </div>
            <div className="skill-item">
              <div className="skill-info">
                <div className="skill-name">
                  <span className="skill-dot"></span>
                  <span>TypeScript</span>
                </div>
                <span className="skill-percent">90%</span>
              </div>
              <div className="skill-progress">
                <div className="skill-progress-bar" data-progress="90%"></div>
              </div>
            </div>
            <div className="skill-item">
              <div className="skill-info">
                <div className="skill-name">
                  <span className="skill-dot"></span>
                  <span>Node.js</span>
                </div>
                <span className="skill-percent">85%</span>
              </div>
              <div className="skill-progress">
                <div className="skill-progress-bar" data-progress="85%"></div>
              </div>
            </div>
            <div className="skill-item">
              <div className="skill-info">
                <div className="skill-name">
                  <span className="skill-dot"></span>
                  <span>Python</span>
                </div>
                <span className="skill-percent">80%</span>
              </div>
              <div className="skill-progress">
                <div className="skill-progress-bar" data-progress="80%"></div>
              </div>
            </div>
          </div>

          <div className="skills-col">
            <div className="skills-col-heading">Design</div>
            <div className="skill-item">
              <div className="skill-info">
                <div className="skill-name">
                  <span className="skill-dot"></span>
                  <span>Figma</span>
                </div>
                <span className="skill-percent">90%</span>
              </div>
              <div className="skill-progress">
                <div className="skill-progress-bar" data-progress="90%"></div>
              </div>
            </div>
            <div className="skill-item">
              <div className="skill-info">
                <div className="skill-name">
                  <span className="skill-dot"></span>
                  <span>Adobe Creative</span>
                </div>
                <span className="skill-percent">85%</span>
              </div>
              <div className="skill-progress">
                <div className="skill-progress-bar" data-progress="85%"></div>
              </div>
            </div>
            <div className="skill-item">
              <div className="skill-info">
                <div className="skill-name">
                  <span className="skill-dot"></span>
                  <span>Motion Design</span>
                </div>
                <span className="skill-percent">95%</span>
              </div>
              <div className="skill-progress">
                <div className="skill-progress-bar" data-progress="95%"></div>
              </div>
            </div>
            <div className="skill-item">
              <div className="skill-info">
                <div className="skill-name">
                  <span className="skill-dot"></span>
                  <span>UI/UX</span>
                </div>
                <span className="skill-percent">88%</span>
              </div>
              <div className="skill-progress">
                <div className="skill-progress-bar" data-progress="88%"></div>
              </div>
            </div>
          </div>

          <div className="skills-col">
            <div className="skills-col-heading">Tools</div>
            <div className="skill-item">
              <div className="skill-info">
                <div className="skill-name">
                  <span className="skill-dot"></span>
                  <span>Git / GitHub</span>
                </div>
                <span className="skill-percent">88%</span>
              </div>
              <div className="skill-progress">
                <div className="skill-progress-bar" data-progress="88%"></div>
              </div>
            </div>
            <div className="skill-item">
              <div className="skill-info">
                <div className="skill-name">
                  <span className="skill-dot"></span>
                  <span>VSCode</span>
                </div>
                <span className="skill-percent">85%</span>
              </div>
              <div className="skill-progress">
                <div className="skill-progress-bar" data-progress="85%"></div>
              </div>
            </div>
            <div className="skill-item">
              <div className="skill-info">
                <div className="skill-name">
                  <span className="skill-dot"></span>
                  <span>Webpack / Vite</span>
                </div>
                <span className="skill-percent">82%</span>
              </div>
              <div className="skill-progress">
                <div className="skill-progress-bar" data-progress="82%"></div>
              </div>
            </div>
            <div className="skill-item">
              <div className="skill-info">
                <div className="skill-name">
                  <span className="skill-dot"></span>
                  <span>Docker</span>
                </div>
                <span className="skill-percent">75%</span>
              </div>
              <div className="skill-progress">
                <div className="skill-progress-bar" data-progress="75%"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="skills-footer" ref={skillsFooterRef}>
          <div className="skills-available-dot"></div>
          <div className="skills-available-text">
            Available for freelance & full-time opportunities
          </div>
        </div>
      </div>

      {/* PANEL 5 — CTA */}
      <div className="about-panel about-panel--cta">
        <div className="cta-inner" ref={ctaInnerRef}>
          <div className="cta-eyebrow">What's Next?</div>
          <div className="cta-headline">
            Let's create <em>something</em>
            <br />
            extraordinary
          </div>
          <a
            href="#contact"
            className="magnetic-btn"
            style={{ fontSize: "0.9rem", padding: "1.2rem 2.5rem" }}
          >
            Start a project →
          </a>
          <div className="cta-visualizer">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="visualizer-bar"></div>
            ))}
          </div>
        </div>
        <div className="cta-bg-text">GET IN TOUCH</div>
      </div>
    </div>
  );
};

export default AboutSection;
