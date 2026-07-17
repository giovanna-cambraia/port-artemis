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
      initX: number;
      initY: number;
      initZ: number;
    }[] = [];

    const clusterCount = 22;
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

      const angle = (i / clusterCount) * Math.PI * 2;
      const radius = Math.random() * 5 + 1.5;
      const ix = Math.cos(angle) * radius;
      const iy = Math.sin(angle) * radius * 0.6;
      const iz = (Math.random() - 0.5) * 6;

      cube.position.set(ix, iy, iz);
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
        initX: ix,
        initY: iy,
        initZ: iz,
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
    const state = { progress: 0 };

    ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: 1.4,
      onUpdate: (self) => {
        state.progress = self.progress;
        // Pulse bloom with scroll
        if (bloomPass) {
          bloomPass.strength = 0.2 + state.progress * 0.3;
        }
      },
    });

    // ── TEXT ANIMATIONS ──────────────────────────────────────
    const total = BEATS.length;

    leftRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.set(el, {
        opacity: i === 0 ? 1 : 0,
        x: i === 0 ? 0 : -50,
        filter: i === 0 ? "blur(0px)" : "blur(6px)",
      });
    });

    rightRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.set(el, {
        opacity: i === 0 ? 1 : 0,
        x: i === 0 ? 0 : 50,
        filter: i === 0 ? "blur(0px)" : "blur(6px)",
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

    BEATS.forEach((_, i) => {
      const leftEl = leftRefs.current[i];
      const rightEl = rightRefs.current[i];
      if (!leftEl || !rightEl) return;

      const start = i / total;
      const end = (i + 1) / total;
      const mid = (start + end) / 2;
      const segment = end - start;

      if (i > 0) {
        tl.to(
          leftEl,
          {
            opacity: 1,
            x: 0,
            filter: "blur(0px)",
            duration: segment / 2,
            ease: "none",
          },
          start,
        );

        tl.to(
          rightEl,
          {
            opacity: 1,
            x: 0,
            filter: "blur(0px)",
            duration: segment / 2,
            ease: "none",
          },
          start,
        );
      }

      if (i < total - 1) {
        tl.to(
          leftEl,
          {
            opacity: 0,
            x: -50,
            filter: "blur(6px)",
            duration: segment / 2,
            ease: "none",
          },
          mid,
        );

        tl.to(
          rightEl,
          {
            opacity: 0,
            x: 50,
            filter: "blur(6px)",
            duration: segment / 2,
            ease: "none",
          },
          mid,
        );
      }
    });

    // ── ANIMATION LOOP ────────────────────────────────────────
    let rafId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const p = state.progress;

      // Camera movement
      camera.position.z = 20 - p * 5;
      camera.position.y = Math.sin(t * 0.15) * 0.3;
      camera.rotation.z = Math.sin(t * 0.1) * 0.008;

      // Cluster rotation & float
      clusterCubes.forEach((cube, i) => {
        const d = clusterData[i];
        cube.rotation.x += d.rx;
        cube.rotation.y += d.ry;

        cube.position.y = d.initY + Math.sin(t * 0.5 + d.floatOff) * 0.25;

        const angle = Math.atan2(d.initX, d.initZ) + p * Math.PI * 0.4;
        const r = Math.sqrt(d.initX * d.initX + d.initZ * d.initZ);
        cube.position.x = Math.sin(angle) * r;
        cube.position.z = Math.cos(angle) * r;
      });

      // Background drift
      bgCubes.forEach((cube, i) => {
        const d = bgData[i];
        cube.rotation.x += d.rx;
        cube.rotation.y += d.ry;
        cube.position.y += Math.sin(t * 0.3 + d.floatOff) * 0.001;
      });

      // Core animation
      core.rotation.x = t * 0.6;
      core.rotation.y = t * 0.9;
      const coreMat2 = core.material as THREE.LineBasicMaterial;
      coreMat2.opacity = 0.6 + Math.sin(t * 4) * 0.35;
      core.scale.setScalar(1 + Math.sin(t * 3.5) * 0.08);
      glowLight.position.copy(core.position);

      // Pulse bloom intensity slightly with core
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
                  {beat.sub.split("\n").map((line, j) => (
                    <span key={j}>
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
