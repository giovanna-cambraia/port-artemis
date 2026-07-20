"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./ScrollSection.module.css";

gsap.registerPlugin(ScrollTrigger);

// ─── CUSTOM SHADERS ──────────────────────────────────────────

const VignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    intensity: { value: 0.65 },
    roundness: { value: 0.8 },
    smoothness: { value: 0.4 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float intensity;
    uniform float roundness;
    uniform float smoothness;
    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      vec2 center = vUv - 0.5;
      float dist = length(center);
      float vignette = smoothstep(roundness, roundness - smoothness, dist);
      vignette = mix(1.0, vignette, intensity);
      gl_FragColor = vec4(color.rgb * vignette, color.a);
    }
  `,
};

const ChromaticAberrationShader = {
  uniforms: {
    tDiffuse: { value: null },
    intensity: { value: 0.002 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float intensity;
    varying vec2 vUv;

    void main() {
      vec2 offset = (vUv - 0.5) * intensity;
      float r = texture2D(tDiffuse, vUv + offset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - offset).b;
      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `,
};

const GrainShader = {
  uniforms: {
    tDiffuse: { value: null },
    intensity: { value: 0.035 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float intensity;
    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float grain = hash(vUv + fract(vec2(float(gl_FragCoord.x), float(gl_FragCoord.y)) * 0.5));
      grain = (grain - 0.5) * intensity;
      gl_FragColor = vec4(color.rgb + grain, color.a);
    }
  `,
};

// ─── BEATS DATA ──────────────────────────────────────────────

const BEATS = [
  {
    signal: "SIGNAL_01",
    tag: "ORIGIN",
    headline: "BORN IN\nTHE NOISE.",
    sub: "Started with hardware.\nEnded up everywhere.\nEmbedded systems, backends,\nthe occasional star map.",
  },
  {
    signal: "SIGNAL_02",
    tag: "OBSESSION",
    headline: "WHY\nSYSTEMS.",
    sub: "Code is just physics\nat a higher abstraction.\nI build things that run\nclose to the metal — and feel it.",
  },
  {
    signal: "SIGNAL_03",
    tag: "METHOD",
    headline: "STRUCTURE\nOR CHAOS.",
    sub: "NestJS · C · TypeScript.\nBare-metal ARM.\nI don't pick tools.\nI pick the right level of control.",
  },
  {
    signal: "SIGNAL_04",
    tag: "TRAJECTORY",
    headline: "AIMED AT\nORBIT.",
    sub: "ITA. INPE. Robotics.\nSpace engineering.\nEvery project is a stage\nin the launch sequence.",
  },
];

// ─── CAMERA WAYPOINTS ────────────────────────────────────────
const CAMERA_WAYPOINTS = [
  { x: 0, y: 0, z: 20, rotY: 0 },
  { x: -4, y: 1.5, z: 14, rotY: 0.15 },
  { x: 3, y: -1, z: 10, rotY: -0.2 },
  { x: 0, y: 2, z: 7, rotY: 0.05 },
];

// ─── BEAT COLORS ─────────────────────────────────────────────
const BEAT_COLORS = [0xff3030, 0xff6a30, 0x30aaff, 0xffffff];

// ─── CLUSTER FORMATIONS ──────────────────────────────────────
// Precompute target formations for each beat
function generateFormation(beatIdx: number, count: number) {
  const positions: { x: number; y: number; z: number }[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + beatIdx * 0.5;
    let radius: number;
    let height: number;
    let spread: number;

    // Different formations per beat
    switch (beatIdx) {
      case 0: // Scattered
        radius = Math.random() * 4 + 2;
        height = (Math.random() - 0.5) * 6;
        spread = (Math.random() - 0.5) * 4;
        break;
      case 1: // Converging
        radius = 2.5 + Math.sin(angle * 2) * 1.5;
        height = Math.sin(angle * 3) * 1.5;
        spread = 0;
        break;
      case 2: // Ring
        radius = 3.5;
        height = Math.sin(angle * 2) * 1.2;
        spread = 0;
        break;
      case 3: // Tight core
        radius = 1.5 + Math.sin(angle * 4) * 0.5;
        height = Math.sin(angle * 3) * 0.6;
        spread = 0;
        break;
      default:
        radius = 3;
        height = 0;
        spread = 0;
    }

    positions.push({
      x: Math.cos(angle) * radius + spread * 0.3,
      y: height,
      z: Math.sin(angle) * radius + spread * 0.3,
    });
  }
  return positions;
}

// ─── COMPONENT ─────────────────────────────────────────────────

export default function ScrollSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const leftRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rightRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [webglSupported, setWebglSupported] = useState(true);
  const isBrowser = typeof window !== "undefined";

  useEffect(() => {
    if (!isBrowser) return;

    // Check WebGL support first
    try {
      const testCanvas = document.createElement("canvas");
      const gl =
        testCanvas.getContext("webgl") ||
        testCanvas.getContext("experimental-webgl");
      if (!gl) {
        console.warn("WebGL not supported, ScrollSection will be disabled");
        setWebglSupported(false);
        return;
      }
    } catch (e) {
      console.warn("WebGL check failed:", e);
      setWebglSupported(false);
      return;
    }

    if (!canvasRef.current || !containerRef.current) return;

    // ── RENDERER ──────────────────────────────────────────────
    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch (err) {
      console.warn("WebGL unavailable, skipping ScrollSection render:", err);
      setWebglSupported(false);
      return;
    }

    // Safe pixel ratio with SSR fallback
    const pixelRatio =
      typeof window !== "undefined"
        ? Math.min(window.devicePixelRatio || 1, 2)
        : 1;

    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    canvasRef.current.appendChild(renderer.domElement);

    // ── SCENE ──────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // ── CAMERA ─────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    camera.position.z = 20;

    // ── POSTPROCESSING ────────────────────────────────────────
    let composer: EffectComposer | null = null;
    let bloomPass: UnrealBloomPass | null = null;

    try {
      composer = new EffectComposer(renderer);
      const renderPass = new RenderPass(scene, camera);
      composer.addPass(renderPass);

      // Bloom — subtle, only affects bright objects
      bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.25, // strength
        0.4, // radius
        0.3, // threshold
      );
      composer.addPass(bloomPass);

      // Vignette
      const vignettePass = new ShaderPass(VignetteShader);
      vignettePass.uniforms.intensity.value = 0.6;
      composer.addPass(vignettePass);

      // Chromatic Aberration
      const chromaPass = new ShaderPass(ChromaticAberrationShader);
      chromaPass.uniforms.intensity.value = 0.0015;
      composer.addPass(chromaPass);

      // Film Grain
      const grainPass = new ShaderPass(GrainShader);
      grainPass.uniforms.intensity.value = 0.03;
      composer.addPass(grainPass);
    } catch (err) {
      console.warn("Post-processing unavailable, using fallback render:", err);
      composer = null;
      bloomPass = null;
    }

    // ── LIGHTS (for atmospheric depth) ──────────────────────
    const ambientLight = new THREE.AmbientLight(0x222244, 0.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xff6644, 0.8);
    dirLight.position.set(10, 10, 10);
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0x4488ff, 0.3);
    backLight.position.set(-5, -5, -10);
    scene.add(backLight);

    // ── CLUSTER CUBES (main) ──────────────────────────────────
    const clusterCubes: THREE.LineSegments[] = [];
    const clusterData: {
      rx: number;
      ry: number;
      floatOff: number;
    }[] = [];

    const clusterCount = 22;
    // Precompute formations for each beat
    const formations = BEATS.map((_, i) => generateFormation(i, clusterCount));

    for (let i = 0; i < clusterCount; i++) {
      const size = Math.random() * 1.8 + 0.5;
      const geo = new THREE.BoxGeometry(size, size, size);
      const edges = new THREE.EdgesGeometry(geo);
      const mat = new THREE.LineBasicMaterial({
        color: 0x8899bb,
        transparent: true,
        opacity: Math.random() * 0.4 + 0.15,
      });
      const cube = new THREE.LineSegments(edges, mat);

      // Start at formation 0
      const pos = formations[0][i];
      cube.position.set(pos.x, pos.y, pos.z);
      cube.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      );

      scene.add(cube);
      clusterCubes.push(cube);
      clusterData.push({
        rx: (Math.random() - 0.5) * 0.005,
        ry: (Math.random() - 0.5) * 0.005,
        floatOff: Math.random() * Math.PI * 2,
      });
    }

    // ── BACKGROUND CUBES ──────────────────────────────────────
    const bgCubes: THREE.LineSegments[] = [];
    const bgData: { rx: number; ry: number; floatOff: number }[] = [];

    for (let i = 0; i < 18; i++) {
      const size = Math.random() * 1.4 + 0.4;
      const geo = new THREE.BoxGeometry(size, size, size);
      const edges = new THREE.EdgesGeometry(geo);
      const mat = new THREE.LineBasicMaterial({
        color: 0x446688,
        transparent: true,
        opacity: Math.random() * 0.08 + 0.02,
      });
      const cube = new THREE.LineSegments(edges, mat);
      cube.position.set(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 22,
        (Math.random() - 0.5) * 16 - 6,
      );
      cube.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      );
      scene.add(cube);
      bgCubes.push(cube);
      bgData.push({
        rx: (Math.random() - 0.5) * 0.003,
        ry: (Math.random() - 0.5) * 0.003,
        floatOff: Math.random() * Math.PI * 2,
      });
    }

    // ── CORE (glowing red icosahedron) ───────────────────────
    const coreGeo = new THREE.IcosahedronGeometry(0.7, 1);
    const coreEdges = new THREE.EdgesGeometry(coreGeo);
    const coreMat = new THREE.LineBasicMaterial({
      color: 0xff3030,
      transparent: true,
      opacity: 0.9,
    });
    const core = new THREE.LineSegments(coreEdges, coreMat);
    scene.add(core);

    // Inner glow (small point light inside core)
    const glowLight = new THREE.PointLight(0xff3030, 0.5, 5);
    glowLight.position.copy(core.position);
    scene.add(glowLight);

    // ── SCROLL STATE ───────────────────────────────────────────
    const state = { progress: 0, velocity: 0 };

    ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: 1.4,
      onUpdate: (self) => {
        state.progress = self.progress;
        state.velocity = self.getVelocity() / 1000;
        // Pulse bloom with scroll
        if (bloomPass) {
          bloomPass.strength = 0.2 + state.progress * 0.3;
        }
      },
    });

    // ── TEXT ANIMATIONS (with stagger) ──────────────────────
    const total = BEATS.length;

    // FIX: Pre-split headline lines into spans from data, not textContent
    rightRefs.current.forEach((el, i) => {
      if (!el) return;
      const headline = el.querySelector(`.${styles.headline}`);
      if (headline) {
        const lines = BEATS[i].headline.split("\n");
        headline.innerHTML = lines
          .map((line) => `<span class="${styles.headlineLine}">${line}</span>`)
          .join("<br>");
      }
    });

    // FIX: Pre-split sub lines into spans from data, not textContent
    leftRefs.current.forEach((el, i) => {
      if (!el) return;
      const sub = el.querySelector(`.${styles.sub}`);
      if (sub) {
        const lines = BEATS[i].sub.split("\n");
        sub.innerHTML = lines
          .map((line) => `<span class="${styles.subLine}">${line}</span>`)
          .join("<br>");
      }
    });

    // Set initial states - only opacity for containers, no opacity reset on lines
    leftRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.set(el, {
        opacity: i === 0 ? 1 : 0,
      });
    });

    rightRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.set(el, {
        opacity: i === 0 ? 1 : 0,
      });
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.4,
      },
    });

    // ─── FIX: BOUNDED ENTER/EXIT WITH REAL WINDOWS ───────────
    BEATS.forEach((_, i) => {
      const leftEl = leftRefs.current[i];
      const rightEl = rightRefs.current[i];
      if (!leftEl || !rightEl) return;

      const start = i / total;
      const end = (i + 1) / total;
      const segment = end - start;

      // Reserve real time for stagger, not just base duration
      const enterDuration = segment * 0.22;
      const staggerBuffer = 0.08; // extra cushion as a fraction of segment
      const enterEnd = start + enterDuration + segment * staggerBuffer;

      const exitStart = start + segment * 0.72; // push exit later, well after enterEnd
      const exitDuration = segment * 0.22;

      if (i > 0) {
        // Left side (sub text) - stagger lines
        const leftLines = leftEl.querySelectorAll(`.${styles.subLine}`);
        tl.fromTo(
          leftLines,
          { yPercent: 40, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            stagger: 0.04, // tighter stagger
            ease: "back.out(1.4)",
            duration: enterDuration,
          },
          start,
        );
        tl.to(
          leftEl,
          { opacity: 1, duration: enterDuration, ease: "none" },
          start,
        );

        // Right side (headline) - stagger lines
        const rightLines = rightEl.querySelectorAll(`.${styles.headlineLine}`);
        tl.fromTo(
          rightLines,
          { yPercent: 40, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            stagger: 0.04, // tighter stagger
            ease: "back.out(1.4)",
            duration: enterDuration,
          },
          start,
        );
        tl.to(
          rightEl,
          { opacity: 1, duration: enterDuration, ease: "none" },
          start,
        );
      }

      if (i < total - 1) {
        // Fade out with blur - starts well after enter completes
        tl.to(
          leftEl,
          {
            opacity: 0,
            duration: exitDuration,
            ease: "power2.in",
          },
          exitStart,
        );
        tl.to(
          leftEl,
          {
            filter: "blur(6px)",
            duration: exitDuration,
            ease: "power2.in",
          },
          exitStart,
        );

        tl.to(
          rightEl,
          {
            opacity: 0,
            duration: exitDuration,
            ease: "power2.in",
          },
          exitStart,
        );
        tl.to(
          rightEl,
          {
            filter: "blur(6px)",
            duration: exitDuration,
            ease: "power2.in",
          },
          exitStart,
        );
      }
    });

    // ── ANIMATION LOOP ────────────────────────────────────────
    let rafId: number;
    const clock = new THREE.Timer();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsed();
      const p = state.progress;
      const velocity = state.velocity || 0;

      // ── 1. CAMERA WAYPOINTS ──────────────────────────────
      const beatFloat = p * (BEATS.length - 1);
      const beatIdx = Math.floor(Math.min(beatFloat, BEATS.length - 1));
      const beatT = Math.min(beatFloat - beatIdx, 1);
      const eased = beatT * beatT * (3 - 2 * beatT); // smoothstep

      const wp0 = CAMERA_WAYPOINTS[Math.min(beatIdx, BEATS.length - 1)];
      const wp1 = CAMERA_WAYPOINTS[Math.min(beatIdx + 1, BEATS.length - 1)];

      camera.position.x = THREE.MathUtils.lerp(wp0.x, wp1.x, eased);
      camera.position.y =
        THREE.MathUtils.lerp(wp0.y, wp1.y, eased) + Math.sin(t * 0.15) * 0.3;
      camera.position.z = THREE.MathUtils.lerp(wp0.z, wp1.z, eased);
      camera.rotation.y = THREE.MathUtils.lerp(wp0.rotY, wp1.rotY, eased);

      // ── 5. SCROLL VELOCITY KICK ──────────────────────────
      const shakeAmount = THREE.MathUtils.clamp(velocity * 0.0002, -0.02, 0.02);
      camera.rotation.z += (shakeAmount - camera.rotation.z) * 0.02;

      camera.lookAt(0, 0, 0);

      // ── 2. CLUSTER FORMATIONS ────────────────────────────
      const bIdx = Math.min(beatIdx, BEATS.length - 1);
      const nextIdx = Math.min(beatIdx + 1, BEATS.length - 1);
      const form0 = formations[bIdx];
      const form1 = formations[nextIdx];

      clusterCubes.forEach((cube, i) => {
        const d = clusterData[i];

        // Rotation drift
        cube.rotation.x += d.rx;
        cube.rotation.y += d.ry;

        // Target position from formation
        const target0 = form0[i];
        const target1 = form1[i];

        // Lerp between formations with slight orbit drift
        const orbitDrift = Math.sin(t * 0.3 + i) * 0.1 * p;
        const floatDrift = Math.sin(t * 0.5 + d.floatOff) * 0.2 * (1 - p * 0.5);

        cube.position.x =
          THREE.MathUtils.lerp(target0.x, target1.x, eased) + orbitDrift;
        cube.position.y =
          THREE.MathUtils.lerp(target0.y, target1.y, eased) + floatDrift;
        cube.position.z = THREE.MathUtils.lerp(target0.z, target1.z, eased);

        // Scale opacity with formation tightness
        const dist = Math.sqrt(
          cube.position.x ** 2 + cube.position.y ** 2 + cube.position.z ** 2,
        );
        const mat = cube.material as THREE.LineBasicMaterial;
        mat.opacity = THREE.MathUtils.clamp(
          0.15 + (1 - dist / 8) * 0.3,
          0.1,
          0.6,
        );
      });

      // ── BACKGROUND DRIFT ──────────────────────────────────
      bgCubes.forEach((cube, i) => {
        const d = bgData[i];
        cube.rotation.x += d.rx;
        cube.rotation.y += d.ry;
        cube.position.y += Math.sin(t * 0.3 + d.floatOff) * 0.001;
      });

      // ── 3. CORE REACTS PER BEAT ──────────────────────────
      const coreMat2 = core.material as THREE.LineBasicMaterial;
      const beatColor = new THREE.Color(BEAT_COLORS[bIdx]).lerp(
        new THREE.Color(BEAT_COLORS[nextIdx]),
        eased,
      );
      coreMat2.color.copy(beatColor);
      glowLight.color.copy(beatColor);

      // Core pulse shape and intensity
      const pulse = 0.6 + Math.sin(t * 4 + p * 2) * 0.35;
      coreMat2.opacity = THREE.MathUtils.clamp(pulse, 0.3, 0.95);
      core.rotation.x = t * 0.6 + p * 2;
      core.rotation.y = t * 0.9 + p * 3;

      const scalePulse = 1 + Math.sin(t * 3.5 + p * 2) * 0.08;
      const baseScale = 0.8 + p * 0.4;
      core.scale.setScalar(baseScale * scalePulse);

      glowLight.intensity = 0.3 + p * 0.4 + Math.sin(t * 4) * 0.1;

      // ── BLOOM ─────────────────────────────────────────────
      if (bloomPass) {
        bloomPass.strength = 0.2 + p * 0.3 + Math.sin(t * 2) * 0.03;
      }

      // Render via composer or fallback to renderer
      if (composer) {
        composer.render();
      } else if (renderer) {
        renderer.render(scene, camera);
      }
    };
    animate();

    // ── RESIZE ──────────────────────────────────────────────────
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      if (renderer) {
        renderer.setSize(w, h);
      }
      if (composer) {
        composer.setSize(w, h);
      }
    };
    window.addEventListener("resize", onResize);

    // ── CLEANUP ─────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      ScrollTrigger.getAll().forEach((t) => t.kill());
      if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
        if (canvasRef.current?.contains(renderer.domElement)) {
          canvasRef.current.removeChild(renderer.domElement);
        }
      }
    };
  }, [isBrowser]);

  // Fallback UI when WebGL is not supported
  if (!webglSupported) {
    return (
      <section ref={containerRef} className={styles.section}>
        <div className={styles.sticky}>
          <div
            className={styles.fallback}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100vh",
              background: "#0a0a0a",
              color: "#666",
              fontSize: "16px",
              padding: "40px",
              textAlign: "center",
            }}
          >
            <div>
              <p style={{ marginBottom: "8px" }}>🌌</p>
              <p>WebGL not supported</p>
              <p style={{ fontSize: "14px", marginTop: "8px", color: "#444" }}>
                This section requires WebGL for 3D rendering
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ─── RENDER ────────────────────────────────────────────────────

  return (
    <section ref={containerRef} className={styles.section}>
      <div className={styles.sticky}>
        <div ref={canvasRef} className={styles.canvas} />

        <div className={styles.noise} />

        <div className={styles.layout}>
          <div className={styles.left}>
            {BEATS.map((beat, i) => (
              <div
                key={i}
                ref={(el) => {
                  leftRefs.current[i] = el;
                }}
                className={styles.leftContent}
              >
                <p className={styles.sub}>
                  {/* FIX: Render spans from data directly */}
                  {beat.sub.split("\n").map((line, j) => (
                    <span key={j} className={styles.subLine}>
                      {line}
                      <br />
                    </span>
                  ))}
                </p>
              </div>
            ))}
          </div>

          <div className={styles.center} />

          <div className={styles.right}>
            {BEATS.map((beat, i) => (
              <div
                key={i}
                ref={(el) => {
                  rightRefs.current[i] = el;
                }}
                className={styles.rightContent}
              >
                <div className={styles.signalRow}>
                  <div className={styles.signalBar} />
                  <div className={styles.signalKanji}>0{i + 1}</div>
                  <div className={styles.signalMeta}>
                    <span className={styles.signalCode}>
                      {beat.signal.split("_")[0]}_{beat.signal.split("_")[1]}
                    </span>
                    <span className={styles.signalTag}>{beat.tag}</span>
                  </div>
                </div>
                <h2 className={styles.headline}>
                  {/* FIX: Render spans from data directly */}
                  {beat.headline.split("\n").map((line, j) => (
                    <span key={j} className={styles.headlineLine}>
                      {line}
                    </span>
                  ))}
                </h2>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.scrollHint}>
          <span className={styles.scrollLine} />
          SCROLL · TRAVERSE
          <span className={styles.scrollLine} />
        </div>
      </div>
    </section>
  );
}
