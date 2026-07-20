"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import {
  dionysosVert,
  dionysosFrag,
  uniforms as dionysosUniforms,
  createAsciiAtlas,
} from "./shaders/dionysosShaders";
import { setHandoffCorruption } from "../../immersive-section/lib/corruptionHandoff"; 
import "./StatueScene.css";

gsap.registerPlugin(ScrollTrigger);

// ============================================================
// SPLIT WORDS COMPONENT
// ============================================================
function SplitWords({
  text,
  className,
  groupSize = 1,
}: {
  text: string;
  className?: string;
  groupSize?: number;
}) {
  const words = text.split(" ");
  const groups = [];

  for (let i = 0; i < words.length; i += groupSize) {
    groups.push(words.slice(i, i + groupSize).join(" "));
  }

  return (
    <>
      {groups.map((group, i) => (
        <span className="word-mask" key={i}>
          <span className={`word-inner ${className || ""}`}>
            {group}
            {i < groups.length - 1 ? "\u00A0" : ""}
          </span>
        </span>
      ))}
    </>
  );
}

// ============================================================
// CHROMATIC ABERRATION SHADER
// ============================================================
const ChromaticAberrationShader = {
  uniforms: {
    tDiffuse: { value: null },
    intensity: { value: 0.0035 },
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
      float r = texture2D(tDiffuse, vUv + offset * 0.3).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - offset * 0.3).b;
      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `,
};

// ============================================================
// GRAIN SHADER
// ============================================================
const GrainShader = {
  uniforms: {
    tDiffuse: { value: null },
    intensity: { value: 0.06 },
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

    float random(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float grain = random(vUv * 1000.0) * intensity;
      gl_FragColor = color + vec4(grain, grain, grain, 0.0);
    }
  `,
};

