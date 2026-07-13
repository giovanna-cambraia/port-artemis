"use client";

import { Suspense, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { dionysosVert, dionysosFrag, uniforms } from "./shaders/dionysosShaders";
import "./StatueScene.css";

gsap.registerPlugin(ScrollTrigger);

const MODEL_PATH = "/models/marble_torso_from_a_statue_of_dionysos.glb";



const portraitState = {
  rotationY: 0,
  scale: 0.8,
};

function DionysosModel() {
  const { scene } = useGLTF(MODEL_PATH);
  const groupRef = useRef<THREE.Group>(null);
  const fitted = useRef(false);

  useEffect(() => {
    if (!groupRef.current || fitted.current) return;

    const box = new THREE.Box3().setFromObject(groupRef.current);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const targetSize = 3.0;

    if (maxDim > 0) {
      const fitScale = targetSize / maxDim;
      groupRef.current.position.sub(center.clone().multiplyScalar(fitScale));
      groupRef.current.scale.set(fitScale, fitScale, fitScale);
      groupRef.current.userData.baseScale = fitScale;
    }
    fitted.current = true;

    groupRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = new THREE.ShaderMaterial({
          uniforms,
          vertexShader: dionysosVert,
          fragmentShader: dionysosFrag,
          transparent: true,
          side: THREE.DoubleSide,
        });
      }
    });

    gsap.fromTo(
      uniforms.uProgress,
      { value: 0 },
      {
        value: 1,
        duration: 2.4,
        ease: "power2.out",
      },
    );
  }, [scene]);

  useFrame(({ camera }) => {
    if (!groupRef.current) return;

    uniforms.uTime.value = performance.now() / 1000;
    uniforms.uCameraPos.value.copy(camera.position);

    const base = groupRef.current.userData.baseScale ?? 1;
    const s = base * portraitState.scale;
    groupRef.current.scale.set(s, s, s);
    groupRef.current.rotation.y = portraitState.rotationY;
  });

  return <primitive ref={groupRef} object={scene} />;
}

useGLTF.preload(MODEL_PATH);

// ── TIMELINE DATA ──────────────────────────────────────────────────
const timelineEntries = [
  {
    date: "2018",
    title: "First Line of Code",
    description:
      "Started with hardware. Ended up everywhere. Embedded systems, backends, the occasional star map.",
  },
  {
    date: "2020",
    title: "Structure or Chaos",
    description:
      "NestJS · C · TypeScript · ARM. I don't pick tools. I pick the right level of control.",
  },
  {
    date: "2022",
    title: "Aimed at Orbit",
    description:
      "ITA. INPE. Robotics. Space engineering. Every project is a stage in the launch sequence.",
  },
  {
    date: "2026",
    title: "Still Transmitting",
    description: "Signal ongoing. No end timestamp.",
  },
];

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

    const hamburger = wrapperRef.current?.querySelector(".hamburger");
    const mobileMenu = wrapperRef.current?.querySelector(".mobile-nav");
    const onHamburgerClick = () => mobileMenu?.classList.toggle("show");
    hamburger?.addEventListener("click", onHamburgerClick);

    const ctx = gsap.context(() => {
      gsap.set(".about-portrait-wrapper", { xPercent: -50 });

      const onLoadTl = gsap.timeline({
        defaults: { ease: "power2.out" },
      });

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
        .fromTo(
          ".about-portrait-wrapper",
          { x: "0vw" },
          {
            x: "22vw",
            opacity: 1,
            scale: 1,
            delay: 1.5,
            duration: 1.3,
            ease: "power3.out",
          },
          0,
        )
        .to(portraitState, { rotationY: 0, scale: 1 }, 0)
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

      // ── PIN 1: Hero → Intro ──────────────────────────────────────────
      const heroToIntroTl = gsap.timeline({
        scrollTrigger: {
          trigger: ".about-hero",
          start: `top top+=${headerHeightRef.current}`,
          endTrigger: ".about-intro",
          end: `top top+=${headerHeightRef.current}`,
          scrub: true,
          pin: ".about-portrait-wrapper",
          pinSpacing: false,
          invalidateOnRefresh: true,
          markers: false,
        },
      });

      heroToIntroTl.to(portraitState, { rotationY: 0, scale: 0.8 }, 0);
      heroToIntroTl.to(".about-portrait-wrapper", { x: "0vw" }, 0);

      // ── PIN 2: Intro → Timeline End ──────────────────────────────────
      // Extends pinning across the entire timeline journey
      const introToTimelineTl = gsap.timeline({
        scrollTrigger: {
          trigger: ".about-intro",
          start: `top top+=${headerHeightRef.current}`,
          endTrigger: ".timeline-section",
          end: "bottom bottom",
          scrub: true,
          pin: ".about-portrait-wrapper",
          pinSpacing: false,
          invalidateOnRefresh: true,
          markers: false,
        },
      });

      // ── CONTINUOUS ROTATION DRIVER ────────────────────────────────
      ScrollTrigger.create({
        trigger: wrapperRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5,
        onUpdate: (self) => {
          portraitState.rotationY = self.progress * Math.PI * 2.2;
        },
      });

      const entries = gsap.utils.toArray<HTMLElement>(".timeline-entry");

      entries.forEach((entry, i) => {
        const side = i % 2 === 0 ? "side-left" : "side-right";
        entry.classList.add(side);

        const xTarget = i % 2 === 0 ? "22vw" : "-22vw";

        ScrollTrigger.create({
          trigger: entry,
          start: "top top",
          end: "bottom top",
          onToggle: (self) => {
            entry.classList.toggle("active", self.isActive);

            if (self.isActive) {
              gsap.to(".about-portrait-wrapper", {
                x: xTarget,
                duration: 0.6,
                ease: "power2.out",
              });
              gsap.to(portraitState, {
                scale: 0.8,
                duration: 0.6,
                ease: "power2.out",
              });

              const beat = self.progress * 4;
              const localBeat = beat % 1;
              const dissolveDip = localBeat < 0.15 ? 1 - localBeat / 0.15 : 0;

              gsap.to(uniforms.uProgress, {
                value: 1 - dissolveDip * 0.85,
                duration: 0.3,
                overwrite: "auto",
              });
            }
          },
          onEnter: () => {
            gsap.to(".about-portrait-wrapper", {
              x: xTarget,
              duration: 0.6,
              ease: "power2.out",
            });
            gsap.to(portraitState, {
              scale: 0.8,
              duration: 0.6,
              ease: "power2.out",
            });
          },
          onEnterBack: () => {
            gsap.to(".about-portrait-wrapper", {
              x: xTarget,
              duration: 0.6,
              ease: "power2.out",
            });
            gsap.to(portraitState, {
              scale: 0.8,
              duration: 0.6,
              ease: "power2.out",
            });
          },
        });
      });

      entries.forEach((entry) => {
        const textElements = entry.querySelectorAll(".timeline-right > *");
        gsap.from(textElements, {
          y: 40,
          opacity: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: entry,
            start: "top center",
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
            <Canvas
              camera={{ position: [0, 0, 5], fov: 45 }}
              dpr={[1, 2]}
              style={{ background: "transparent" }}
            >
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

            <div className="intro-center">{/* Empty spacer column */}</div>

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
          {timelineEntries.map((entry, i) => (
            <div className="timeline-entry-outer" key={i}>
              <div className="timeline-entry">
                <div className="timeline-right">
                  <div className="timeline-date">{entry.date}</div>
                  <h3 className="timeline-title">{entry.title}</h3>
                  <p className="timeline-description">{entry.description}</p>
                </div>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
