"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./StatueScene.module.css";

gsap.registerPlugin(ScrollTrigger);

const SECTIONS = [
  {
    signal: "SIGNAL_01 // ORIGIN",
    coords: "23.4°S 45.5°W",
    headline: ["HEAD", "INTO THE", "ABYSS."],
    body: "Started with hardware.\nEnded up everywhere.\nEmbedded systems, backends,\nthe occasional star map.",
    side: "left",
  },
  {
    signal: "SIGNAL_02 // CRAFT",
    coords: "[ENCRYPTED]",
    headline: ["STRUCTURE", "OR", "CHAOS."],
    body: "NestJS · C · TypeScript · ARM.\nI don't pick tools.\nI pick the right level\nof control.",
    side: "right",
  },
  {
    signal: "SIGNAL_03 // TRAJECTORY",
    coords: "ALT. 408KM",
    headline: ["AIMED", "AT", "ORBIT."],
    body: "ITA. INPE. Robotics.\nSpace engineering.\nEvery project is a stage\nin the launch sequence.",
    side: "left",
  },
  {
    signal: "SIGNAL_04 // NOW",
    coords: "ONGOING",
    headline: ["STILL", "TRANS", "MITTING."],
    body: "Signal ongoing.\nNo end timestamp.\n\n// REF: THE REAL YOU",
    side: "right",
  },
] as const;

