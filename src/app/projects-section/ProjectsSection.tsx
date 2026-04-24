"use client";

import React, { useRef, useState, useCallback } from "react";
import "./ProjectsSection.css";
import ProjectHoverCanvas from "./ProjectHoverCanvas";

export type Project = {
  id: number;
  title: string;
  year: string;
  tags: string[];
  role: string;
  image: string;
};

const PROJECTS: Project[] = [
  {
    id: 1,
    title: "ABYSS",
    year: "2026",
    tags: ["WebGL", "Three.js"],
    role: "Creative Dev",
    image: "/textureupscaled.webp",
  },
  {
    id: 2,
    title: "VORTEX",
    year: "2025",
    tags: ["React", "GSAP"],
    role: "Frontend",
    image: "/textureupscaled.webp",
  },
  {
    id: 3,
    title: "CIPHER",
    year: "2025",
    tags: ["Next.js", "Shader"],
    role: "Full Stack",
    image: "/textureupscaled.webp",
  },
  {
    id: 4,
    title: "REMNANT",
    year: "2024",
    tags: ["R3F", "Motion"],
    role: "Creative Dev",
    image: "/textureupscaled.webp",
  },
];

export default function ProjectsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isCanvasMounted, setIsCanvasMounted] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const cursorPos = useRef({ x: 0, y: 0 });

  const revealProgress = useRef({
    value: 0,
    get: () => revealProgress.current.value,
    set: (val: number) => {
      revealProgress.current.value = val;
    },
  });

  // Mount canvas when section enters viewport
  const handleSectionRef = useCallback((node: HTMLElement | null) => {
    (sectionRef as any).current = node;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsCanvasMounted(true);
        } else {
          setIsCanvasMounted(false);
          setActiveImage(null);
          setActiveIndex(null);
          revealProgress.current.set(0);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(node);
  }, []);

  const handleMouseEnter = useCallback(
    (project: Project, index: number) => {
      // Instant swap — re-key triggers re-mount of RevealImage → progress resets to 0
      setActiveImage(project.image);
      setActiveIndex(index);
      revealProgress.current.set(0);
      // Small timeout so the new texture is loaded before animating in
      requestAnimationFrame(() => {
        revealProgress.current.set(1);
      });
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    revealProgress.current.set(0);
    setTimeout(() => {
      setActiveImage(null);
      setActiveIndex(null);
    }, 400);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    cursorPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  return (
    <section
      className="projects-section"
      ref={handleSectionRef}
      onMouseMove={handleMouseMove}
    >
      {/* Section header */}
      <div className="projects-header">
        <span className="projects-label">Selected Work</span>
        <span className="projects-count">{PROJECTS.length} Projects</span>
      </div>

      {/* Project list */}
      <ul className="projects-list">
        {PROJECTS.map((project, index) => (
          <li
            key={project.id}
            className={`projects-row ${activeIndex === index ? "is-active" : ""} ${activeIndex !== null && activeIndex !== index ? "is-dimmed" : ""}`}
            onMouseEnter={() => handleMouseEnter(project, index)}
            onMouseLeave={handleMouseLeave}
          >
            <div className="projects-row-inner">
              {/* Index number */}
              <span className="projects-row-num">
                {String(index + 1).padStart(2, "0")}
              </span>

              {/* Title — dominant */}
              <h2 className="projects-row-title">{project.title}</h2>

              {/* Metadata — whispers */}
              <div className="projects-row-meta">
                <span className="projects-row-role">{project.role}</span>
                <div className="projects-row-tags">
                  {project.tags.map((tag) => (
                    <span key={tag} className="projects-row-tag">
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="projects-row-year">{project.year}</span>
              </div>

              {/* Arrow */}
              <span className="projects-row-arrow">↗</span>
            </div>

            {/* Divider */}
            <div className="projects-row-divider" />
          </li>
        ))}
      </ul>

      {/* Canvas overlay — only mounted when section is visible */}
      {isCanvasMounted && activeImage && (
        <ProjectHoverCanvas
          imageTexture={activeImage}
          revealProgress={revealProgress.current}
          cursorPos={cursorPos}
        />
      )}
    </section>
  );
}