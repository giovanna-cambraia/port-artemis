"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import styles from "./StatueScene.module.css";

gsap.registerPlugin(ScrollTrigger, Flip, ScrambleTextPlugin);

// ── FLATTENED TEXT ITEMS (from SECTIONS) ──────────────────────────
// Each item gets position/altPosition to flip between.
// The "pos-*" classes map to CSS grid positions defined in the module.
const textItems = [
  // SECTION 0: "HEAD INTO THE ABYSS."
  { text: "HEAD", position: "pos-1", altPosition: "pos-5", flipEase: "expo.inOut", scrambleDuration: 1.2 },
  { text: "INTO THE", position: "pos-2", altPosition: "pos-6", flipEase: "power3.inOut", scrambleDuration: 1.3 },
  { text: "ABYSS.", position: "pos-3", altPosition: "pos-7", isLarge: true, flipEase: "expo.inOut", scrambleDuration: 1.4 },
  { text: "Started with hardware. Ended up everywhere. Embedded systems, backends, the occasional star map.", position: "pos-4", altPosition: "pos-8", flipEase: "sine.inOut", scrambleDuration: 1.1 },
  
  // SECTION 1: "STRUCTURE OR CHAOS."
  { text: "STRUCTURE", position: "pos-9", altPosition: "pos-13", flipEase: "expo.inOut", scrambleDuration: 1.2 },
  { text: "OR", position: "pos-10", altPosition: "pos-14", flipEase: "power3.inOut", scrambleDuration: 1.3 },
  { text: "CHAOS.", position: "pos-11", altPosition: "pos-15", isLarge: true, flipEase: "expo.inOut", scrambleDuration: 1.4 },
  { text: "NestJS · C · TypeScript · ARM. I don't pick tools. I pick the right level of control.", position: "pos-12", altPosition: "pos-16", flipEase: "sine.inOut", scrambleDuration: 1.1 },
  
  // SECTION 2: "AIMED AT ORBIT."
  { text: "AIMED", position: "pos-17", altPosition: "pos-21", flipEase: "expo.inOut", scrambleDuration: 1.2 },
  { text: "AT", position: "pos-18", altPosition: "pos-22", flipEase: "power3.inOut", scrambleDuration: 1.3 },
  { text: "ORBIT.", position: "pos-19", altPosition: "pos-23", isLarge: true, flipEase: "expo.inOut", scrambleDuration: 1.4 },
  { text: "ITA. INPE. Robotics. Space engineering. Every project is a stage in the launch sequence.", position: "pos-20", altPosition: "pos-24", flipEase: "sine.inOut", scrambleDuration: 1.1 },
  
  // SECTION 3: "STILL TRANSMITTING."
  { text: "STILL", position: "pos-25", altPosition: "pos-29", flipEase: "expo.inOut", scrambleDuration: 1.2 },
  { text: "TRANS", position: "pos-26", altPosition: "pos-30", flipEase: "power3.inOut", scrambleDuration: 1.3 },
  { text: "MITTING.", position: "pos-27", altPosition: "pos-31", isLarge: true, flipEase: "expo.inOut", scrambleDuration: 1.4 },
  { text: "Signal ongoing. No end timestamp. // REF: THE REAL YOU", position: "pos-28", altPosition: "pos-32", flipEase: "sine.inOut", scrambleDuration: 1.1 },
];

// ── TEXTGROUP COMPONENT (inline, matches ScrollDemoPage's version) ──
const TextGroup: React.FC<{ items: typeof textItems }> = ({ items }) => {
  return (
    <div className={styles.textGroup}>
      {items.map((item, index) => (
        <span
          key={index}
          className={`${styles.textEl} ${styles[item.position]} ${item.isLarge ? styles.large : ""}`}
          data-alt-pos={item.altPosition}
          data-flip-ease={item.flipEase}
          data-scramble-duration={item.scrambleDuration}
        >
          {item.text}
        </span>
      ))}
    </div>
  );
};

