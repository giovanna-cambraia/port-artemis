"use client";

import { Suspense, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Canvas } from "@react-three/fiber";
import { Environment, useGLTF } from "@react-three/drei";
import "./StatueScene.css";

gsap.registerPlugin(ScrollTrigger);

const MODEL_PATH = "/models/marble_torso_from_a_statue_of_dionysos.glb";

function DionysosModel() {
  const { scene } = useGLTF(MODEL_PATH);
  return <primitive object={scene} />;
}

useGLTF.preload(MODEL_PATH);

// ── TIMELINE DATA ──────────────────────────────────────────────────
const timelineEntries = [
  {
    date: "2018",
    title: "First Line of Code",
    description:
      "Started with hardware. Ended up everywhere. Embedded systems, backends, the occasional star map.",
    img: "/images/timeline-1.jpg",
  },
  {
    date: "2020",
    title: "Structure or Chaos",
    description:
      "NestJS · C · TypeScript · ARM. I don't pick tools. I pick the right level of control.",
    img: "/images/timeline-2.jpg",
  },
  {
    date: "2022",
    title: "Aimed at Orbit",
    description:
      "ITA. INPE. Robotics. Space engineering. Every project is a stage in the launch sequence.",
    img: "/images/timeline-3.jpg",
  },
  {
    date: "2026",
    title: "Still Transmitting",
    description: "Signal ongoing. No end timestamp.",
    img: "/images/timeline-4.jpg",
  },
];

// ── "BUILT WITH" LOG (replaces the ingredients log) ─────────────────
const stackLog = [
  {
    qty: "6+",
    label: "TypeScript & NestJS",
    text: "Backend services built for scale and clarity.",
  },
  {
    qty: "4+",
    label: "Embedded C",
    text: "Firmware close to the metal, where it counts.",
  },
  {
    qty: "3",
    label: "Space Projects",
    text: "ITA, INPE, and orbital robotics work.",
  },
  {
    qty: "2",
    label: "React + NestJS",
    text: "Front-ends paired with APIs that don't fall over.",
  },
  {
    qty: "∞",
    label: "Curiosity",
    text: "Still learning, still transmitting.",
  },
];

