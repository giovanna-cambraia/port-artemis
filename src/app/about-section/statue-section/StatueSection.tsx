"use client";

import { useEffect, useRef, useState } from "react";
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
} from "./shaders/dionysosShaders";
import "./StatueScene.css";

gsap.registerPlugin(ScrollTrigger);

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
  const stageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [plaqueTitle, setPlaqueTitle] = useState(PLAQUE_TITLES[0]);
  const [progress, setProgress] = useState(0);

  // Ref to hold shader material
  const shaderMaterialRef = useRef<THREE.ShaderMaterial | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const content = contentRef.current;
    if (!stage || !content) return;

    let renderer: THREE.WebGLRenderer;
    let model: THREE.Object3D | null = null;
    let frameId: number;
    let scrollTriggerInstance: ScrollTrigger | undefined;
    const panelTriggers: ScrollTrigger[] = [];
    let disposed = false;

    // ============================================================
    // SCENE SETUP
    // ============================================================
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, 8, 20);

    const camera = new THREE.PerspectiveCamera(
      35,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );
    camera.position.set(0, 0.3, 5.2);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.55;
    stage.appendChild(renderer.domElement);

    // ============================================================
    // POST-PROCESSING
    // ============================================================
    const composer = new EffectComposer(renderer);
    composer.setSize(window.innerWidth, window.innerHeight);

    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.5,
      0.4,
      0.15,
    );
    composer.addPass(bloomPass);

    const chromaPass = new ShaderPass(ChromaticAberrationShader);
    chromaPass.uniforms.intensity.value = 0.0035;
    composer.addPass(chromaPass);

    const grainPass = new ShaderPass(GrainShader);
    grainPass.uniforms.intensity.value = 0.06;
    composer.addPass(grainPass);

    // ============================================================
    // LIGHTING - Dimmed significantly since shader handles its own
    // ============================================================
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

    // ============================================================
    // FOCAL GLOW - subtle accent point
    // ============================================================
    const focalGlow = new THREE.PointLight(0xffffff, 0.5, 3);
    scene.add(focalGlow);

    // Remove the visible sphere or make it very subtle
    // const focalSphere = new THREE.Mesh(
    //   new THREE.SphereGeometry(0.01, 16, 16),
    //   new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 }),
    // );
    // scene.add(focalSphere);

    // ============================================================
    // MODEL LOADING - Using custom ShaderMaterial
    // ============================================================
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        if (disposed) return;
        model = gltf.scene;

        // Clone uniforms so camera pos etc. aren't shared across instances
        const shaderUniforms = THREE.UniformsUtils.clone(dionysosUniforms);
        shaderUniforms.uCameraPos.value = camera.position;

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

        initScroll(model);
      },
      undefined,
      (err) => console.error("Model failed to load", err),
    );

    // ============================================================
    // SCROLL HANDLING
    // ============================================================
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

            // Drive the shader's uProgress directly
            if (shaderMaterialRef.current) {
              shaderMaterialRef.current.uniforms.uProgress.value =
                self.progress;
            }
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

      panelRefs.current.forEach((panel) => {
        if (!panel) return;
        const spacer = panel.closest(".ts-spacer");
        if (!spacer) return;
        gsap.fromTo(
          panel,
          { autoAlpha: 0, y: 30 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.6,
            scrollTrigger: {
              trigger: spacer,
              start: "top 90%",
              end: "bottom 60%",
              toggleActions: "play reverse play reverse",
            },
          },
        );
      });
    }

    // ============================================================
    // ANIMATION LOOP
    // ============================================================
    function animate() {
      frameId = requestAnimationFrame(animate);
      if (model) camera.lookAt(0, 0, 0);

      // Update shader time
      if (shaderMaterialRef.current) {
        shaderMaterialRef.current.uniforms.uTime.value =
          performance.now() * 0.001;
      }

      const t = performance.now() * 0.001;
      focalGlow.intensity = 0.5 + Math.sin(t * 1.2) * 0.2;

      composer.render();
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
      renderer.setSize(width, height);
      composer.setSize(width, height);
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
      ScrollTrigger.getAll().forEach((t) => {
        if (
          t.trigger === content ||
          panelRefs.current.includes(t.trigger as HTMLDivElement)
        ) {
          t.kill();
        }
      });
      renderer.dispose();
      composer.dispose();
      if (stage.contains(renderer.domElement)) {
        stage.removeChild(renderer.domElement);
      }
    };
  }, [modelUrl]);

  return (
    <div className="ts-root">
      <div className="ts-sticky-frame">
        <div className="ts-progress" style={{ width: `${progress}%` }} />
        <div className="ts-canvas-stage" ref={stageRef} />

        <div className="ts-plaque">
          <span>{plaqueTitle}</span>
          scroll to circle the piece
        </div>
      </div>

      <div className="ts-content" ref={contentRef}>
        {SECTIONS.map((section, i) => (
          <div className="ts-spacer" key={section.id}>
            <div
              className={`ts-panel ts-panel-${i + 1}`}
              ref={(el) => {
                panelRefs.current[i] = el;
              }}
            >
              <div className="ts-eyebrow">{section.eyebrow}</div>
              <h2 className="ts-heading">
                {section.title[0]}
                <br />
                {section.title[1]}
              </h2>
              <p className="ts-body">{section.body}</p>
            </div>
          </div>
        ))}
        <div className="ts-spacer" />
      </div>
    </div>
  );
}