// ============================================================
// FULL SCREEN GLITCH SHADER — SLOWED & SOFTENED
// ============================================================
const FullScreenGlitchShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    amount: { value: 0.0 }, // 0 = clean, 1 = full takeover
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
    uniform float time;
    uniform float amount;
    varying vec2 vUv;

    float rand(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    void main() {
      vec2 uv = vUv;

      // block displacement — coarser = less strobe-y
      float blockY = floor(uv.y * mix(6.0, 20.0, amount)); // was 8.0–40.0
      // SLOWED: re-rolls ~4x/sec instead of 10x/sec
      float blockSeed = rand(vec2(blockY, floor(time * 4.0)));
      // SOFTER: fewer tears (threshold raised from 0.6)
      float shouldTear = step(1.0 - amount * 0.4, blockSeed);
      // SOFTER: reduced displacement from 0.25 to 0.15
      float tearOffset = (rand(vec2(blockSeed, time)) - 0.5) * amount * 0.15;
      uv.x += tearOffset * shouldTear;

      vec4 color = texture2D(tDiffuse, uv);

      // RGB split — reduced from 0.02 to 0.012
      float split = amount * 0.012;
      color.r = texture2D(tDiffuse, uv + vec2(split, 0.0)).r;
      color.b = texture2D(tDiffuse, uv - vec2(split, 0.0)).b;

      // WHITE FLASH FRAMES — REMOVED entirely (was the strobe risk)

      // scanline roll — slower, subtler
      float roll = sin(uv.y * 800.0 - time * 12.0 * amount) * 0.5 + 0.5; // was 40.0
      color.rgb -= pow(roll, 14.0) * amount * 0.15; // was 10 power / 0.3 strength

      // static noise — reduced from 0.4 to 0.25
      float staticNoise = rand(uv * 500.0 + time);
      color.rgb = mix(color.rgb, vec3(staticNoise), amount * amount * 0.25);

      gl_FragColor = color;
    }
  `,
};

const PLAQUE_TITLES = [
  "Torso, marble",
  "Chest, detail",
  "Absence, form",
  "Surface, tool marks",
  "Fragment, complete",
];

const SECTIONS = [
  {
    id: "s1",
    eyebrow: "Excavated fragment — 01",
    title: ["What the", "stone kept"],
    body: "A body without a name. Two thousand years of weather sanded away everything but the parts that mattered most.",
  },
  {
    id: "s2",
    eyebrow: "02 — The torso",
    title: ["Muscle carved", "into memory"],
    body: "Every plane of the chest was cut to catch light at a single hour of a single day, in a workshop that no longer has a name.",
  },
  {
    id: "s3",
    eyebrow: "03 — Loss as form",
    title: ["The missing", "parts speak"],
    body: "No head, no arms, no legend. What survives is turned into the subject itself — absence, sculpted.",
  },
  {
    id: "s4",
    eyebrow: "04 — Surface",
    title: ["Marble", "remembers heat"],
    body: "Under raking light the tool marks resurface — a record of hands that stopped moving centuries ago.",
  },
  {
    id: "s5",
    eyebrow: "05 — Closing",
    title: ["Still standing,", "still unfinished"],
    body: "A fragment outlives the story built around it. This is the last of it, held here — turning, quietly, for anyone who scrolls this far.",
  },
];

interface TorsoScrollProps {
  modelUrl?: string;
}

export default function StatueScene({
  modelUrl = "/models/marble_torso_from_a_statue_of_dionysos.glb",
}: TorsoScrollProps) {
  const router = useRouter();
  const stageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const veilRef = useRef<HTMLDivElement>(null);
  const [plaqueTitle, setPlaqueTitle] = useState(PLAQUE_TITLES[0]);
  const [progress, setProgress] = useState(0);
  const [webglSupported, setWebglSupported] = useState(true);
  const [modelLoadError, setModelLoadError] = useState(false);
  const [screenCorrupt, setScreenCorrupt] = useState(0);
  const [showAbyssButton, setShowAbyssButton] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  // Refs for shader materials and post-processing passes
  const shaderMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const chromaPassRef = useRef<ShaderPass | null>(null);
  const grainPassRef = useRef<ShaderPass | null>(null);
  const fullscreenGlitchPassRef = useRef<ShaderPass | null>(null);
  const isBrowser = typeof window !== "undefined";

  // Ref to track showAbyssButton state inside the effect closure
  const showAbyssButtonRef = useRef(false);

  useEffect(() => {
    if (!isBrowser) return;

    // Check WebGL support first
    try {
      const testCanvas = document.createElement("canvas");
      const gl =
        testCanvas.getContext("webgl") ||
        testCanvas.getContext("experimental-webgl");
      if (!gl) {
        console.warn("WebGL not supported, StatueScene will be disabled");
        setWebglSupported(false);
        return;
      }
    } catch (e) {
      console.warn("WebGL check failed:", e);
      setWebglSupported(false);
      return;
    }

    const stage = stageRef.current;
    const content = contentRef.current;
    if (!stage || !content) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let model: THREE.Object3D | null = null;
    let frameId: number;
    let scrollTriggerInstance: ScrollTrigger | undefined;
    const panelTriggers: ScrollTrigger[] = [];
    let disposed = false;

    try {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000);

      const camera = new THREE.PerspectiveCamera(
        35,
        window.innerWidth / window.innerHeight,
        0.1,
        100,
      );
      camera.position.set(0, 0.5, 6.5);

      // ── RENDERER ──────────────────────────────────────────────
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      } catch (err) {
        console.warn("WebGL unavailable, skipping StatueScene render:", err);
        setWebglSupported(false);
        return;
      }

      // Safe pixel ratio
      const pixelRatio =
        typeof window !== "undefined"
          ? Math.min(window.devicePixelRatio || 1, 2)
          : 1;

      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(pixelRatio);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.55;
      stage.appendChild(renderer.domElement);

      // ============================================================
      // POST-PROCESSING
      // ============================================================
      let composer: EffectComposer | null = null;
      let bloomPass: UnrealBloomPass | null = null;

      try {
        composer = new EffectComposer(renderer);
        composer.setSize(window.innerWidth, window.innerHeight);

        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);

        bloomPass = new UnrealBloomPass(
          new THREE.Vector2(window.innerWidth, window.innerHeight),
          0.3,
          0.4,
          0.15,
        );
        composer.addPass(bloomPass);

        const chromaPass = new ShaderPass(ChromaticAberrationShader);
        chromaPass.uniforms.intensity.value = 0.0035;
        composer.addPass(chromaPass);
        chromaPassRef.current = chromaPass;

        const grainPass = new ShaderPass(GrainShader);
        grainPass.uniforms.intensity.value = 0;
        composer.addPass(grainPass);
        grainPassRef.current = grainPass;

        const fsGlitchPass = new ShaderPass(FullScreenGlitchShader);
        fsGlitchPass.uniforms.amount.value = 0;
        composer.addPass(fsGlitchPass);
        fullscreenGlitchPassRef.current = fsGlitchPass;
      } catch (err) {
        console.warn(
          "Post-processing unavailable, using fallback render:",
          err,
        );
        composer = null;
        bloomPass = null;
      }

      // ── LIGHTS ──────────────────────────────────────────────────
      const key = new THREE.SpotLight(0xffe9cc, 5, 20, Math.PI / 6, 0.6, 2);
      key.position.set(3, 5, 4);
      scene.add(key);

      const rim = new THREE.SpotLight(0xffffff, 8, 20, Math.PI / 5, 0.6, 1.8);
      rim.position.set(-4, 2, -3);
      scene.add(rim);

      const fill = new THREE.AmbientLight(0x2a2a2a, 0.3);
      scene.add(fill);

      const ground = new THREE.Mesh(
        new THREE.CircleGeometry(6, 64),
        new THREE.MeshStandardMaterial({ color: 0x1a1a17, roughness: 1 }),
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -1.4;
      scene.add(ground);

      // ── ARRIVAL SEQUENCE ──────────────────────────────────────
      key.intensity = 0;
      rim.intensity = 0;
      gsap.to(key, {
        intensity: 5,
        duration: 1.8,
        ease: "power2.out",
        delay: 0.2,
      });
      gsap.to(rim, {
        intensity: 8,
        duration: 1.8,
        ease: "power2.out",
        delay: 0.3,
      });
      gsap.to(camera.position, {
        y: 0.3,
        z: 5.2,
        duration: 1.6,
        ease: "power3.out",
        delay: 0.1,
      });
      if (veilRef.current) {
        gsap.to(veilRef.current, {
          opacity: 0,
          duration: 1.4,
          ease: "power2.out",
          delay: 0.15,
        });
      }

      // ============================================================
      // FOCAL GLOW - subtle accent point
      // ============================================================
      const focalGlow = new THREE.PointLight(0xffffff, 0.5, 3);
      scene.add(focalGlow);

      const loader = new GLTFLoader();
      loader.load(
        modelUrl,
        (gltf) => {
          if (disposed) return;
          try {
            model = gltf.scene;

            const shaderUniforms = THREE.UniformsUtils.clone(dionysosUniforms);
            shaderUniforms.uCameraPos.value = camera.position;
            shaderUniforms.uCharTex.value = createAsciiAtlas();
            shaderUniforms.uResolution.value.set(
              window.innerWidth,
              window.innerHeight,
            );

            const dionysosMaterial = new THREE.ShaderMaterial({
              vertexShader: dionysosVert,
              fragmentShader: dionysosFrag,
              uniforms: shaderUniforms,
              side: THREE.DoubleSide,
            });

            model.traverse((c) => {
              if ((c as THREE.Mesh).isMesh) {
                (c as THREE.Mesh).material = dionysosMaterial;
              }
            });

            shaderMaterialRef.current = dionysosMaterial;

            const box = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            box.getSize(size);
            const center = new THREE.Vector3();
            box.getCenter(center);

            const scale = 2.2 / Math.max(size.x, size.y, size.z);
            model.scale.setScalar(scale);
            model.position.sub(center.multiplyScalar(scale));
            model.position.y -= 0.1;
            scene.add(model);

            focalGlow.position.set(0, 0.2, 0.8);

            setModelLoadError(false);
            initScroll(model);
          } catch (err) {
            console.error("Error processing model:", err);
            setModelLoadError(true);
          }
        },
        undefined,
        (err) => {
          console.error("Model failed to load:", err);
          setModelLoadError(true);
        },
      );

      function initScroll(loadedModel: THREE.Object3D) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: content,
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
            onUpdate: (self) => {
              setProgress(self.progress * 100);
              const idx = Math.min(4, Math.floor(self.progress * 5));
              setPlaqueTitle(PLAQUE_TITLES[idx]);

              if (shaderMaterialRef.current) {
                shaderMaterialRef.current.uniforms.uProgress.value =
                  self.progress;
              }

              // ── SHOW ABYSS BUTTON (using ref to avoid dependency issues) ──
              if (self.progress > 0.9 && !showAbyssButtonRef.current) {
                showAbyssButtonRef.current = true;
                setShowAbyssButton(true);
              }
              if (self.progress <= 0.85 && showAbyssButtonRef.current) {
                showAbyssButtonRef.current = false;
                setShowAbyssButton(false);
              }

              // ── ESCALATION: statue corrupts first, THEN screen-wide takeover ──
              const SCREEN_TAKEOVER_START = 0.9;
              const SCREEN_TAKEOVER_FULL = 1.0;
              const takeover = THREE.MathUtils.clamp(
                (self.progress - SCREEN_TAKEOVER_START) /
                  (SCREEN_TAKEOVER_FULL - SCREEN_TAKEOVER_START),
                0,
                1,
              );
              const takeoverEased = takeover * takeover * (3 - 2 * takeover); // smoothstep

              if (chromaPassRef.current) {
                chromaPassRef.current.uniforms.intensity.value =
                  0.0035 + takeoverEased * 0.03;
              }
              if (grainPassRef.current) {
                grainPassRef.current.uniforms.intensity.value =
                  takeoverEased * 0.18;
              }
              if (fullscreenGlitchPassRef.current) {
                fullscreenGlitchPassRef.current.uniforms.amount.value =
                  takeoverEased;
              }

              setScreenCorrupt(takeoverEased);
            },
          },
        });
        scrollTriggerInstance = tl.scrollTrigger;

        tl.to(loadedModel.rotation, { y: Math.PI * 0.55, ease: "none" }, 0)
          .to(camera.position, { x: 1.4, y: 0.6, z: 3.6, ease: "none" }, 0)
          .to(loadedModel.rotation, { y: Math.PI * 1.15, ease: "none" }, 0.25)
          .to(camera.position, { x: -1.6, y: 0.1, z: 3.0, ease: "none" }, 0.25)
          .to(loadedModel.rotation, { y: Math.PI * 1.6, ease: "none" }, 0.5)
          .to(camera.position, { x: -0.6, y: 1.1, z: 2.4, ease: "none" }, 0.5)
          .to(loadedModel.rotation, { y: Math.PI * 2.05, ease: "none" }, 0.75)
          .to(camera.position, { x: 0, y: 0.2, z: 4.4, ease: "none" }, 0.75);

        // ── UPDATED PANEL ANIMATIONS WITH SPLIT WORDS ──
        panelRefs.current.forEach((panel) => {
          if (!panel) return;
          const spacer = panel.closest(".ts-spacer");
          if (!spacer) return;

          const headingWords = panel.querySelectorAll(
            ".ts-heading .word-inner",
          );
          const bodyGroups = panel.querySelectorAll(".ts-body .word-inner");

          // panel itself must become visible — the CSS still has opacity:0 as its base state
          gsap.set(panel, { opacity: 1 });
          gsap.set([headingWords, bodyGroups], { yPercent: 100 });

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: spacer,
              start: "top 80%",
              end: "top 30%",
              scrub: 0.4,
            },
          });

          tl.to(
            headingWords,
            { yPercent: 0, stagger: 0.035, duration: 0.01, ease: "none" },
            0,
          ).to(
            bodyGroups,
            { yPercent: 0, stagger: 0.06, duration: 0.01, ease: "none" },
            0.15,
          );
        });
      }

      // ============================================================
      // ANIMATION LOOP
      // ============================================================
      function animate() {
        frameId = requestAnimationFrame(animate);
        if (model) camera.lookAt(0, 0, 0);

        // Update shader time and camera distance
        if (shaderMaterialRef.current) {
          shaderMaterialRef.current.uniforms.uTime.value =
            performance.now() * 0.001;
          shaderMaterialRef.current.uniforms.uCameraDist.value =
            camera.position.length();
        }

        // Update fullscreen glitch time
        if (fullscreenGlitchPassRef.current) {
          fullscreenGlitchPassRef.current.uniforms.time.value =
            performance.now() * 0.001;
        }

        const t = performance.now() * 0.001;
        focalGlow.intensity = 0.5 + Math.sin(t * 1.2) * 0.2;

        if (composer) {
          composer.render();
        } else if (renderer) {
          renderer.render(scene, camera);
        }
      }
      animate();

      // ============================================================
      // RESIZE HANDLER
      // ============================================================
      function handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        if (renderer) {
          renderer.setSize(width, height);
        }
        if (composer) {
          composer.setSize(width, height);
        }
      }
      window.addEventListener("resize", handleResize);

      // ============================================================
      // CLEANUP
      // ============================================================
      return () => {
        disposed = true;
        window.removeEventListener("resize", handleResize);
        cancelAnimationFrame(frameId);
        scrollTriggerInstance?.kill();
        panelTriggers.forEach((t) => t.kill());
        gsap.killTweensOf([key, rim, camera.position, veilRef.current]);
        ScrollTrigger.getAll().forEach((t) => {
          if (
            t.trigger === content ||
            panelRefs.current.includes(t.trigger as HTMLDivElement)
          ) {
            t.kill();
          }
        });
        if (renderer) {
          renderer.dispose();
          renderer.forceContextLoss();
          if (stage.contains(renderer.domElement)) {
            stage.removeChild(renderer.domElement);
          }
        }
        if (composer) {
          composer.dispose();
        }
      };
    } catch (err) {
      console.error("Error initializing StatueScene:", err);
      setWebglSupported(false);
      return;
    }
  }, [modelUrl, isBrowser]); // Removed showAbyssButton from dependencies

  function handleEnterAbyss() {
    setTransitioning(true);
    setHandoffCorruption(screenCorrupt); // persist the corruption level right before leaving
    setTimeout(() => {
      router.push("/abyss");
    }, 850);
  }

  // Fallback UI when WebGL is not supported
  if (!webglSupported) {
    return (
      <div className="ts-root">
        <div className="ts-sticky-frame">
          <div className="ts-canvas-stage" ref={stageRef} />
          <div className="ts-arrival-veil" ref={veilRef} />
          <div
            className="ts-fallback"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#0a0a0a",
              color: "#666",
              fontSize: "16px",
              padding: "40px",
              textAlign: "center",
              zIndex: 10,
            }}
          >
            <div>
              <p style={{ marginBottom: "8px" }}>🏛️</p>
              <p>WebGL not supported</p>
              <p style={{ fontSize: "14px", marginTop: "8px", color: "#444" }}>
                This section requires WebGL for 3D rendering
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback UI when model fails to load
  if (modelLoadError) {
    return (
      <div className="ts-root">
        <div className="ts-sticky-frame">
          <div className="ts-canvas-stage" ref={stageRef} />
          <div className="ts-arrival-veil" ref={veilRef} />
          <div
            className="ts-fallback"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#0a0a0a",
              color: "#666",
              fontSize: "16px",
              padding: "40px",
              textAlign: "center",
              zIndex: 10,
            }}
          >
            <div>
              <p style={{ marginBottom: "8px" }}>📷</p>
              <p>Model unavailable</p>
              <p style={{ fontSize: "14px", marginTop: "8px", color: "#444" }}>
                The 3D model could not be loaded
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ts-root">
      <div className="ts-sticky-frame">
        <div className="ts-progress" style={{ width: `${progress}%` }} />
        <div className="ts-canvas-stage" ref={stageRef} />
        <div
          className="ts-screen-glitch"
          style={{ ["--screen-corrupt" as any]: screenCorrupt }}
        />
        <div className="ts-arrival-veil" ref={veilRef} />

        <div className="ts-plaque">
          <span>{plaqueTitle}</span>
          scroll to circle the piece
        </div>

        {/* ─── ABYSS BUTTON ─── */}
        {showAbyssButton && (
          <div
            className={`abyss-btn-wrap ${
              transitioning ? "abyss-btn-wrap--leaving" : ""
            }`}
          >
            <button
              className="abyss-btn"
              onClick={handleEnterAbyss}
              disabled={transitioning}
            >
              <span className="abyss-btn-title" data-text="HEAD INTO THE ABYSS">
                HEAD INTO THE ABYSS
              </span>
              <span className="abyss-btn-eyebrow">WHAT REMAINS, CALLS</span>
            </button>
          </div>
        )}

        {/* ─── TRANSITION OVERLAY ─── */}
        {transitioning && (
          <div className="transition-overlay transition-overlay--burst">
            <div className="transition-noise" />
            <div className="transition-scanlines" />
            <div className="transition-flash" />
          </div>
        )}
      </div>

      <div className="ts-content" ref={contentRef}>
        {SECTIONS.map((section, i) => (
          <div className="ts-spacer" key={section.id}>
            <div
              className={`ts-panel ts-panel-${i + 1}`}
              ref={(el) => {
                panelRefs.current[i] = el;
              }}
              style={{
                filter: `blur(${screenCorrupt * 2}px) contrast(${1 + screenCorrupt * 0.5})`,
              }}
            >
              <div className="ts-eyebrow">
                <SplitWords text={section.eyebrow} />
              </div>
              <h2 className="ts-heading">
                <SplitWords text={section.title[0]} className="line1" />
                <br />
                <SplitWords text={section.title[1]} className="line2" />
              </h2>
              <p className="ts-body">
                <SplitWords text={section.body} groupSize={3} />
              </p>
            </div>
          </div>
        ))}
        <div className="ts-spacer" />
      </div>
    </div>
  );
}