export default function StatueScene() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const maskRefs = useRef<(HTMLDivElement | null)[]>([]);
  const signalRefs = useRef<(HTMLDivElement | null)[]>([]);
  const coordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const lineWrapRefs = useRef<(HTMLDivElement | null)[][]>([[], [], [], []]);
  const bodyRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const numRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const glitchOverlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !wrapperRef.current) return;

    // ── RENDERER ──────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.8;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    canvasRef.current.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      38,
      window.innerWidth / window.innerHeight,
      0.1,
      200,
    );
    camera.position.set(0, 0, 6.5);

    // ── LIGHTS ────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 1.0));

    const keyLight = new THREE.DirectionalLight(0xffffff, 8);
    keyLight.position.set(1, 3, 6);
    scene.add(keyLight);

    const rimBlue = new THREE.DirectionalLight(0x88ccff, 5);
    rimBlue.position.set(-5, 2, -2);
    scene.add(rimBlue);

    const rimRed = new THREE.DirectionalLight(0xff3300, 4);
    rimRed.position.set(4, -2, -3);
    scene.add(rimRed);

    const topLight = new THREE.DirectionalLight(0xffffff, 4);
    topLight.position.set(0, 8, 1);
    scene.add(topLight);

    const glow = new THREE.PointLight(0xffffff, 12, 5);
    glow.position.set(0, 1, 3);
    scene.add(glow);

    // ── AMBIENT PARTICLE FIELD — depth + life ─────────────────────
    const particleCount = 400;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 16;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
      particleSpeeds[i] = Math.random() * 0.3 + 0.05;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3),
    );
    const particleMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.018,
      transparent: true,
      opacity: 0.4,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // red signal particles — sparse, bright
    const redCount = 30;
    const redPositions = new Float32Array(redCount * 3);
    for (let i = 0; i < redCount; i++) {
      redPositions[i * 3] = (Math.random() - 0.5) * 12;
      redPositions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      redPositions[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;
    }
    const redGeo = new THREE.BufferGeometry();
    redGeo.setAttribute("position", new THREE.BufferAttribute(redPositions, 3));
    const redMat = new THREE.PointsMaterial({
      color: 0xe03030,
      size: 0.035,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
    });
    const redParticles = new THREE.Points(redGeo, redMat);
    scene.add(redParticles);

    // ── MODEL ─────────────────────────────────────────────────────
    const group = new THREE.Group();
    scene.add(group);
    let modelLoaded = false;

    const loader = new GLTFLoader();
    loader.load(
      "/models/marble_torso_from_a_statue_of_dionysos.glb",
      (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        model.position.sub(center);
        model.scale.setScalar(4.2 / maxDim);

        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.material = new THREE.MeshStandardMaterial({
              color: 0x888888,
              metalness: 0.9,
              roughness: 0.15,
              envMapIntensity: 2,
            });
          }
        });

        group.add(model);
        modelLoaded = true;

        group.position.y = -2.5;
        group.scale.setScalar(0.3);
        gsap.to(group.position, { y: 0, duration: 2.2, ease: "power3.out" });
        gsap.to(group.scale, {
          x: 1,
          y: 1,
          z: 1,
          duration: 2.2,
          ease: "power3.out",
        });
      },
      undefined,
      (err) => console.error("GLB error:", err),
    );

    // ── CANVAS VISIBILITY ─────────────────────────────────────────
    const canvasEl = canvasRef.current;
    ScrollTrigger.create({
      trigger: wrapperRef.current,
      start: "top bottom",
      end: "bottom top",
      onEnter: () => gsap.to(canvasEl, { opacity: 1, duration: 0.6 }),
      onLeave: () => gsap.to(canvasEl, { opacity: 0, duration: 0.6 }),
      onEnterBack: () => gsap.to(canvasEl, { opacity: 1, duration: 0.6 }),
      onLeaveBack: () => gsap.to(canvasEl, { opacity: 0, duration: 0.6 }),
    });

    // ── SCROLL → ROTATION + CAMERA DOLLY ──────────────────────────
    const targetRot = { y: -0.4 };
    const targetCam = { z: 6.5, x: 0, fov: 38 };
    const targetTilt = { z: 0 };

    ScrollTrigger.create({
      trigger: wrapperRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: 2,
      onUpdate: (self) => {
        const p = self.progress;
        targetRot.y = -0.4 + p * Math.PI * 2.2;

        // camera dolly in/out per section for dynamism
        const beat = p * 4;
        const localBeat = beat % 1;
        targetCam.z = 6.5 - Math.sin(localBeat * Math.PI) * 1.2;
        targetCam.x = Math.sin(p * Math.PI * 2) * 0.4;
        targetTilt.z = Math.sin(p * Math.PI * 3) * 0.025;

        // progress bar
        if (progressBarRef.current) {
          progressBarRef.current.style.transform = `scaleX(${p})`;
        }
        // active dot
        const activeBeat = Math.min(3, Math.floor(p * 4));
        dotRefs.current.forEach((d, i) => {
          if (!d) return;
          d.classList.toggle(styles.dotActive, i === activeBeat);
        });
      },
    });

    // ── GLITCH PULSE ON SECTION CHANGE ─────────────────────────────
    let lastBeat = -1;
    const glitchEl = glitchOverlayRef.current;
    ScrollTrigger.create({
      trigger: wrapperRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        const beat = Math.min(3, Math.floor(self.progress * 4));
        if (beat !== lastBeat && lastBeat !== -1 && glitchEl) {
          gsap.fromTo(
            glitchEl,
            { opacity: 0.5 },
            { opacity: 0, duration: 0.35, ease: "power2.out" },
          );
        }
        lastBeat = beat;
      },
    });

    // ── TEXT ANIMATIONS — masked reveals, longer choreography ──────
    SECTIONS.forEach((section, i) => {
      const mask = maskRefs.current[i];
      const signal = signalRefs.current[i];
      const coord = coordRefs.current[i];
      const lines = lineWrapRefs.current[i];
      const body = bodyRefs.current[i];
      const num = numRefs.current[i];
      const isLeft = section.side === "left";
      const wrap = wrapperRef.current!;

      const pct = (v: number) => `${v}%`;
      const s = i * 25;
      const e = (i + 1) * 25;

      // ---- ENTRANCE (first 12% of this beat) ----
      const inA = pct(s);
      const inB = pct(s + 5);
      const inC = pct(s + 9);
      const inD = pct(s + 12);

      // signal label — typewriter-ish slide + scale flicker
      gsap.fromTo(
        signal,
        { opacity: 0, x: isLeft ? -30 : 30, letterSpacing: "0.5em" },
        {
          opacity: 1,
          x: 0,
          letterSpacing: "0.22em",
          scrollTrigger: { trigger: wrap, start: inA, end: inB, scrub: true },
        },
      );

      // coords — delayed flicker in
      gsap.fromTo(
        coord,
        { opacity: 0 },
        {
          opacity: 1,
          scrollTrigger: {
            trigger: wrap,
            start: pct(s + 2),
            end: pct(s + 6),
            scrub: true,
          },
        },
      );

      // headline lines — masked reveal (clip-path wipe) + stagger + slight rotation
      lines.forEach((lineWrap, j) => {
        if (!lineWrap) return;
        const inner = lineWrap.querySelector(`.${styles.headlineLine}`);
        const lineDelayStart = s + 1 + j * 2.2;

        // mask wipe on the wrapper
        gsap.fromTo(
          lineWrap,
          { clipPath: isLeft ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)" },
          {
            clipPath: "inset(0 0% 0 0)",
            scrollTrigger: {
              trigger: wrap,
              start: pct(lineDelayStart),
              end: pct(lineDelayStart + 3.5),
              scrub: true,
            },
          },
        );
        // inner text counter-slides + rotates for depth
        gsap.fromTo(
          inner,
          { x: isLeft ? -40 : 40, rotateZ: isLeft ? -3 : 3, opacity: 0.3 },
          {
            x: 0,
            rotateZ: 0,
            opacity: 1,
            scrollTrigger: {
              trigger: wrap,
              start: pct(lineDelayStart),
              end: pct(lineDelayStart + 3.5),
              scrub: true,
            },
          },
        );
      });

      // body — fade + slide, delayed after headline
      gsap.fromTo(
        body,
        { opacity: 0, y: 24, x: isLeft ? 20 : -20 },
        {
          opacity: 1,
          y: 0,
          x: 0,
          scrollTrigger: {
            trigger: wrap,
            start: pct(s + 10),
            end: inD,
            scrub: true,
          },
        },
      );

      // number — counts up feel via opacity + scale pop
      gsap.fromTo(
        num,
        { opacity: 0, scale: 1.6 },
        {
          opacity: 1,
          scale: 1,
          scrollTrigger: {
            trigger: wrap,
            start: pct(s + 8),
            end: pct(s + 13),
            scrub: true,
          },
        },
      );

      // ---- HOLD (middle ~60%) — nothing, stays visible ----

      // ---- EXIT (last 10% of this beat) ----
      const outA = pct(e - 10);
      const outB = pct(e - 5);
      const outC = pct(e);

      gsap.fromTo(
        [signal, coord],
        { opacity: 1 },
        {
          opacity: 0,
          scrollTrigger: { trigger: wrap, start: outA, end: outB, scrub: true },
        },
      );

      lines.forEach((lineWrap, j) => {
        if (!lineWrap) return;
        const inner = lineWrap.querySelector(`.${styles.headlineLine}`);
        gsap.fromTo(
          lineWrap,
          { clipPath: "inset(0 0% 0 0)" },
          {
            clipPath: isLeft ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)",
            scrollTrigger: {
              trigger: wrap,
              start: pct(e - 9 + j * 1),
              end: pct(e - 5 + j * 1),
              scrub: true,
            },
          },
        );
        gsap.fromTo(
          inner,
          { x: 0, opacity: 1 },
          {
            x: isLeft ? 50 : -50,
            opacity: 0,
            scrollTrigger: {
              trigger: wrap,
              start: pct(e - 9 + j * 1),
              end: pct(e - 5 + j * 1),
              scrub: true,
            },
          },
        );
      });

      gsap.fromTo(
        body,
        { opacity: 1, y: 0 },
        {
          opacity: 0,
          y: -16,
          scrollTrigger: { trigger: wrap, start: outA, end: outB, scrub: true },
        },
      );
      gsap.fromTo(
        num,
        { opacity: 1 },
        {
          opacity: 0,
          scrollTrigger: { trigger: wrap, start: outB, end: outC, scrub: true },
        },
      );
    });

    // ── MOUSE PARALLAX ──────────────────────────────────────────────
    const mouse = { x: 0, y: 0 };
    const onMouse = (e: MouseEvent) => {
      mouse.x = e.clientX / window.innerWidth - 0.5;
      mouse.y = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("mousemove", onMouse);

    // ── RENDER LOOP ───────────────────────────────────────────────
    let rafId: number;
    const clock = new THREE.Clock();
    let curY = -0.4,
      curX = 0,
      curCamZ = 6.5,
      curCamX = 0,
      curTiltZ = 0;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      curY += (targetRot.y - curY) * 0.045;
      curX += (mouse.y * 0.12 - curX) * 0.05;
      curCamZ += (targetCam.z - curCamZ) * 0.05;
      curCamX += (targetCam.x - curCamX) * 0.04;
      curTiltZ += (targetTilt.z - curTiltZ) * 0.04;

      if (modelLoaded) {
        group.rotation.y = curY + mouse.x * 0.08;
        group.rotation.x = curX;
        group.position.y = Math.sin(t * 0.5) * 0.07;
      }

      camera.position.z = curCamZ;
      camera.position.x = curCamX + mouse.x * 0.15;
      camera.rotation.z = curTiltZ;
      camera.lookAt(0, 0, 0);

      // particle drift
      const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        posAttr.array[idx + 1] += particleSpeeds[i] * 0.003;
        if (posAttr.array[idx + 1] > 6) posAttr.array[idx + 1] = -6;
      }
      posAttr.needsUpdate = true;
      particles.rotation.y = t * 0.01;

      redParticles.rotation.y = -t * 0.02;
      (redMat as THREE.PointsMaterial).opacity = 0.6 + Math.sin(t * 2) * 0.25;

      // orbit colored lights
      rimBlue.position.x = Math.sin(t * 0.4) * 5;
      rimBlue.position.z = Math.cos(t * 0.4) * 3 - 2;
      rimRed.position.x = Math.cos(t * 0.3) * 4;
      glow.intensity = 10 + Math.sin(t * 1.8) * 4;

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("resize", onResize);
      ScrollTrigger.getAll().forEach((t) => t.kill());
      renderer.dispose();
      if (canvasRef.current?.contains(renderer.domElement)) {
        canvasRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <div ref={canvasRef} className={styles.canvas} style={{ opacity: 0 }} />
      <div className={styles.noise} />
      <div className={styles.chromaLine} />
      <div ref={glitchOverlayRef} className={styles.glitchOverlay} />

      {/* progress bar */}
      <div className={styles.progressTrack}>
        <div ref={progressBarRef} className={styles.progressFill} />
      </div>

      {/* dot nav */}
      <div className={styles.dotNav}>
        {SECTIONS.map((_, i) => (
          <span
            key={i}
            ref={(el) => {
              dotRefs.current[i] = el;
            }}
            className={styles.navDot}
          />
        ))}
      </div>

      <div className={styles.content}>
        {SECTIONS.map((section, i) => (
          <div
            key={i}
            className={`${styles.section} ${section.side === "right" ? styles.sectionRight : styles.sectionLeft}`}
          >
            <div className={styles.textBlock}>
              <div
                ref={(el) => {
                  signalRefs.current[i] = el;
                }}
                className={styles.signal}
              >
                <span className={styles.signalDash}>——</span>
                {section.signal}
                <span
                  ref={(el) => {
                    coordRefs.current[i] = el;
                  }}
                  className={styles.coords}
                >
                  {section.coords}
                </span>
              </div>

              <h2 className={styles.headline}>
                {section.headline.map((line, j) => (
                  <div
                    key={j}
                    ref={(el) => {
                      lineWrapRefs.current[i][j] = el;
                    }}
                    className={styles.lineMask}
                  >
                    <span className={styles.headlineLine}>{line}</span>
                  </div>
                ))}
              </h2>

              <p
                ref={(el) => {
                  bodyRefs.current[i] = el;
                }}
                className={styles.body}
              >
                {section.body.split("\n").map((line, j) => (
                  <span key={j}>
                    {line}
                    <br />
                  </span>
                ))}
              </p>
            </div>

            <div className={styles.statueSide} />

            <span
              ref={(el) => {
                numRefs.current[i] = el;
              }}
              className={styles.sectionNum}
            >
              0{i + 1} <span className={styles.numSlash}>/</span> 0
              {SECTIONS.length}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