export default function StatueScene() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const glitchOverlayRef = useRef<HTMLDivElement>(null);
  
  // ── REFS FOR SCRAMBLE/FLIP LOGIC ──────────────────────────────────
  const textElementsRef = useRef<NodeListOf<Element> | null>(null);

  // ── SCRAMBLE/FLIP FUNCTIONS (ported from ScrollDemoPage) ──────────
  const storeOriginalText = () => {
    if (!textElementsRef.current) return;
    textElementsRef.current.forEach((el) => {
      const element = el as HTMLElement & { dataset: { text?: string } };
      if (!element.dataset.text) {
        element.dataset.text = element.textContent || "";
      }
    });
  };

  const resetTextElements = () => {
    if (!textElementsRef.current) return;
    textElementsRef.current.forEach((el) => {
      gsap.set(el, {
        clearProps: "transform,opacity,filter",
      });
    });
  };

  const initFlips = () => {
    if (!textElementsRef.current || !wrapperRef.current) return;
    resetTextElements();

    textElementsRef.current.forEach((el) => {
      const element = el as HTMLElement & {
        dataset: { altPos?: string; flipEase?: string };
      };

      const originalClass = [...element.classList].find((c) =>
        c.startsWith("pos-"),
      );
      const targetClass = element.dataset.altPos;
      const flipEase = element.dataset.flipEase || "expo.inOut";

      if (!originalClass || !targetClass) return;

      // Store current position, swap classes
      element.classList.add(targetClass);
      element.classList.remove(originalClass);

      const flipState = Flip.getState(el, {
        props: "opacity, filter, width",
      });

      element.classList.add(originalClass);
      element.classList.remove(targetClass);

      // Flip TO alt position on scroll
      Flip.to(flipState, {
        ease: flipEase,
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: "clamp(bottom bottom-=10%)",
          end: "clamp(center center)",
          scrub: true,
        },
      });

      // Flip FROM alt position back to original
      Flip.from(flipState, {
        ease: flipEase,
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: "clamp(center center)",
          end: "clamp(top top)",
          scrub: true,
        },
      });
    });
  };

  const scramble = (
    el: Element,
    config: { duration?: number; revealDelay?: number } = {},
  ) => {
    const element = el as HTMLElement & {
      dataset: { text?: string; scrambleDuration?: string };
    };

    const text = element.dataset.text ?? element.textContent ?? "";
    const duration =
      config.duration ??
      (element.dataset.scrambleDuration
        ? parseFloat(element.dataset.scrambleDuration)
        : 1);
    const revealDelay = config.revealDelay ?? 0;

    gsap.killTweensOf(el);

    gsap.fromTo(
      el,
      { scrambleText: { text: "", chars: "" } },
      {
        scrambleText: {
          text,
          chars: "upperAndLowerCase",
          revealDelay,
        },
        duration,
      },
    );
  };

  const killScrambleTriggers = () => {
    ScrollTrigger.getAll().forEach((st) => {
      if (st.vars.id === "scramble") {
        st.kill();
      }
    });
  };

  const initScramble = () => {
    if (!textElementsRef.current || !wrapperRef.current) return;
    killScrambleTriggers();

    textElementsRef.current.forEach((el) => {
      ScrollTrigger.create({
        id: "scramble",
        trigger: wrapperRef.current,
        start: "clamp(bottom bottom-=10%)",
        end: "clamp(center center)",
        onEnter: () => scramble(el),
        onEnterBack: () => scramble(el),
      });
    });
  };

  // ── THREE.JS SETUP ──────────────────────────────────────────────────
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

    // ── AMBIENT PARTICLE FIELD ─────────────────────────────────────
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

    // red signal particles
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

      rimBlue.position.x = Math.sin(t * 0.4) * 5;
      rimBlue.position.z = Math.cos(t * 0.4) * 3 - 2;
      rimRed.position.x = Math.cos(t * 0.3) * 4;
      glow.intensity = 10 + Math.sin(t * 1.8) * 4;

      renderer.render(scene, camera);
    };
    animate();

    // ── INIT SCRAMBLE/FLIP (after DOM is ready) ─────────────────────
    const initTextAnimations = () => {
      if (contentRef.current) {
        textElementsRef.current = contentRef.current.querySelectorAll(`.${styles.textEl}`);
        storeOriginalText();
        initFlips();
        initScramble();
      }
    };

    // Small delay to ensure DOM is rendered
    const textInitTimer = setTimeout(initTextAnimations, 50);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      ScrollTrigger.refresh(true);
      
      // Re-init flips and scramble on resize
      if (contentRef.current) {
        textElementsRef.current = contentRef.current.querySelectorAll(`.${styles.textEl}`);
        storeOriginalText();
        initFlips();
        initScramble();
      }
    };
    window.addEventListener("resize", onResize);

    return () => {
      clearTimeout(textInitTimer);
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
        {[0, 1, 2, 3].map((_, i) => (
          <span
            key={i}
            ref={(el) => {
              dotRefs.current[i] = el;
            }}
            className={styles.navDot}
          />
        ))}
      </div>

      {/* ── REPLACED TEXT CONTENT ───────────────────────────────────── */}
      <div className={styles.content} ref={contentRef}>
        <TextGroup items={textItems} />
      </div>
    </div>
  );
}