export default function StatueScene() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const headerHeightRef = useRef(0);

  useEffect(() => {
    const header = wrapperRef.current?.querySelector(
      "header",
    ) as HTMLElement | null;
    headerHeightRef.current = header ? header.offsetHeight - 1 : 0;

    // ── MOBILE NAV TOGGLE ────────────────────────────────────────────
    const hamburger = wrapperRef.current?.querySelector(".hamburger");
    const mobileMenu = wrapperRef.current?.querySelector(".mobile-nav");
    const onHamburgerClick = () => mobileMenu?.classList.toggle("show");
    hamburger?.addEventListener("click", onHamburgerClick);

    // ── REUSABLE PIN + ANIMATE HELPER (ported from main.js) ─────────
    function pinAndAnimate({
      trigger,
      endTrigger,
      pin,
      animations,
      markers = false,
    }: {
      trigger: string;
      endTrigger: string;
      pin: string;
      animations: { target: string; vars: gsap.TweenVars }[];
      markers?: boolean;
    }) {
      const headerOffset = headerHeightRef.current;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger,
          start: `top top+=${headerOffset}`,
          endTrigger,
          end: `top top+=${headerOffset}`,
          scrub: true,
          pin,
          pinSpacing: false,
          markers,
          invalidateOnRefresh: true,
        },
      });

      animations.forEach(({ target, vars }) => {
        tl.to(target, vars, 0);
      });

      return tl;
    }

    const ctx = gsap.context(() => {
      // ── INITIAL LOAD-IN (ported from runInitialAnimations) ────────
      const onLoadTl = gsap.timeline({ defaults: { ease: "power2.out" } });
      onLoadTl
        .to("header", { "--border-width": "100%", duration: 3 }, 0)
        .from(
          ".desktop-nav a, .social-sidebar a",
          {
            y: -100,
            opacity: 0,
            duration: 0.8,
            stagger: 0.2,
            ease: "power3.out",
          },
          0,
        )
        .to(".social-sidebar", { "--border-height": "100%", duration: 10 }, 0)
        .to(".about-hero-content h1", { opacity: 1, duration: 1 }, 0)
        .to(
          ".about-hero-content h1",
          {
            delay: 0.5,
            duration: 1.2,
            color: "var(--accent)",
            "-webkit-text-stroke": "0px var(--accent)",
          },
          0,
        )
        .from(
          ".about-hero-content .line",
          {
            x: 100,
            delay: 1,
            opacity: 0,
            duration: 0.8,
            stagger: 0.2,
            ease: "power3.out",
          },
          0,
        )
        .to(
          ".about-portrait-wrapper",
          {
            opacity: 1,
            scale: 1,
            delay: 1.5,
            duration: 1.3,
            ease: "power3.out",
          },
          0,
        )
        .to(
          ".about-stamp",
          {
            opacity: 1,
            scale: 1,
            delay: 2,
            duration: 0.2,
            ease: "back.out(3)",
          },
          0,
        )
        .to(
          ".about-stamp",
          {
            y: "+=5",
            x: "-=3",
            repeat: 2,
            yoyo: true,
            duration: 0.05,
            ease: "power1.inOut",
          },
          0,
        );

      // ── SCROLL-DRIVEN PIN CHAIN ──────────────────────────────────
      ScrollTrigger.matchMedia({
        "(min-width: 769px)": function () {
          pinAndAnimate({
            trigger: ".about-hero",
            endTrigger: ".about-intro",
            pin: ".about-portrait-wrapper",
            animations: [
              { target: ".about-portrait", vars: { rotate: 0, scale: 0.8 } },
            ],
          });

          pinAndAnimate({
            trigger: ".about-intro",
            endTrigger: ".timeline-entry:nth-child(even)",
            pin: ".about-portrait-wrapper",
            animations: [
              { target: ".about-portrait", vars: { rotate: 8, scale: 0.65 } },
              { target: ".about-portrait-wrapper", vars: { x: "30%" } },
            ],
          });

          pinAndAnimate({
            trigger: ".timeline-entry:nth-child(even)",
            endTrigger: ".timeline-entry:nth-child(odd)",
            pin: ".about-portrait-wrapper",
            animations: [
              { target: ".about-portrait", vars: { rotate: -8, scale: 0.65 } },
              { target: ".about-portrait-wrapper", vars: { x: "-25%" } },
            ],
          });
        },

        "(max-width: 768px)": function () {
          gsap.to(".about-portrait-wrapper", {
            opacity: 1,
            duration: 1,
            delay: 0.5,
          });
        },
      });

      // ── TIMELINE ENTRY REVEALS ────────────────────────────────────
      gsap.utils.toArray<HTMLElement>(".timeline-entry").forEach((entry) => {
        gsap.from(entry.querySelectorAll(".timeline-right > *"), {
          y: 40,
          opacity: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: entry,
            start: "top 75%",
            toggleActions: "play none none reverse",
          },
        });
      });

      ScrollTrigger.refresh();
    }, wrapperRef);

    return () => {
      hamburger?.removeEventListener("click", onHamburgerClick);
      ctx.revert();
    };
  }, []);

  return (
    <div ref={wrapperRef} className="statue-scene" id="smooth-wrapper">
      <main id="smooth-content">
        <div className="about-portrait-wrapper">
          <div className="about-portrait">
            <Canvas camera={{ position: [0, 0, 3.2], fov: 35 }} dpr={[1, 2]}>
              <ambientLight intensity={0.7} />
              <directionalLight position={[3, 5, 2]} intensity={1.4} />
              <directionalLight position={[-3, -1, -2]} intensity={0.3} />
              <Suspense fallback={null}>
                <DionysosModel />
                <Environment preset="studio" />
              </Suspense>
            </Canvas>
          </div>
        </div>

        <section className="about-hero vintage-hero">
          <div className="about-hero-content">
            <div className="about-stamp">EST. 2018</div>
            <h1>
              <span className="line">Head Into</span>
              <span className="line highlight">The Story</span>
            </h1>
          </div>
        </section>

        <section className="about-intro" id="work">
          <div className="intro-grid">
            <div className="intro-left">
              <p className="small-title">About Me</p>
              <h2 className="main-heading">Who I Am</h2>
              <p className="description">
                A short bio goes here — background, focus areas, and what drives
                the work. Keep it a couple of sentences; the timeline below does
                the storytelling.
              </p>
              <a href="#timeline" className="cta-box">
                See the Timeline
              </a>
            </div>

            <div className="intro-right">
              <div className="stack-log">
                <h3 className="stack-title">Built With</h3>

                {stackLog.map((item, i) => (
                  <div className="stack-item" key={i}>
                    <div className="stack-qty">{item.qty}</div>
                    <div className="stack-text">
                      <strong>{item.label}</strong>
                      <p>{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="timeline-section" id="timeline">
          <h2 className="timeline-main-title">My Timeline</h2>

          {timelineEntries.map((entry, i) => (
            <div className="timeline-entry" key={i}>
              <div className="timeline-left">
                <div className="timeline-date">{entry.date}</div>
                <img
                  src={entry.img}
                  alt={entry.title}
                  className="timeline-img"
                />
              </div>

              <div className="timeline-right">
                <h3 className="timeline-title">{entry.title}</h3>
                <p className="timeline-description">{entry.description}</p>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
